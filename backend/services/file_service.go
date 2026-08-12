package services

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"time"

	"TorrentLite/backend/models"

	"github.com/anacrolix/torrent"
	"github.com/anacrolix/torrent/metainfo"
	"github.com/anacrolix/torrent/storage"
	"github.com/wailsapp/wails/v3/pkg/application"
)

type FileService struct {
	app *application.App
}

func NewFileService(app *application.App) *FileService {
	return &FileService{app: app}
}

// OpenDownloadFolder opens Windows Explorer at target folder safely
func (fs *FileService) OpenDownloadFolder(path string) error {
	cleanPath := filepath.Clean(path)

	info, err := os.Stat(cleanPath)
	if err != nil {
		return fmt.Errorf("path does not exist: %w", err)
	}

	if runtime.GOOS == "windows" {
		if !info.IsDir() {
			exec.Command("explorer.exe", "/select,", cleanPath).Run()
		} else {
			exec.Command("explorer.exe", cleanPath).Run()
		}
	} else if runtime.GOOS == "darwin" {
		exec.Command("open", cleanPath).Run()
	} else {
		exec.Command("xdg-open", cleanPath).Run()
	}

	return nil
}

// SelectDownloadDirectory opens native OS dialog to pick a download directory
func (fs *FileService) SelectDownloadDirectory() (string, error) {
	app := fs.app
	if app == nil {
		app = application.Get()
	}

	dialog := app.Dialog.OpenFile().
		SetTitle("Select Download Directory").
		CanChooseDirectories(true).
		CanChooseFiles(false)

	selected, err := dialog.PromptForSingleSelection()
	if err != nil {
		return "", err
	}

	return selected, nil
}

// SelectTorrentFile opens native OS dialog to pick a .torrent file
func (fs *FileService) SelectTorrentFile() (string, error) {
	app := fs.app
	if app == nil {
		app = application.Get()
	}

	dialog := app.Dialog.OpenFile().
		SetTitle("Select Torrent File").
		AddFilter("Torrent Files (*.torrent)", "*.torrent").
		CanChooseDirectories(false).
		CanChooseFiles(true)

	selected, err := dialog.PromptForSingleSelection()
	if err != nil {
		return "", err
	}

	return selected, nil
}

// ValidateDirectory validates whether a directory path is accessible and writable
func (fs *FileService) ValidateDirectory(path string) (bool, string) {
	trimmed := strings.TrimSpace(path)
	if trimmed == "" {
		return false, "Path cannot be empty"
	}

	clean := filepath.Clean(trimmed)

	info, err := os.Stat(clean)
	if os.IsNotExist(err) {
		if err := os.MkdirAll(clean, 0755); err != nil {
			return false, fmt.Errorf("could not create directory: %w", err).Error()
		}
	} else if err != nil {
		return false, err.Error()
	} else if !info.IsDir() {
		return false, "Path is not a directory"
	}

	testFile := filepath.Join(clean, ".writable_test")
	if err := os.WriteFile(testFile, []byte("ok"), 0644); err != nil {
		return false, "Directory is not writable"
	}
	_ = os.Remove(testFile)

	return true, ""
}

