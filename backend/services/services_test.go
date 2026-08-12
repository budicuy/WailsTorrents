package services

import (
	"os"
	"testing"

	"TorrentLite/backend/models"
	"TorrentLite/backend/storage"
)

type MockEngine struct {
	torrents []*models.TorrentItem
}

func (m *MockEngine) AddTorrentFile(filePath string, downloadDir string) (*models.TorrentItem, error) {
	item := &models.TorrentItem{
		ID:       "mock-file-1",
		Name:     "TestFile.iso",
		Status:   models.StatusDownloading,
		SavePath: downloadDir,
	}
	m.torrents = append(m.torrents, item)
	return item, nil
}

func (m *MockEngine) AddMagnet(magnetURI string, downloadDir string) (*models.TorrentItem, error) {
	item := &models.TorrentItem{
		ID:       "mock-magnet-1",
		Name:     "TestMagnet.iso",
		Status:   models.StatusFetchingMeta,
		SavePath: downloadDir,
	}
	m.torrents = append(m.torrents, item)
	return item, nil
}

func (m *MockEngine) AddTorrentBytes(raw []byte, savePath string) (*models.TorrentItem, error) {
	return m.AddTorrentFile("mock.torrent", savePath)
}

func (m *MockEngine) Start(id string) error  { return nil }
func (m *MockEngine) Pause(id string) error  { return nil }
func (m *MockEngine) Resume(id string) error { return nil }
func (m *MockEngine) Remove(id string, deleteFiles bool) error {
	var filtered []*models.TorrentItem
	for _, t := range m.torrents {
		if t.ID != id {
			filtered = append(filtered, t)
		}
	}
	m.torrents = filtered
	return nil
}
func (m *MockEngine) GetTorrent(id string) (*models.TorrentItem, error) {
	for _, t := range m.torrents {
		if t.ID == id {
			return t, nil
		}
	}
	return nil, nil
}
func (m *MockEngine) GetTorrentDetails(id string) (*models.TorrentDetails, error) {
	t, _ := m.GetTorrent(id)
	if t == nil {
		return nil, nil
	}
	return &models.TorrentDetails{TorrentItem: *t}, nil
}
func (m *MockEngine) GetTorrents() []*models.TorrentItem {
	return m.torrents
}
func (m *MockEngine) SetSpeedLimits(downloadBytesPerSec, uploadBytesPerSec int64) {}
func (m *MockEngine) Close()                                                        {}

func TestFileServiceDirectoryValidation(t *testing.T) {
	fs := NewFileService(nil)

	// Test empty path
	valid, _ := fs.ValidateDirectory("")
	if valid {
		t.Errorf("Expected invalid for empty path")
	}

	// Test valid temp directory
	tempDir := t.TempDir()

	valid, msg := fs.ValidateDirectory(tempDir)
	if !valid {
		t.Errorf("Expected valid directory, got error: %s", msg)
	}
}

func TestSettingsService(t *testing.T) {
	store, err := storage.NewPersistenceStoreCustom(t.TempDir())
	if err != nil {
		t.Fatalf("NewPersistenceStoreCustom failed: %v", err)
	}
	defer store.Close()

	mockEng := &MockEngine{}
	ss := NewSettingsService(store, mockEng)

	settings := ss.GetSettings()
	settings.DownloadSpeedLimit = 5 * 1024 * 1024
	settings.Theme = "light"

	if err := ss.SaveSettings(settings); err != nil {
		t.Fatalf("SaveSettings failed: %v", err)
	}

	updated := ss.GetSettings()
	if updated.DownloadSpeedLimit != 5*1024*1024 || updated.Theme != "light" {
		t.Errorf("Settings mismatch: %+v", updated)
	}
}

func TestTorrentServiceWorkflow(t *testing.T) {
	store, err := storage.NewPersistenceStoreCustom(t.TempDir())
	if err != nil {
		t.Fatalf("NewPersistenceStoreCustom failed: %v", err)
	}
	defer store.Close()

	mockEng := &MockEngine{}
	ts := NewTorrentService(nil, mockEng, store)
	defer ts.Shutdown()

	tempDir := t.TempDir()

	// Test Add Magnet
	magnetURI := "magnet:?xt=urn:btih:0123456789abcdef0123456789abcdef01234567"
	item, err := ts.AddMagnetLink(magnetURI, tempDir)
	if err != nil {
		t.Fatalf("AddMagnetLink failed: %v", err)
	}

	if item.ID != "mock-magnet-1" {
		t.Errorf("Expected ID mock-magnet-1, got %s", item.ID)
	}

	torrents := ts.GetTorrents()
	if len(torrents) != 1 {
		t.Errorf("Expected 1 torrent, got %d", len(torrents))
	}

	// Test Pause & Resume
	if err := ts.PauseTorrent("mock-magnet-1"); err != nil {
		t.Errorf("PauseTorrent failed: %v", err)
	}
	if err := ts.ResumeTorrent("mock-magnet-1"); err != nil {
		t.Errorf("ResumeTorrent failed: %v", err)
	}

	// Test Remove
	if err := ts.RemoveTorrent("mock-magnet-1", false); err != nil {
		t.Errorf("RemoveTorrent failed: %v", err)
	}

	if len(ts.GetTorrents()) != 0 {
		t.Errorf("Expected 0 torrents after removal")
	}
}

var _ = os.PathSeparator
