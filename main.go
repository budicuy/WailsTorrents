package main

import (
	"embed"
	"io/fs"
	"log"
	"os"
	"path/filepath"
	"strings"

	"runtime/debug"

	"TorrentLite/backend/engine"
	"TorrentLite/backend/models"
	"TorrentLite/backend/services"
	"TorrentLite/backend/storage"

	"github.com/wailsapp/wails/v3/pkg/application"
	"github.com/wailsapp/wails/v3/pkg/events"
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
	dataDir := filepath.Join(appData, "TorrentLite")
	_ = os.MkdirAll(dataDir, 0755)
	logFile := filepath.Join(dataDir, "app.log")

	f, err := os.OpenFile(logFile, os.O_WRONLY|os.O_CREATE|os.O_APPEND, 0644)
	if err == nil {
		log.SetOutput(f)
	}
	log.Println("=== Application Starting ===")
}

func main() {
	// Optimize Go runtime GC for lower memory footprint
	debug.SetGCPercent(50)                  // Trigger GC at 50% heap growth instead of default 100%
	debug.SetMemoryLimit(512 * 1024 * 1024) // Soft memory cap of 512MB

	setupLogging()

	// 1. Initialize Persistence Store
	store, err := storage.NewPersistenceStore()
	if err != nil {
		log.Printf("ERROR: Failed to initialize persistence store: %v", err)
		return
	}

	// 2. Initialize Torrent Engine
	eng, err := engine.NewAnacrolixEngine(store.GetSettings().DownloadDir)
	if err != nil {
		log.Printf("ERROR: Failed to initialize torrent engine: %v", err)
		return
	}

	// Check if application is invoked via Chrome Native Messaging
	if len(os.Args) > 1 {
		arg := os.Args[1]
		if arg == "--native-messaging" || strings.HasPrefix(arg, "chrome-extension://") {
			services.HandleNativeMessaging(eng, store)
			eng.Close()
			_ = store.Close()
			return
		}
	}

	// 3. Register Protocols (magnet:, torrentlite:, .torrent) and Chrome Native Messaging Host in Windows Registry
	protocolService := services.NewProtocolService()
	_ = protocolService

	// Sub-filesystem so root '/' serves 'frontend/dist/index.html'
	assetsFS, err := fs.Sub(assets, "frontend/dist")
	if err != nil {
		log.Printf("ERROR: Failed to resolve frontend assets filesystem: %v", err)
		return
	}

	// Create Wails App instance
	app := application.New(application.Options{
		Name:        "TorrentLite",
		Description: "A modern BitTorrent Downloader",
		Assets: application.AssetOptions{
			Handler: application.AssetFileServerFS(assetsFS),
		},
		Mac: application.MacOptions{
			ApplicationShouldTerminateAfterLastWindowClosed: false,
		},
	})

	// 4. Initialize Services
	fileService := services.NewFileService(app)
	settingsService := services.NewSettingsService(store, eng)
	torrentService := services.NewTorrentService(app, eng, store)

	// Register Wails Services
	app.RegisterService(application.NewService(fileService))
	app.RegisterService(application.NewService(settingsService))
	app.RegisterService(application.NewService(torrentService))

	// App Window Configuration with 720p Minimum Dimensions (1280x720)
	win := app.Window.NewWithOptions(application.WebviewWindowOptions{
		Title:            "TorrentLite",
		Width:            1280,
		Height:           720,
		MinWidth:         1280,
		MinHeight:        720,
		BackgroundColour: application.NewRGB(15, 23, 42),
		URL:              "/",
	})

	// 5. Start Local HTTP IPC Server for Single Instance & Extension Communication
	services.StartIPCServer(app, eng, store, win)

	// Initialize System Tray Integration
	trayService := services.NewTrayService(app, win, eng)
	_ = trayService

	// Intercept Window Closing event: Hide window to System Tray instead of terminating app
	win.OnWindowEvent(events.Common.WindowClosing, func(e *application.WindowEvent) {
		e.Cancel()
		win.Hide()
		log.Println("[SystemTray] Main window hidden to system tray")
	})

	// Check if launched with a torrent URL argument (e.g., magnet:?xt=... or C:\path\file.torrent)
	if len(os.Args) > 1 {
		for _, arg := range os.Args[1:] {
			if strings.HasPrefix(arg, "magnet:") || strings.HasPrefix(arg, "torrentlite:") || strings.HasSuffix(arg, ".torrent") {
				cleanURL := strings.TrimPrefix(arg, "torrentlite:")
				log.Printf("[Main] Application launched with torrent payload: %s", cleanURL)

				ipcPayload := services.IPCPayload{
					Action: "add_torrent",
					URL:    cleanURL,
				}

				// Try sending to running main instance first
				if !services.SendToRunningInstance(ipcPayload) {
					go func(u string) {
						if strings.HasPrefix(u, "magnet:") {
							_, _ = eng.AddMagnet(u, store.GetSettings().DownloadDir)
						} else if strings.HasSuffix(u, ".torrent") {
							_, _ = eng.AddTorrentFile(u, store.GetSettings().DownloadDir)
						}
					}(cleanURL)
				}
			}
		}
	}

	log.Println("Window initialized with System Tray & IPC enabled, running application loop...")

	// Run application
	err = app.Run()
	if err != nil {
		log.Printf("ERROR: Application runtime error: %v", err)
	}

	// Clean shutdown — order matters: stop engine first, then close DB
	torrentService.Shutdown()
	_ = store.Close()
	log.Println("=== Application Shutdown Cleanly ===")
}