// InspectTorrentFile parses a local .torrent file and returns comprehensive metadata details
func (fs *FileService) InspectTorrentFile(filePath string) (*models.TorrentInspectData, error) {
	cleanPath := filepath.Clean(strings.TrimSpace(filePath))
	metaInfo, err := metainfo.LoadFromFile(cleanPath)
	if err != nil {
		return nil, fmt.Errorf("failed to parse torrent metainfo: %w", err)
	}

	info, err := metaInfo.UnmarshalInfo()
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal info dictionary: %w", err)
	}

	var files []models.TorrentFileInfo
	if len(info.Files) > 0 {
		for _, f := range info.Files {
			files = append(files, models.TorrentFileInfo{
				Path: f.DisplayPath(&info),
				Size: f.Length,
			})
		}
	} else {
		files = append(files, models.TorrentFileInfo{
			Path: info.Name,
			Size: info.TotalLength(),
		})
	}

	var trackers []string
	if len(metaInfo.AnnounceList) > 0 {
		for _, tier := range metaInfo.AnnounceList {
			for _, tr := range tier {
				if tr != "" {
					trackers = append(trackers, tr)
				}
			}
		}
	} else if metaInfo.Announce != "" {
		trackers = append(trackers, metaInfo.Announce)
	}

	totalSize := info.TotalLength()
	pieceLen := info.PieceLength
	numPieces := 0
	if pieceLen > 0 {
		numPieces = int((totalSize + pieceLen - 1) / pieceLen)
	}

	return &models.TorrentInspectData{
		Name:           info.Name,
		Hash:           metaInfo.HashInfoBytes().HexString(),
		TotalSize:      totalSize,
		PieceLength:    pieceLen,
		NumPieces:      numPieces,
		CreatedBy:      metaInfo.CreatedBy,
		CreationDate:   metaInfo.CreationDate,
		SourceFilePath: cleanPath,
		Files:          files,
		Trackers:       trackers,
	}, nil
}

// InspectMagnetLink parses a magnet URI and attempts to resolve metadata details (files, total size)
func (fs *FileService) InspectMagnetLink(magnetURI string) (*models.TorrentInspectData, error) {
	trimmed := strings.TrimSpace(magnetURI)
	if !strings.HasPrefix(strings.ToLower(trimmed), "magnet:") {
		return nil, fmt.Errorf("invalid magnet URI scheme")
	}

	mag, err := metainfo.ParseMagnetURI(trimmed)
	if err != nil {
		return nil, fmt.Errorf("failed to parse magnet URI: %w", err)
	}

	name := mag.DisplayName
	if name == "" {
		name = "Magnet Download (" + mag.InfoHash.HexString() + ")"
	}

	trackers := mag.Trackers
	var files []models.TorrentFileInfo
	var totalSize int64
	var pieceLen int64
	var numPieces int

	// Try resolving metadata from peers via dummy in-memory client (timeout: 5s)
	spec, specErr := torrent.TorrentSpecFromMagnetUri(trimmed)
	if specErr == nil {
		cfg := torrent.NewDefaultClientConfig()
		cfg.NoUpload = true
		cfg.NoDefaultPortForwarding = true
		cfg.DefaultStorage = storage.NewFile(os.TempDir())
		cfg.EstablishedConnsPerTorrent = 50

		cl, clientErr := torrent.NewClient(cfg)
		if clientErr == nil {
			defer cl.Close()

			t, _, _ := cl.AddTorrentSpec(spec)
			ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
			defer cancel()

			select {
			case <-t.GotInfo():
				info := t.Info()
				if info != nil {
					if info.Name != "" {
						name = info.Name
					}
					totalSize = info.TotalLength()
					pieceLen = info.PieceLength
					if pieceLen > 0 {
						numPieces = int((totalSize + pieceLen - 1) / pieceLen)
					}

					if len(info.Files) > 0 {
						for _, f := range info.Files {
							files = append(files, models.TorrentFileInfo{
								Path: f.DisplayPath(info),
								Size: f.Length,
							})
						}
					} else {
						files = append(files, models.TorrentFileInfo{
							Path: info.Name,
							Size: totalSize,
						})
					}
				}
			case <-ctx.Done():
				// Metadata lookup timed out; return basic magnet info
			}
		}
	}

	if files == nil {
		files = []models.TorrentFileInfo{}
	}

	return &models.TorrentInspectData{
		Name:           name,
		Hash:           mag.InfoHash.HexString(),
		TotalSize:      totalSize,
		PieceLength:    pieceLen,
		NumPieces:      numPieces,
		CreatedBy:      "Magnet Link",
		CreationDate:   0,
		SourceFilePath: trimmed,
		Files:          files,
		Trackers:       trackers,
	}, nil
}
