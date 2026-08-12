package storage

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"time"

	"TorrentDownloader/backend/models"

	_ "modernc.org/sqlite" // Pure-Go SQLite driver, no CGO required
)

// PersistenceStore stores settings and torrent metadata using SQLite.
// The public API is identical to the old JSON-based store so no other code changes.
type PersistenceStore struct {
	mu      sync.RWMutex
	db      *sql.DB
	dataDir string
}

// NewPersistenceStore opens (or creates) the SQLite database in the OS app-data directory.
func NewPersistenceStore() (*PersistenceStore, error) {
	appData, err := os.UserConfigDir()
	if err != nil {
		appData = os.TempDir()
	}
	dataDir := filepath.Join(appData, "TorrentDownloader")
	return NewPersistenceStoreCustom(dataDir)
}

// NewPersistenceStoreCustom is the same as NewPersistenceStore but with an explicit directory.
// Used by unit tests to get an isolated in-memory or temp-dir database.
func NewPersistenceStoreCustom(dataDir string) (*PersistenceStore, error) {
	if err := os.MkdirAll(dataDir, 0o755); err != nil {
		return nil, fmt.Errorf("failed to create data directory: %w", err)
	}

	dbPath := filepath.Join(dataDir, "app.db")
	db, err := sql.Open("sqlite", dbPath+"?_journal=WAL&_busy_timeout=5000&_foreign_keys=on")
	if err != nil {
		return nil, fmt.Errorf("failed to open sqlite database: %w", err)
	}

	// Single writer connection is fine for a desktop app.
	db.SetMaxOpenConns(1)

	store := &PersistenceStore{db: db, dataDir: dataDir}
	if err := store.migrate(); err != nil {
		_ = db.Close()
		return nil, fmt.Errorf("database migration failed: %w", err)
	}

	// Ensure default download dir exists
	userHome, _ := os.UserHomeDir()
	defaultDownloadDir := filepath.Join(userHome, "Downloads", "Torrents")
	_ = os.MkdirAll(defaultDownloadDir, 0o755)

	// Seed settings row with defaults if it doesn't exist yet
	if err := store.seedDefaultSettings(defaultDownloadDir); err != nil {
		return nil, err
	}

	return store, nil
}

// ─────────────────────────────────────────────
// Schema migrations
// ─────────────────────────────────────────────

func (s *PersistenceStore) migrate() error {
	_, err := s.db.Exec(`
		CREATE TABLE IF NOT EXISTS settings (
			id                  INTEGER PRIMARY KEY CHECK (id = 1),
			download_dir        TEXT    NOT NULL DEFAULT '',
			download_speed_limit INTEGER NOT NULL DEFAULT 0,
			upload_speed_limit  INTEGER NOT NULL DEFAULT 0,
			theme               TEXT    NOT NULL DEFAULT 'system',
			max_active_downloads INTEGER NOT NULL DEFAULT 5
		);

		CREATE TABLE IF NOT EXISTS torrents (
			id          TEXT PRIMARY KEY,
			hash        TEXT NOT NULL,
			name        TEXT NOT NULL DEFAULT '',
			save_path   TEXT NOT NULL DEFAULT '',
			magnet_uri  TEXT NOT NULL DEFAULT '',
			bytes       BLOB,
			is_paused   INTEGER NOT NULL DEFAULT 0,
			added_at    TEXT    NOT NULL
		);
	`)
	return err
}

func (s *PersistenceStore) seedDefaultSettings(defaultDir string) error {
	_, err := s.db.Exec(`
		INSERT OR IGNORE INTO settings (id, download_dir, download_speed_limit, upload_speed_limit, theme, max_active_downloads)
		VALUES (1, ?, 0, 0, 'system', 5)
	`, defaultDir)
	return err
}

// ─────────────────────────────────────────────
// Settings
// ─────────────────────────────────────────────

