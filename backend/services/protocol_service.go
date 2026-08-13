package services

import (
	"encoding/json"
	"fmt"
	"log"

	"os"
	"path/filepath"

	"golang.org/x/sys/windows/registry"
)

type ProtocolService struct{}

func NewProtocolService() *ProtocolService {
	ps := &ProtocolService{}
	ps.RegisterProtocolsAndNativeHost()
	return ps
}

// RegisterProtocolsAndNativeHost configures Windows registry for magnet links, .torrent files, and Chrome Native Messaging Host
func (ps *ProtocolService) RegisterProtocolsAndNativeHost() {
	exePath, err := os.Executable()
	if err != nil {
		log.Printf("[ProtocolService] Failed to get executable path: %v", err)
		return
	}

	ps.registerMagnetProtocol(exePath)
	ps.registerCustomProtocol(exePath)
	ps.registerTorrentFileAssociation(exePath)
	ps.registerChromeNativeMessagingHost(exePath)
}

func (ps *ProtocolService) registerMagnetProtocol(exePath string) {
	keyPath := `Software\Classes\magnet`
	key, _, err := registry.CreateKey(registry.CURRENT_USER, keyPath, registry.ALL_ACCESS)
	if err != nil {
		log.Printf("[ProtocolService] Failed to create magnet registry key: %v", err)
		return
	}
	defer key.Close()

	_ = key.SetStringValue("", "URL:Magnet Protocol")
	_ = key.SetStringValue("URL Protocol", "")

	cmdKey, _, err := registry.CreateKey(registry.CURRENT_USER, keyPath+`\shell\open\command`, registry.ALL_ACCESS)
	if err == nil {
		defer cmdKey.Close()
		_ = cmdKey.SetStringValue("", fmt.Sprintf(`"%s" "--add" "%%1"`, exePath))
		log.Println("[ProtocolService] Registered magnet: protocol handler successfully")
	}
}

func (ps *ProtocolService) registerCustomProtocol(exePath string) {
	keyPath := `Software\Classes\torrentlite`
	key, _, err := registry.CreateKey(registry.CURRENT_USER, keyPath, registry.ALL_ACCESS)
	if err != nil {
		return
	}
	defer key.Close()

	_ = key.SetStringValue("", "URL:TorrentLite Protocol")
	_ = key.SetStringValue("URL Protocol", "")

	cmdKey, _, err := registry.CreateKey(registry.CURRENT_USER, keyPath+`\shell\open\command`, registry.ALL_ACCESS)
	if err == nil {
		defer cmdKey.Close()
		_ = cmdKey.SetStringValue("", fmt.Sprintf(`"%s" "--add" "%%1"`, exePath))
	}
}

func (ps *ProtocolService) registerTorrentFileAssociation(exePath string) {
	keyPath := `Software\Classes\.torrent`
	key, _, err := registry.CreateKey(registry.CURRENT_USER, keyPath, registry.ALL_ACCESS)
	if err != nil {
		return
	}
	defer key.Close()

	_ = key.SetStringValue("", "TorrentLite.TorrentFile")

	progKey, _, err := registry.CreateKey(registry.CURRENT_USER, `Software\Classes\TorrentLite.TorrentFile\shell\open\command`, registry.ALL_ACCESS)
	if err == nil {
		defer progKey.Close()
		_ = progKey.SetStringValue("", fmt.Sprintf(`"%s" "--add" "%%1"`, exePath))
		log.Println("[ProtocolService] Registered .torrent file association successfully")
	}
}

type ChromeNativeHostManifest struct {
	Name           string   `json:"name"`
	Description    string   `json:"description"`
	Path           string   `json:"path"`
	Type           string   `json:"type"`
	AllowedOrigins []string `json:"allowed_origins"`
}

func (ps *ProtocolService) registerChromeNativeMessagingHost(exePath string) {
	appData, err := os.UserConfigDir()
	if err != nil {
		appData = os.TempDir()
	}
	dataDir := filepath.Join(appData, "TorrentLite")
	_ = os.MkdirAll(dataDir, 0755)

	manifestPath := filepath.Join(dataDir, "com.torrentlite.chrome.json")

	manifest := ChromeNativeHostManifest{
		Name:        "com.torrentlite.chrome",
		Description: "TorrentLite Native Messaging Host for Google Chrome",
		Path:        exePath,
		Type:        "stdio",
		AllowedOrigins: []string{
			"chrome-extension://enkhdpelfiojdgbcmmkolhbanponpfbd/",
		},
	}

	data, err := json.MarshalIndent(manifest, "", "  ")
	if err != nil {
		return
	}

	err = os.WriteFile(manifestPath, data, 0644)
	if err != nil {
		log.Printf("[ProtocolService] Failed to write Chrome Native Host manifest: %v", err)
		return
	}

	regKeyPath := `Software\Google\Chrome\NativeMessagingHosts\com.torrentlite.chrome`
	key, _, err := registry.CreateKey(registry.CURRENT_USER, regKeyPath, registry.ALL_ACCESS)
	if err != nil {
		log.Printf("[ProtocolService] Failed to create Chrome Native Messaging Registry Key: %v", err)
		return
	}
	defer key.Close()

	_ = key.SetStringValue("", manifestPath)
	log.Println("[ProtocolService] Registered Chrome Native Messaging Host in Windows Registry")
}
