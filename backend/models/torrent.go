package models

import "time"

type TorrentStatus string

const (
	StatusQueued       TorrentStatus = "Queued"
	StatusChecking     TorrentStatus = "Checking"
	StatusFetchingMeta TorrentStatus = "Fetching Metadata"
	StatusDownloading  TorrentStatus = "Downloading"
	StatusPaused       TorrentStatus = "Paused"
	StatusCompleted    TorrentStatus = "Completed"
	StatusError        TorrentStatus = "Error"
)

type TorrentItem struct {
	ID              string        `json:"id"`
	Name            string        `json:"name"`
	Hash            string        `json:"hash"`
	Status          TorrentStatus `json:"status"`
	Progress        float64       `json:"progress"`        // 0.0 to 100.0
	DownloadSpeed   int64         `json:"downloadSpeed"`   // Bytes per second
	UploadSpeed     int64         `json:"uploadSpeed"`     // Bytes per second
	DownloadedBytes int64         `json:"downloadedBytes"` // Total downloaded
	UploadedBytes   int64         `json:"uploadedBytes"`   // Total uploaded
	TotalSize       int64         `json:"totalSize"`       // Total size in bytes
	ETASeconds      int64         `json:"etaSeconds"`      // -1 if infinite / unknown
	Seeds           int           `json:"seeds"`
	Peers           int           `json:"peers"`
	Ratio           float64       `json:"ratio"`
	SavePath        string        `json:"savePath"`
	AddedAt         time.Time     `json:"addedAt"`
	CompletedAt     *time.Time    `json:"completedAt,omitempty"`
	ErrorMessage    string        `json:"errorMessage,omitempty"`
}

type TorrentFile struct {
	Index    int     `json:"index"`
	Path     string  `json:"path"`
	Size     int64   `json:"size"`
	Progress float64 `json:"progress"` // 0.0 to 100.0
}

type TorrentDetails struct {
	TorrentItem
	Files      []TorrentFile `json:"files"`
	PieceSize  int64         `json:"pieceSize"`
	PieceCount int           `json:"pieceCount"`
	MagnetURI  string        `json:"magnetUri,omitempty"`
}

type UserSettings struct {
	DownloadDir        string `json:"downloadDir"`
	DownloadSpeedLimit int64  `json:"downloadSpeedLimit"` // Bytes per sec, 0 = unlimited
	UploadSpeedLimit   int64  `json:"uploadSpeedLimit"`   // Bytes per sec, 0 = unlimited
	Theme              string `json:"theme"`              // "system", "dark", "light"
	MaxActiveDownloads int    `json:"maxActiveDownloads"`
	UIScale            int    `json:"uiScale"`            // Zoom scale percentage (e.g., 100, 110, 90)
}

type TorrentPersistData struct {
	ID        string    `json:"id"`
	Hash      string    `json:"hash"`
	Name      string    `json:"name"`
	SavePath  string    `json:"savePath"`
	MagnetURI string    `json:"magnetUri,omitempty"`
	Bytes     []byte    `json:"bytes,omitempty"` // raw .torrent bytes if added via file
	IsPaused  bool      `json:"isPaused"`
	AddedAt   time.Time `json:"addedAt"`
}

type TorrentFileInfo struct {
	Path string `json:"path"`
	Size int64  `json:"size"`
}

type TorrentInspectData struct {
	Name           string            `json:"name"`
	Hash           string            `json:"hash"`
	TotalSize      int64             `json:"totalSize"`
	PieceLength    int64             `json:"pieceLength"`
	NumPieces      int               `json:"numPieces"`
	CreatedBy      string            `json:"createdBy"`
	CreationDate   int64             `json:"creationDate"`
	SourceFilePath string            `json:"sourceFilePath"`
	Files          []TorrentFileInfo `json:"files"`
	Trackers       []string          `json:"trackers"`
}
