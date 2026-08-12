package services

import (
	"context"
	"fmt"
	"strings"
	"sync"
	"time"

	"TorrentDownloader/backend/engine"
	"TorrentDownloader/backend/models"
	"TorrentDownloader/backend/storage"

	"github.com/wailsapp/wails/v3/pkg/application"
)

type TorrentService struct {
	app     *application.App
	engine  engine.TorrentEngine
	store   *storage.PersistenceStore
	ctx     context.Context
	cancel  context.CancelFunc
	wg      sync.WaitGroup
	running bool
}

func NewTorrentService(app *application.App, eng engine.TorrentEngine, store *storage.PersistenceStore) *TorrentService {
	ctx, cancel := context.WithCancel(context.Background())
	s := &TorrentService{
		app:     app,
		engine:  eng,
		store:   store,
		ctx:     ctx,
		cancel:  cancel,
		running: true,
	}

	// Restore persisted torrents
	s.restorePersistedTorrents()

	// Start background event ticker (~500ms updates to avoid IPC flooding)
	s.wg.Add(1)
	go s.runStatsWorker()

	return s
}

func (s *TorrentService) restorePersistedTorrents() {
	persisted := s.store.GetPersistedTorrents()
	for _, p := range persisted {
		var item *models.TorrentItem
		var err error

		if p.MagnetURI != "" {
			item, err = s.engine.AddMagnet(p.MagnetURI, p.SavePath)
		} else if len(p.Bytes) > 0 {
			item, err = s.engine.AddTorrentBytes(p.Bytes, p.SavePath)
		}

		if err == nil && item != nil && p.IsPaused {
			_ = s.engine.Pause(item.ID)
		}
	}
}

func (s *TorrentService) AddTorrentFile(filePath string, downloadDir string) (*models.TorrentItem, error) {
	if strings.TrimSpace(filePath) == "" {
		return nil, fmt.Errorf("torrent file path cannot be empty")
	}

	if downloadDir == "" {
		downloadDir = s.store.GetSettings().DownloadDir
	}

	item, err := s.engine.AddTorrentFile(filePath, downloadDir)
	if err != nil {
		return nil, err
	}

	// Persist
	details, _ := s.engine.GetTorrentDetails(item.ID)
	var rawBytes []byte
	if details != nil {
		// Store persist data
		s.store.SaveTorrent(models.TorrentPersistData{
			ID:       item.ID,
			Hash:     item.Hash,
			Name:     item.Name,
			SavePath: downloadDir,
			Bytes:    rawBytes,
			IsPaused: false,
			AddedAt:  time.Now(),
		})
	}

	return item, nil
}

func (s *TorrentService) AddMagnetLink(magnetURI string, downloadDir string) (*models.TorrentItem, error) {
	cleanURI := strings.TrimSpace(magnetURI)
	if !strings.HasPrefix(cleanURI, "magnet:?") {
		return nil, fmt.Errorf("invalid magnet link format")
	}

	if downloadDir == "" {
		downloadDir = s.store.GetSettings().DownloadDir
	}

	item, err := s.engine.AddMagnet(cleanURI, downloadDir)
	if err != nil {
		return nil, err
	}

	// Persist magnet link
	s.store.SaveTorrent(models.TorrentPersistData{
		ID:        item.ID,
		Hash:      item.Hash,
		Name:      item.Name,
		SavePath:  downloadDir,
		MagnetURI: cleanURI,
		IsPaused:  false,
		AddedAt:   time.Now(),
	})

	return item, nil
}

func (s *TorrentService) PauseTorrent(id string) error {
	if err := s.engine.Pause(id); err != nil {
		return err
	}
	item, err := s.engine.GetTorrent(id)
	if err == nil && item != nil {
		s.store.SaveTorrent(models.TorrentPersistData{
			ID:       id,
			Hash:     id,
			Name:     item.Name,
			SavePath: item.SavePath,
			IsPaused: true,
			AddedAt:  item.AddedAt,
		})
	}
	return nil
}

func (s *TorrentService) ResumeTorrent(id string) error {
	if err := s.engine.Resume(id); err != nil {
		return err
	}
	item, err := s.engine.GetTorrent(id)
	if err == nil && item != nil {
		s.store.SaveTorrent(models.TorrentPersistData{
			ID:       id,
			Hash:     id,
			Name:     item.Name,
			SavePath: item.SavePath,
			IsPaused: false,
			AddedAt:  item.AddedAt,
		})
	}
	return nil
}

func (s *TorrentService) RemoveTorrent(id string, deleteFiles bool) error {
	if err := s.engine.Remove(id, deleteFiles); err != nil {
		return err
	}
	return s.store.RemoveTorrent(id)
}

func (s *TorrentService) GetTorrents() []*models.TorrentItem {
	return s.engine.GetTorrents()
}

func (s *TorrentService) GetTorrentDetails(id string) (*models.TorrentDetails, error) {
	return s.engine.GetTorrentDetails(id)
}

func (s *TorrentService) runStatsWorker() {
	defer s.wg.Done()

	ticker := time.NewTicker(500 * time.Millisecond)
	defer ticker.Stop()

	for {
		select {
		case <-s.ctx.Done():
			return
		case <-ticker.C:
			if s.app != nil {
				torrents := s.engine.GetTorrents()
				s.app.Event.Emit("torrent:stats", torrents)
			}
		}
	}
}

func (s *TorrentService) Shutdown() {
	s.cancel()
	s.wg.Wait()
	if s.engine != nil {
		s.engine.Close()
	}
}
