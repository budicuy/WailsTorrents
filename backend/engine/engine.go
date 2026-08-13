package engine

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"log"
	"math"
	"os"
	"path/filepath"
	"runtime/debug"
	"sort"
	"sync"
	"time"

	"TorrentLite/backend/models"

	"github.com/anacrolix/torrent"
	"github.com/anacrolix/torrent/metainfo"
	"github.com/anacrolix/torrent/storage"
	"golang.org/x/time/rate"
)

type TorrentEngine interface {
	AddTorrentFile(filePath string, downloadDir string) (*models.TorrentItem, error)
	AddMagnet(magnetURI string, downloadDir string) (*models.TorrentItem, error)
	AddTorrentBytes(raw []byte, savePath string) (*models.TorrentItem, error)
	Start(id string) error
	Pause(id string) error
	Resume(id string) error
	Remove(id string, deleteFiles bool) error
	GetTorrent(id string) (*models.TorrentItem, error)
	GetTorrentDetails(id string) (*models.TorrentDetails, error)
	GetTorrents() []*models.TorrentItem
	SetSpeedLimits(downloadBytesPerSec, uploadBytesPerSec int64)
	Close()
}

type itemState struct {
	id          string
	savePath    string
	magnetURI   string
	torrentFile []byte
	isPaused    bool
	addedAt     time.Time
	completedAt *time.Time
	lastDone    int64
	lastReadAt  time.Time
	dnSpeed     int64
	upSpeed     int64
}

type AnacrolixEngine struct {
	mu              sync.RWMutex
	client          *torrent.Client
	downloadLimiter *rate.Limiter
	uploadLimiter   *rate.Limiter
	torrents        map[string]*torrent.Torrent
	meta            map[string]*itemState
	ctx             context.Context
	cancel          context.CancelFunc
}

func NewAnacrolixEngine(defaultDownloadDir string) (*AnacrolixEngine, error) {
	// Large 256MB burst buffer so socket reads are never throttled
	const burstBytes = 256 << 20
	downloadLimiter := rate.NewLimiter(rate.Inf, burstBytes)
	uploadLimiter := rate.NewLimiter(rate.Inf, burstBytes)

	cfg := torrent.NewDefaultClientConfig()
	cfg.DataDir = defaultDownloadDir
	cfg.NoUpload = false
	cfg.Seed = true

	// High Performance Speed Settings:
	cfg.PieceHashersPerTorrent = 8       // Parallel hashing for fast piece validation
	cfg.EstablishedConnsPerTorrent = 250 // High peer connections per torrent for max download speed
	cfg.HalfOpenConnsPerTorrent = 100
	cfg.TotalHalfOpenConns = 300
	cfg.TorrentPeersHighWater = 2000 // High peer watermark to discover fast seeders
	cfg.TorrentPeersLowWater = 200

	cfg.DropMutuallyCompletePeers = true
	cfg.NoDefaultPortForwarding = false
	cfg.PeriodicallyAnnounceTorrentsToDht = true
	cfg.DownloadRateLimiter = downloadLimiter
	cfg.UploadRateLimiter = uploadLimiter

	client, err := torrent.NewClient(cfg)
	if err != nil {
		log.Printf("[Engine] Default listen port busy, falling back to dynamic port: %v", err)
		cfg.ListenPort = 0
		client, err = torrent.NewClient(cfg)
		if err != nil {
			return nil, fmt.Errorf("failed to create torrent client: %w", err)
		}
	}

	ctx, cancel := context.WithCancel(context.Background())

	engine := &AnacrolixEngine{
		client:          client,
		downloadLimiter: downloadLimiter,
		uploadLimiter:   uploadLimiter,
		torrents:        make(map[string]*torrent.Torrent),
		meta:            make(map[string]*itemState),
		ctx:             ctx,
		cancel:          cancel,
	}

	return engine, nil
}

func (e *AnacrolixEngine) AddTorrentFile(filePath string, downloadDir string) (*models.TorrentItem, error) {
	data, err := os.ReadFile(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to read torrent file: %w", err)
	}
	item, err := e.AddTorrentBytes(data, downloadDir)
	if err != nil {
		return nil, err
	}
	return item, nil
}

