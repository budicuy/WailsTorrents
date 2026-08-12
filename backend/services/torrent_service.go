package services

import (
	"context"
	"fmt"
	"os"
	"strings"
	"sync"
	"time"

	"TorrentLite/backend/engine"
	"TorrentLite/backend/models"
	"TorrentLite/backend/storage"

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

		// Always pause torrents on app startup so they don't auto-resume download!
		if err == nil && item != nil {
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

	rawBytes, err := os.ReadFile(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to read torrent file: %w", err)
	}

	item, err := s.engine.AddTorrentBytes(rawBytes, downloadDir)
	if err != nil {
		return nil, err
	}

	// Persist with actual rawBytes so it can be restored when app opens next time
	_ = s.store.SaveTorrent(models.TorrentPersistData{
		ID:       item.ID,
		Hash:     item.Hash,
		Name:     item.Name,
		SavePath: downloadDir,
		Bytes:    rawBytes,
		IsPaused: false,
		AddedAt:  time.Now(),
	})

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

func (s *TorrentService) PauseAllTorrents() error {
	torrents := s.engine.GetTorrents()
	for _, t := range torrents {
		_ = s.PauseTorrent(t.ID)
	}
	return nil
}

func (s *TorrentService) ResumeAllTorrents() error {
	torrents := s.engine.GetTorrents()
	for _, t := range torrents {
		_ = s.ResumeTorrent(t.ID)
	}
	return nil
}

func (s *TorrentService) RemoveSelectedTorrents(ids []string, deleteFiles bool) error {
	for _, id := range ids {
		_ = s.RemoveTorrent(id, deleteFiles)
	}
	return nil
}

func (s *TorrentService) RemoveAllTorrents(deleteFiles bool) error {
	torrents := s.engine.GetTorrents()
	ids := make([]string, 0, len(torrents))
	for _, t := range torrents {
		ids = append(ids, t.ID)
	}
	return s.RemoveSelectedTorrents(ids, deleteFiles)
}

func (s *TorrentService) GetTorrents() []*models.TorrentItem {
	return s.engine.GetTorrents()
}

func (s *TorrentService) GetTorrentDetails(id string) (*models.TorrentDetails, error) {
	return s.engine.GetTorrentDetails(id)
}

func hasTorrentStateChanged(oldItems, newItems []*models.TorrentItem) bool {
	if len(oldItems) != len(newItems) {
		return true
	}
	for i, item := range newItems {
		old := oldItems[i]
		if item.ID != old.ID ||
			item.Status != old.Status ||
			item.DownloadedBytes != old.DownloadedBytes ||
			item.DownloadSpeed != old.DownloadSpeed ||
			item.UploadSpeed != old.UploadSpeed ||
			item.Seeds != old.Seeds ||
			item.Peers != old.Peers ||
			item.Progress != old.Progress {
			return true
		}
	}
	return false
}

func (s *TorrentService) runStatsWorker() {
	defer s.wg.Done()

	// 1000ms update interval for low memory payload overhead
	ticker := time.NewTicker(1000 * time.Millisecond)
	defer ticker.Stop()

	var lastTorrents []*models.TorrentItem
	heartbeatCounter := 0

	for {
		select {
		case <-s.ctx.Done():
			return
		case <-ticker.C:
			if s.app != nil {
				torrents := s.engine.GetTorrents()
				heartbeatCounter++

				// Update database when magnet metadata finishes fetching
				for _, item := range torrents {
					if item != nil && item.Name != "" && item.Name != "Fetching metadata..." {
						_ = s.store.SaveTorrent(models.TorrentPersistData{
							ID:       item.ID,
							Hash:     item.Hash,
							Name:     item.Name,
							SavePath: item.SavePath,
							AddedAt:  item.AddedAt,
						})
					}
				}

				// Smart Delta IPC: Emit only when torrent state changes or on 5s heartbeat
				if heartbeatCounter >= 5 || hasTorrentStateChanged(lastTorrents, torrents) {
					s.app.Event.Emit("torrent:stats", torrents)
					lastTorrents = torrents
					heartbeatCounter = 0
				}
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
