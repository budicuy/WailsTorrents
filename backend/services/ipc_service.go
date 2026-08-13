package services

import (
	"bytes"
	"encoding/base64"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"time"

	"TorrentLite/backend/engine"
	"TorrentLite/backend/storage"

	"github.com/wailsapp/wails/v3/pkg/application"
)

const IPCPort = "18989"

type IPCPayload struct {
	Action     string `json:"action"`
	URL        string `json:"url"`
	Type       string `json:"type"`
	Base64Data string `json:"base64_data"`
}

type IPCService struct {
	app    *application.App
	engine *engine.AnacrolixEngine
	store  *storage.PersistenceStore
	window *application.WebviewWindow
}

func StartIPCServer(app *application.App, eng *engine.AnacrolixEngine, store *storage.PersistenceStore, win *application.WebviewWindow) {
	ipc := &IPCService{
		app:    app,
		engine: eng,
		store:  store,
		window: win,
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/add", ipc.handleAdd)
	mux.HandleFunc("/ping", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("pong"))
	})

	server := &http.Server{
		Addr:    "127.0.0.1:" + IPCPort,
		Handler: mux,
	}

	go func() {
		log.Printf("[IPCServer] Listening on http://127.0.0.1:%s", IPCPort)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Printf("[IPCServer] Server stopped: %v", err)
		}
	}()
}

func SendToRunningInstance(payload IPCPayload) bool {
	data, err := json.Marshal(payload)
	if err != nil {
		return false
	}

	client := &http.Client{Timeout: 3 * time.Second}
	resp, err := client.Post("http://127.0.0.1:"+IPCPort+"/add", "application/json", bytes.NewBuffer(data))
	if err != nil {
		return false
	}
	defer resp.Body.Close()
	return resp.StatusCode == http.StatusOK
}

func (ipc *IPCService) handleAdd(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	var req IPCPayload
	if err := json.Unmarshal(body, &req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	log.Printf("[IPCServer] Received confirmed download from Chrome: action=%s, url=%s, base64_len=%d", req.Action, req.URL, len(req.Base64Data))

	// Restore & Focus main window so TorrentLite pops up on screen!
	if ipc.window != nil {
		ipc.window.Show()
		ipc.window.UnMinimise()
		ipc.window.Focus()
	}

	downloadDir := ipc.store.GetSettings().DownloadDir
	var addErr error

	if req.Base64Data != "" {
		rawBytes, err := base64.StdEncoding.DecodeString(req.Base64Data)
		if err != nil {
			addErr = err
		} else {
			_, addErr = ipc.engine.AddTorrentBytes(rawBytes, downloadDir)
		}
	} else if req.URL != "" {
		if req.Type == "magnet" || isMagnetURL(req.URL) {
			_, addErr = ipc.engine.AddMagnet(req.URL, downloadDir)
		} else {
			_, addErr = ipc.engine.AddTorrentFile(req.URL, downloadDir)
		}
	}

	if addErr != nil {
		log.Printf("[IPCServer] Failed to add confirmed torrent: %v", addErr)
		w.WriteHeader(http.StatusInternalServerError)
		_, _ = w.Write([]byte(addErr.Error()))
	} else {
		log.Printf("[IPCServer] Successfully added confirmed torrent directly to engine")
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("OK"))
	}
}