func (e *AnacrolixEngine) AddTorrentBytes(raw []byte, savePath string) (*models.TorrentItem, error) {
	mi, err := metainfo.Load(bytes.NewReader(raw))
	if err != nil {
		return nil, fmt.Errorf("invalid torrent file data: %w", err)
	}

	spec := torrent.TorrentSpecFromMetaInfo(mi)

	if savePath != "" {
		spec.Storage = storage.NewFile(savePath)
	}

	t, _, err := e.client.AddTorrentSpec(spec)
	if err != nil {
		return nil, fmt.Errorf("failed to add torrent spec: %w", err)
	}

	id := t.InfoHash().HexString()

	e.mu.Lock()
	e.torrents[id] = t
	e.meta[id] = &itemState{
		id:          id,
		savePath:    savePath,
		torrentFile: raw,
		isPaused:    false,
		addedAt:     time.Now(),
		lastReadAt:  time.Now(),
	}
	e.mu.Unlock()

	t.DownloadAll()

	return e.GetTorrent(id)
}

func (e *AnacrolixEngine) AddMagnet(magnetURI string, downloadDir string) (*models.TorrentItem, error) {
	t, err := e.client.AddMagnet(magnetURI)
	if err != nil {
		return nil, fmt.Errorf("failed to parse magnet link: %w", err)
	}

	id := t.InfoHash().HexString()

	e.mu.Lock()
	e.torrents[id] = t
	e.meta[id] = &itemState{
		id:         id,
		savePath:   downloadDir,
		magnetURI:  magnetURI,
		isPaused:   false,
		addedAt:    time.Now(),
		lastReadAt: time.Now(),
	}
	e.mu.Unlock()

	go func() {
		select {
		case <-t.GotInfo():
			t.DownloadAll()
		case <-e.ctx.Done():
		}
	}()

	return e.GetTorrent(id)
}

func (e *AnacrolixEngine) Start(id string) error {
	return e.Resume(id)
}

func (e *AnacrolixEngine) Pause(id string) error {
	e.mu.Lock()
	defer e.mu.Unlock()

	t, ok := e.torrents[id]
	if !ok {
		return fmt.Errorf("torrent %s not found", id)
	}

	meta, ok := e.meta[id]
	if ok {
		meta.isPaused = true
	}

	t.DisallowDataDownload()
	return nil
}

func (e *AnacrolixEngine) Resume(id string) error {
	e.mu.Lock()
	defer e.mu.Unlock()

	t, ok := e.torrents[id]
	if !ok {
		return fmt.Errorf("torrent %s not found", id)
	}

	meta, ok := e.meta[id]
	if ok {
		meta.isPaused = false
	}

	t.AllowDataDownload()
	t.DownloadAll()
	return nil
}

func (e *AnacrolixEngine) Remove(id string, deleteFiles bool) error {
	e.mu.Lock()
	t, ok := e.torrents[id]
	meta := e.meta[id]
	delete(e.torrents, id)
	delete(e.meta, id)
	e.mu.Unlock()

	if !ok || t == nil {
		return nil
	}

	t.Drop()

	if deleteFiles && meta != nil && meta.savePath != "" {
		info := t.Info()
		if info != nil {
			targetPath := filepath.Join(meta.savePath, info.Name)
			_ = os.RemoveAll(targetPath)
		}
	}

	// Reclaim memory immediately after dropping torrent
	debug.FreeOSMemory()

	return nil
}

