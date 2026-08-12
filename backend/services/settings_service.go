package services

import (
	"TorrentLite/backend/engine"
	"TorrentLite/backend/models"
	"TorrentLite/backend/storage"
)

type SettingsService struct {
	store  *storage.PersistenceStore
	engine engine.TorrentEngine
}

func NewSettingsService(store *storage.PersistenceStore, engine engine.TorrentEngine) *SettingsService {
	s := &SettingsService{
		store:  store,
		engine: engine,
	}

	// Apply stored speed limits on startup
	settings := store.GetSettings()
	if engine != nil {
		engine.SetSpeedLimits(settings.DownloadSpeedLimit, settings.UploadSpeedLimit)
	}

	return s
}

func (s *SettingsService) GetSettings() models.UserSettings {
	return s.store.GetSettings()
}

func (s *SettingsService) SaveSettings(settings models.UserSettings) error {
	if err := s.store.SaveSettings(settings); err != nil {
		return err
	}
	if s.engine != nil {
		s.engine.SetSpeedLimits(settings.DownloadSpeedLimit, settings.UploadSpeedLimit)
	}
	return nil
}
