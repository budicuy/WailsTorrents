package storage

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"time"

	"TorrentLite/backend/models"
)

type PersistenceStore struct {
	mu       sync.RWMutex
	dataDir  string
	settings models.UserSettings
	torrents map[string]models.TorrentPersistData
}

func NewPersistenceStore() (*PersistenceStore, error) {
	appData, err := os.UserConfigDir()
	if err != nil {
		appData = os.TempDir()
	}

	dataDir := filepath.Join(appData, "TorrentLite")
	return NewPersistenceStoreCustom(dataDir)
}

func NewPersistenceStoreCustom(dataDir string) (*PersistenceStore, error) {
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create app data directory: %w", err)
	}

	userHome, _ := os.UserHomeDir()
	defaultDownloadDir := filepath.Join(userHome, "Downloads", "Torrents")

	defaultSettings := models.UserSettings{
		DownloadDir:        defaultDownloadDir,
		DownloadSpeedLimit: 0,
		UploadSpeedLimit:   0,
		Theme:              "system",
		MaxActiveDownloads: 5,
		UIScale:            100,
	}

	store := &PersistenceStore{
		dataDir:  dataDir,
		settings: defaultSettings,
		torrents: make(map[string]models.TorrentPersistData),
	}

	_ = os.MkdirAll(defaultDownloadDir, 0755)

	_ = store.loadSettings()
	_ = store.loadTorrents()

	if store.settings.DownloadDir == "" {
		store.settings.DownloadDir = defaultDownloadDir
	}

	return store, nil
}

func (s *PersistenceStore) GetSettings() models.UserSettings {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.settings
}

func (s *PersistenceStore) SaveSettings(settings models.UserSettings) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.settings = settings
	return s.saveSettingsLocked()
}

func (s *PersistenceStore) GetPersistedTorrents() []models.TorrentPersistData {
	s.mu.RLock()
	defer s.mu.RUnlock()

	result := make([]models.TorrentPersistData, 0, len(s.torrents))
	for _, t := range s.torrents {
		result = append(result, t)
	}
	return result
}

func (s *PersistenceStore) SaveTorrent(t models.TorrentPersistData) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	key := t.ID
	if key == "" {
		key = t.Hash
	}
	if key == "" {
		return nil
	}

	existing, found := s.torrents[key]
	if found {
		// Preserve non-empty existing fields if incoming fields are empty
		if len(t.Bytes) == 0 {
			t.Bytes = existing.Bytes
		}
		if t.MagnetURI == "" {
			t.MagnetURI = existing.MagnetURI
		}
		if t.Name == "" || t.Name == "Fetching metadata..." {
			if existing.Name != "" {
				t.Name = existing.Name
			}
		}
		if t.SavePath == "" {
			t.SavePath = existing.SavePath
		}
		if t.AddedAt.IsZero() {
			t.AddedAt = existing.AddedAt
		}
	} else if t.AddedAt.IsZero() {
		t.AddedAt = time.Now()
	}

	s.torrents[key] = t
	return s.saveTorrentsLocked()
}

func (s *PersistenceStore) RemoveTorrent(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	delete(s.torrents, id)
	return s.saveTorrentsLocked()
}

func (s *PersistenceStore) Close() error {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.saveTorrentsLocked()
}

func (s *PersistenceStore) settingsPath() string {
	return filepath.Join(s.dataDir, "settings.json")
}

func (s *PersistenceStore) torrentsPath() string {
	return filepath.Join(s.dataDir, "torrents.json")
}

func (s *PersistenceStore) loadSettings() error {
	path := s.settingsPath()
	data, err := os.ReadFile(path)
	if err != nil {
		return err
	}
	var loaded models.UserSettings
	if err := json.Unmarshal(data, &loaded); err != nil {
		return err
	}
	userHome, _ := os.UserHomeDir()
	defaultDownloadDir := filepath.Join(userHome, "Downloads", "Torrents")
	if loaded.DownloadDir == "" {
		loaded.DownloadDir = defaultDownloadDir
	}
	if loaded.UIScale <= 0 {
		loaded.UIScale = 100
	}
	s.settings = loaded
	return nil
}

func (s *PersistenceStore) saveSettingsLocked() error {
	data, err := json.MarshalIndent(s.settings, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(s.settingsPath(), data, 0644)
}

func (s *PersistenceStore) loadTorrents() error {
	path := s.torrentsPath()
	data, err := os.ReadFile(path)
	if err != nil {
		return err
	}
	var list []models.TorrentPersistData
	if err := json.Unmarshal(data, &list); err != nil {
		return err
	}
	for _, t := range list {
		key := t.ID
		if key == "" {
			key = t.Hash
		}
		if key != "" {
			s.torrents[key] = t
		}
	}
	return nil
}

func (s *PersistenceStore) saveTorrentsLocked() error {
	list := make([]models.TorrentPersistData, 0, len(s.torrents))
	for _, t := range s.torrents {
		list = append(list, t)
	}
	data, err := json.MarshalIndent(list, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(s.torrentsPath(), data, 0644)
}