func (e *AnacrolixEngine) GetTorrent(id string) (*models.TorrentItem, error) {
	e.mu.Lock()
	t, ok := e.torrents[id]
	meta, metaOk := e.meta[id]
	e.mu.Unlock()

	if !ok || t == nil || !metaOk {
		return nil, fmt.Errorf("torrent %s not found", id)
	}

	item := &models.TorrentItem{
		ID:       id,
		Hash:     id,
		SavePath: meta.savePath,
		AddedAt:  meta.addedAt,
	}

	info := t.Info()
	if info == nil {
		item.Name = "Fetching metadata..."
		item.Status = models.StatusFetchingMeta
		if meta.isPaused {
			item.Status = models.StatusPaused
		}
		return item, nil
	}

	item.Name = info.Name
	item.TotalSize = info.TotalLength()
	bytesCompleted := t.BytesCompleted()
	item.DownloadedBytes = bytesCompleted

	now := time.Now()
	dt := now.Sub(meta.lastReadAt).Seconds()
	if dt > 0.5 {
		diff := bytesCompleted - meta.lastDone
		if diff >= 0 {
			meta.dnSpeed = int64(float64(diff) / dt)
		}
		meta.lastDone = bytesCompleted
		meta.lastReadAt = now
	}

	item.DownloadSpeed = meta.dnSpeed
	// Track upload speed via stats
	statsForUpload := t.Stats()
	item.UploadSpeed = statsForUpload.BytesWrittenData.Int64()

	if item.TotalSize > 0 {
		item.Progress = math.Min(100.0, (float64(bytesCompleted)/float64(item.TotalSize))*100.0)
	}

	stats := t.Stats()
	item.Peers = stats.TotalPeers
	item.Seeds = stats.ConnectedSeeders

	if item.DownloadSpeed > 0 && bytesCompleted < item.TotalSize {
		remaining := item.TotalSize - bytesCompleted
		item.ETASeconds = int64(float64(remaining) / float64(item.DownloadSpeed))
	} else {
		item.ETASeconds = -1
	}

	// Detect piece verification (checking) ONLY if incomplete, active, and not downloading data
	isChecking := false
	if !meta.isPaused && meta.dnSpeed == 0 && (bytesCompleted < item.TotalSize || item.TotalSize == 0) {
		runs := t.PieceStateRuns()
		for _, run := range runs {
			if run.Hashing || run.QueuedForHash || run.Checking {
				isChecking = true
				break
			}
		}
	}

	if meta.isPaused {
		item.Status = models.StatusPaused
	} else if bytesCompleted >= item.TotalSize && item.TotalSize > 0 {
		item.Status = models.StatusCompleted
		if meta.completedAt == nil {
			now := time.Now()
			meta.completedAt = &now
		}
		item.CompletedAt = meta.completedAt
	} else if item.DownloadSpeed > 0 {
		item.Status = models.StatusDownloading
	} else if isChecking {
		item.Status = models.StatusChecking
	} else {
		item.Status = models.StatusDownloading
	}

	return item, nil
}

func (e *AnacrolixEngine) GetTorrentDetails(id string) (*models.TorrentDetails, error) {
	item, err := e.GetTorrent(id)
	if err != nil {
		return nil, err
	}

	details := &models.TorrentDetails{
		TorrentItem: *item,
		Files:       []models.TorrentFile{},
	}

	e.mu.RLock()
	t, ok := e.torrents[id]
	meta := e.meta[id]
	e.mu.RUnlock()

	if !ok || t == nil {
		return details, nil
	}

	if meta != nil {
		details.MagnetURI = meta.magnetURI
	}

	info := t.Info()
	if info != nil {
		details.PieceSize = info.PieceLength
		details.PieceCount = info.NumPieces()

		for idx, tf := range t.Files() {
			details.Files = append(details.Files, models.TorrentFile{
				Index:    idx,
				Path:     tf.Path(),
				Size:     tf.Length(),
				Progress: float64(tf.BytesCompleted()) / float64(tf.Length()) * 100.0,
			})
		}
	}

	return details, nil
}

func (e *AnacrolixEngine) GetTorrents() []*models.TorrentItem {
	e.mu.RLock()
	ids := make([]string, 0, len(e.torrents))
	for id := range e.torrents {
		ids = append(ids, id)
	}
	e.mu.RUnlock()

	result := make([]*models.TorrentItem, 0, len(ids))
	for _, id := range ids {
		if item, err := e.GetTorrent(id); err == nil {
			result = append(result, item)
		}
	}

	// Always sort deterministically by AddedAt descending (newest file on top)
	sort.Slice(result, func(i, j int) bool {
		return result[i].AddedAt.After(result[j].AddedAt)
	})

	return result
}

func (e *AnacrolixEngine) SetSpeedLimits(downloadBytesPerSec, uploadBytesPerSec int64) {
	if downloadBytesPerSec > 0 {
		e.downloadLimiter.SetLimit(rate.Limit(downloadBytesPerSec))
	} else {
		e.downloadLimiter.SetLimit(rate.Inf)
	}

	if uploadBytesPerSec > 0 {
		e.uploadLimiter.SetLimit(rate.Limit(uploadBytesPerSec))
	} else {
		e.uploadLimiter.SetLimit(rate.Inf)
	}
}

func (e *AnacrolixEngine) Close() {
	e.cancel()
	e.mu.Lock()
	defer e.mu.Unlock()

	if e.client != nil {
		e.client.Close()
	}
}

var _ = io.EOF
