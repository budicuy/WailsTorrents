package storage

import (
	"os"
	"path/filepath"
	"testing"

	"TorrentDownloader/backend/models"
)

func TestPersistenceStore(t *testing.T) {
	// Use t.TempDir() so each test run gets a fresh isolated SQLite database.
	tempDir := t.TempDir()

	store, err := NewPersistenceStoreCustom(tempDir)
	if err != nil {
		t.Fatalf("NewPersistenceStoreCustom failed: %v", err)
	}
	defer store.Close()

	// ── Settings ──────────────────────────────────────────────────────────
	origSettings := store.GetSettings()
	if origSettings.DownloadDir == "" {
		t.Errorf("Expected non-empty default download dir")
	}

	newSettings := origSettings
	newSettings.DownloadSpeedLimit = 1048576
	newSettings.Theme = "dark"
	if err := store.SaveSettings(newSettings); err != nil {
		t.Fatalf("SaveSettings failed: %v", err)
	}

	loaded := store.GetSettings()
	if loaded.Theme != "dark" || loaded.DownloadSpeedLimit != 1048576 {
		t.Errorf("Settings not saved correctly: %+v", loaded)
	}

	// ── Torrents ──────────────────────────────────────────────────────────
	torrent := models.TorrentPersistData{
		ID:        "abc123hash",
		Hash:      "abc123hash",
		Name:      "Ubuntu.iso",
		SavePath:  filepath.Join(tempDir, "Downloads"),
		MagnetURI: "magnet:?xt=urn:btih:abc123hash",
		IsPaused:  false,
	}

	if err := store.SaveTorrent(torrent); err != nil {
		t.Fatalf("SaveTorrent failed: %v", err)
	}

	list := store.GetPersistedTorrents()
	if len(list) != 1 {
		t.Fatalf("Expected 1 persisted torrent, got %d", len(list))
	}
	if list[0].Name != "Ubuntu.iso" {
		t.Errorf("Torrent name mismatch: got %s", list[0].Name)
	}

	// Upsert (update) should not create a second row
	torrent.Name = "Ubuntu-24.iso"
	if err := store.SaveTorrent(torrent); err != nil {
		t.Fatalf("SaveTorrent (upsert) failed: %v", err)
	}
	list2 := store.GetPersistedTorrents()
	if len(list2) != 1 {
		t.Errorf("Expected 1 torrent after upsert, got %d", len(list2))
	}
	if list2[0].Name != "Ubuntu-24.iso" {
		t.Errorf("Upsert did not update name: got %s", list2[0].Name)
	}

	// Remove
	if err := store.RemoveTorrent("abc123hash"); err != nil {
		t.Fatalf("RemoveTorrent failed: %v", err)
	}
	if len(store.GetPersistedTorrents()) != 0 {
		t.Errorf("Expected 0 torrents after removal")
	}
}

var _ = os.PathSeparator
