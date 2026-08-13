package services

import (
	"encoding/base64"
	"encoding/binary"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"TorrentLite/backend/engine"
	"TorrentLite/backend/storage"
)

type NativeMessageRequest struct {
	Action     string `json:"action"`
	URL        string `json:"url"`
	Type       string `json:"type"`
	Base64Data string `json:"base64_data"`
}

type NativeMessageResponse struct {
	Status  string `json:"status"`
	Message string `json:"message"`
}

func HandleNativeMessaging(eng *engine.AnacrolixEngine, store *storage.PersistenceStore) {
	log.Println("[NativeMessaging] Native Host started via Chrome stdio")

	reader := os.Stdin
	writer := os.Stdout

	for {
		var length uint32
		err := binary.Read(reader, binary.LittleEndian, &length)
		if err != nil {
			if err != io.EOF {
				log.Printf("[NativeMessaging] Read length error: %v", err)
			}
			break
		}

		if length == 0 || length > 10*1024*1024 {
			log.Printf("[NativeMessaging] Invalid payload length: %d", length)
			break
		}

		buf := make([]byte, length)
		_, err = io.ReadFull(reader, buf)
		if err != nil {
			log.Printf("[NativeMessaging] Read payload error: %v", err)
			break
		}

		var req NativeMessageRequest
		err = json.Unmarshal(buf, &req)
		if err != nil {
			log.Printf("[NativeMessaging] JSON unmarshal error: %v", err)
			sendNativeResponse(writer, NativeMessageResponse{
				Status:  "error",
				Message: "Invalid JSON request",
			})
			continue
		}

		log.Printf("[NativeMessaging] Received action: %s, url: %s, base64_len: %d", req.Action, req.URL, len(req.Base64Data))

		ipcPayload := IPCPayload{
			Action:     req.Action,
			URL:        req.URL,
			Type:       req.Type,
			Base64Data: req.Base64Data,
		}

		// First try sending payload to running main instance of TorrentLite via local IPC
		if SendToRunningInstance(ipcPayload) {
			log.Println("[NativeMessaging] Successfully forwarded request to running main TorrentLite instance")
			sendNativeResponse(writer, NativeMessageResponse{
				Status:  "success",
				Message: "Torrent successfully sent to TorrentLite",
			})
			continue
		}

		// Fallback: If no main instance running, handle directly in this process
		downloadDir := store.GetSettings().DownloadDir
		var addErr error

		if req.Base64Data != "" {
			rawBytes, err := base64.StdEncoding.DecodeString(req.Base64Data)
			if err != nil {
				addErr = fmt.Errorf("invalid base64 torrent data: %w", err)
			} else {
				_, addErr = eng.AddTorrentBytes(rawBytes, downloadDir)
			}
		} else if req.URL != "" && (req.Action == "add_torrent" || req.Action == "add_magnet") {
			if req.Type == "magnet" || isMagnetURL(req.URL) {
				_, addErr = eng.AddMagnet(req.URL, downloadDir)
			} else if strings.HasPrefix(req.URL, "http://") || strings.HasPrefix(req.URL, "https://") {
				bytes, err := fetchTorrentURL(req.URL)
				if err != nil {
					addErr = fmt.Errorf("failed to fetch torrent URL: %w", err)
				} else {
					_, addErr = eng.AddTorrentBytes(bytes, downloadDir)
				}
			} else {
				_, addErr = eng.AddTorrentFile(req.URL, downloadDir)
			}
		} else {
			addErr = fmt.Errorf("unknown action or empty payload")
		}

		if addErr != nil {
			log.Printf("[NativeMessaging] Fallback add error: %v", addErr)
			sendNativeResponse(writer, NativeMessageResponse{
				Status:  "error",
				Message: addErr.Error(),
			})
		} else {
			log.Println("[NativeMessaging] Fallback add succeeded")
			sendNativeResponse(writer, NativeMessageResponse{
				Status:  "success",
				Message: "Torrent added successfully to TorrentLite",
			})
		}
	}
}

func fetchTorrentURL(url string) ([]byte, error) {
	client := &http.Client{Timeout: 15 * time.Second}
	resp, err := client.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("HTTP error %d", resp.StatusCode)
	}

	return io.ReadAll(resp.Body)
}

func sendNativeResponse(w io.Writer, resp NativeMessageResponse) {
	data, err := json.Marshal(resp)
	if err != nil {
		return
	}
	length := uint32(len(data))
	_ = binary.Write(w, binary.LittleEndian, length)
	_, _ = w.Write(data)
}

func isMagnetURL(url string) bool {
	return len(url) > 7 && url[:7] == "magnet:"
}