func (s *PersistenceStore) GetSettings() models.UserSettings {
	s.mu.RLock()
	defer s.mu.RUnlock()

	var st models.UserSettings
	row := s.db.QueryRow(`
		SELECT download_dir, download_speed_limit, upload_speed_limit, theme, max_active_downloads
		FROM settings WHERE id = 1
	`)
	if err := row.Scan(
		&st.DownloadDir,
		&st.DownloadSpeedLimit,
		&st.UploadSpeedLimit,
		&st.Theme,
		&st.MaxActiveDownloads,
	); err != nil {
		// Fallback to safe defaults if the row somehow doesn't exist
		userHome, _ := os.UserHomeDir()
		st.DownloadDir = filepath.Join(userHome, "Downloads", "Torrents")
		st.Theme = "system"
		st.MaxActiveDownloads = 5
	}

	if st.DownloadDir == "" {
		userHome, _ := os.UserHomeDir()
		st.DownloadDir = filepath.Join(userHome, "Downloads", "Torrents")
	}
	return st
}

func (s *PersistenceStore) SaveSettings(settings models.UserSettings) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	_, err := s.db.Exec(`
		INSERT INTO settings (id, download_dir, download_speed_limit, upload_speed_limit, theme, max_active_downloads)
		VALUES (1, ?, ?, ?, ?, ?)
		ON CONFLICT(id) DO UPDATE SET
			download_dir         = excluded.download_dir,
			download_speed_limit = excluded.download_speed_limit,
			upload_speed_limit   = excluded.upload_speed_limit,
			theme                = excluded.theme,
			max_active_downloads = excluded.max_active_downloads
	`,
		settings.DownloadDir,
		settings.DownloadSpeedLimit,
		settings.UploadSpeedLimit,
		settings.Theme,
		settings.MaxActiveDownloads,
	)
	return err
}

// ─────────────────────────────────────────────
// Torrents
// ─────────────────────────────────────────────

func (s *PersistenceStore) GetPersistedTorrents() []models.TorrentPersistData {
	s.mu.RLock()
	defer s.mu.RUnlock()

	rows, err := s.db.Query(`
		SELECT id, hash, name, save_path, magnet_uri, bytes, is_paused, added_at
		FROM torrents ORDER BY added_at ASC
	`)
	if err != nil {
		return nil
	}
	defer rows.Close()

	var result []models.TorrentPersistData
	for rows.Next() {
		var t models.TorrentPersistData
		var isPaused int
		var addedAtStr string
		var bytesData []byte

		if err := rows.Scan(
			&t.ID, &t.Hash, &t.Name, &t.SavePath,
			&t.MagnetURI, &bytesData, &isPaused, &addedAtStr,
		); err != nil {
			continue
		}

		t.IsPaused = isPaused != 0
		t.Bytes = bytesData
		if parsed, err := time.Parse(time.RFC3339, addedAtStr); err == nil {
			t.AddedAt = parsed
		}
		result = append(result, t)
	}
	return result
}

func (s *PersistenceStore) SaveTorrent(t models.TorrentPersistData) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	id := t.ID
	if id == "" {
		id = t.Hash
	}

	isPaused := 0
	if t.IsPaused {
		isPaused = 1
	}

	addedAt := t.AddedAt
	if addedAt.IsZero() {
		addedAt = time.Now()
	}

	_, err := s.db.Exec(`
		INSERT INTO torrents (id, hash, name, save_path, magnet_uri, bytes, is_paused, added_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(id) DO UPDATE SET
			hash       = excluded.hash,
			name       = excluded.name,
			save_path  = excluded.save_path,
			magnet_uri = excluded.magnet_uri,
			bytes      = excluded.bytes,
			is_paused  = excluded.is_paused,
			added_at   = excluded.added_at
	`,
		id, t.Hash, t.Name, t.SavePath, t.MagnetURI,
		t.Bytes, isPaused, addedAt.Format(time.RFC3339),
	)
	return err
}

func (s *PersistenceStore) RemoveTorrent(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	_, err := s.db.Exec(`DELETE FROM torrents WHERE id = ?`, id)
	return err
}

// Close closes the underlying database connection.
func (s *PersistenceStore) Close() error {
	return s.db.Close()
}
