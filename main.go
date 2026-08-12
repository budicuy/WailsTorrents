package main

import (
	"embed"
	"fmt"
	"io/fs"
	"log"
	"os"
	"path/filepath"

	"TorrentDownloader/backend/engine"
	"TorrentDownloader/backend/models"
	"TorrentDownloader/backend/services"
	"TorrentDownloader/backend/storage"

	"github.com/wailsapp/wails/v3/pkg/application"
)

//go:embed all:frontend/dist
var assets embed.FS

func init() {
	application.RegisterEvent[[]*models.TorrentItem]("torrent:stats")
}

func setupLogging() {
	appData, err := os.UserConfigDir()
	if err != nil {
		appData = os.TempDir()
	}
	dataDir := filepath.Join(appData, "TorrentDownloader")
	_ = os.MkdirAll(dataDir, 0755)
	logFile := filepath.Join(dataDir, "app.log")

	f, err := os.OpenFile(logFile, os.O_WRONLY|os.O_CREATE|os.O_APPEND, 0644)
	if err == nil {
		log.SetOutput(f)
	}
	log.Println("=== Application Starting ===")
}

func main() {
	setupLogging()

	// 1. Initialize Persistence Store
	store, err := storage.NewPersistenceStore()
	if err != nil {
		log.Printf("ERROR: Failed to initialize persistence store: %v", err)
		fmt.Printf("ERROR: Failed to initialize persistence store: %v\n", err)
		return
	}

	// 2. Initialize Torrent Engine
	eng, err := engine.NewAnacrolixEngine(store.GetSettings().DownloadDir)
	if err != nil {
		log.Printf("ERROR: Failed to initialize torrent engine: %v", err)
		fmt.Printf("ERROR: Failed to initialize torrent engine: %v\n", err)
		return
	}

	// Sub-filesystem so root '/' serves 'frontend/dist/index.html'
	assetsFS, err := fs.Sub(assets, "frontend/dist")
	if err != nil {
		log.Printf("ERROR: Failed to resolve frontend assets filesystem: %v", err)
		return
	}

	// Create Wails App instance
	app := application.New(application.Options{
		Name:        "TorrentDownloader",
		Description: "A modern Windows BitTorrent Downloader",
		Assets: application.AssetOptions{
			Handler: application.AssetFileServerFS(assetsFS),
		},
		Mac: application.MacOptions{
			ApplicationShouldTerminateAfterLastWindowClosed: true,
		},
	})

	// 3. Initialize Services
	fileService := services.NewFileService(app)
	settingsService := services.NewSettingsService(store, eng)
	torrentService := services.NewTorrentService(app, eng, store)

	// Register Wails Services
	app.RegisterService(application.NewService(fileService))
	app.RegisterService(application.NewService(settingsService))
	app.RegisterService(application.NewService(torrentService))

	// App Window Configuration with 720p Minimum Dimensions (1280x720)
	win := app.Window.NewWithOptions(application.WebviewWindowOptions{
		Title:            "TorrentDownloader",
		Width:            1280,
		Height:           720,
		MinWidth:         1280,
		MinHeight:        720,
		BackgroundColour: application.NewRGB(15, 23, 42),
		URL:              "/",
	})

	log.Println("Window initialized with minimum 720p resolution, running application loop...")

	// Run application
	err = app.Run()
	if err != nil {
		log.Printf("ERROR: Application runtime error: %v", err)
	}

	// Clean shutdown — order matters: stop engine first, then close DB
	torrentService.Shutdown()
	_ = store.Close()
	log.Println("=== Application Shutdown Cleanly ===")
	_ = win
}
