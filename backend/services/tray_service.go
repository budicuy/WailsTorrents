package services

import (
	"fmt"
	"log"

	"TorrentLite/backend/engine"
	"TorrentLite/backend/models"

	"github.com/wailsapp/wails/v3/pkg/application"
)

type TrayService struct {
	app     *application.App
	window  *application.WebviewWindow
	engine  *engine.AnacrolixEngine
	systray *application.SystemTray
}

func NewTrayService(app *application.App, win *application.WebviewWindow, eng *engine.AnacrolixEngine) *TrayService {
	ts := &TrayService{
		app:    app,
		window: win,
		engine: eng,
	}
	ts.initTray()
	return ts
}

func (ts *TrayService) initTray() {
	if ts.app == nil {
		return
	}

	systray := ts.app.SystemTray.New()
	systray.SetLabel("TorrentLite")

	menu := ts.app.NewMenu()

	// Menu Item 1: Buka TorrentLite
	showItem := menu.Add("📖 Buka TorrentLite")
	showItem.OnClick(func(ctx *application.Context) {
		if ts.window != nil {
			ts.window.Show()
			ts.window.Focus()
		}
	})

	menu.AddSeparator()

	// Menu Item 2: Pause All
	pauseItem := menu.Add("⏸️ Pause All")
	pauseItem.OnClick(func(ctx *application.Context) {
		log.Println("[SystemTray] User requested Pause All")
		if ts.engine != nil {
			for _, t := range ts.engine.GetTorrents() {
				_ = ts.engine.Pause(t.ID)
			}
		}
	})

	// Menu Item 3: Resume All
	resumeItem := menu.Add("▶️ Resume All")
	resumeItem.OnClick(func(ctx *application.Context) {
		log.Println("[SystemTray] User requested Resume All")
		if ts.engine != nil {
			for _, t := range ts.engine.GetTorrents() {
				_ = ts.engine.Resume(t.ID)
			}
		}
	})

	menu.AddSeparator()

	// Menu Item 4: Quit Application
	quitItem := menu.Add("❌ Keluar dari TorrentLite")
	quitItem.OnClick(func(ctx *application.Context) {
		log.Println("[SystemTray] User requested full application exit")
		ts.app.Quit()
	})

	systray.SetMenu(menu)

	// Click tray icon to restore/toggle window
	systray.OnClick(func() {
		if ts.window != nil {
			if ts.window.IsVisible() {
				ts.window.Focus()
			} else {
				ts.window.Show()
				ts.window.Focus()
			}
		}
	})

	ts.systray = systray
	log.Println("[SystemTray] System Tray successfully initialized")
}

// UpdateStats updates the system tray tooltip with current download & upload speeds
func (ts *TrayService) UpdateStats(items []*models.TorrentItem) {
	if ts.systray == nil {
		return
	}

	var totalDownRate, totalUpRate int64
	for _, item := range items {
		if item.Status == "downloading" || item.Status == "seeding" {
			totalDownRate += item.DownloadSpeed
			totalUpRate += item.UploadSpeed
		}
	}

	downFormatted := formatTraySpeed(totalDownRate)
	upFormatted := formatTraySpeed(totalUpRate)

	tooltip := fmt.Sprintf("TorrentLite\n⬇️ %s/s | ⬆️ %s/s", downFormatted, upFormatted)
	ts.systray.SetLabel(tooltip)
}

func formatTraySpeed(bytesPerSec int64) string {
	const (
		KB = 1024
		MB = 1024 * KB
		GB = 1024 * MB
	)
	switch {
	case bytesPerSec >= GB:
		return fmt.Sprintf("%.2f GB", float64(bytesPerSec)/float64(GB))
	case bytesPerSec >= MB:
		return fmt.Sprintf("%.1f MB", float64(bytesPerSec)/float64(MB))
	case bytesPerSec >= KB:
		return fmt.Sprintf("%.0f KB", float64(bytesPerSec)/float64(KB))
	default:
		return fmt.Sprintf("%d B", bytesPerSec)
	}
}
