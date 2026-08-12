package services

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"

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
