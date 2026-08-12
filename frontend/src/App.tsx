import { Events } from "@wailsio/runtime";
import { useCallback, useEffect, useState } from "react";
import {
	FileService,
	SettingsService,
	TorrentService,
} from "../bindings/TorrentLite/backend/services/index";
import { Navbar } from "./components/layout/Navbar";
import { Sidebar } from "./components/layout/Sidebar";
import { SplashScreen } from "./components/layout/SplashScreen";
import { AddMagnetModal } from "./components/modals/AddMagnetModal";
import { AddTorrentModal } from "./components/modals/AddTorrentModal";
import { RemoveConfirmModal } from "./components/modals/RemoveConfirmModal";
import { TorrentDetailModal } from "./components/modals/TorrentDetailModal";
import { TorrentList } from "./components/modals/torrents/TorrentList";
import { SettingsPage } from "./pages/SettingsPage";
import type {
	TorrentDetails,
	TorrentItem,
	UserSettings,
	ViewFilter,
} from "./types/torrent";

export function App() {
	const [torrents, setTorrents] = useState<TorrentItem[]>([]);
	const [currentView, setCurrentView] = useState<ViewFilter | "settings">(
		"all",
	);
	const [searchQuery, setSearchQuery] = useState("");
	const [settings, setSettings] = useState<UserSettings>({
		downloadDir: "",
		downloadSpeedLimit: 0,
		uploadSpeedLimit: 0,
		theme: "system",
		maxActiveDownloads: 5,
		uiScale: 100,
	});

	const [isAppLoading, setIsAppLoading] = useState(true);
	const [showSplashScreen, setShowSplashScreen] = useState(true);

	const [isAddTorrentOpen, setIsAddTorrentOpen] = useState(false);
	const [isAddMagnetOpen, setIsAddMagnetOpen] = useState(false);
	const [selectedDetailId, setSelectedDetailId] = useState<string | null>(null);
	const [removeTarget, setRemoveTarget] = useState<{
		id: string;
		name: string;
	} | null>(null);

	// Fetch initial data
	const loadInitialData = useCallback(async () => {
		try {
			const initialTorrents = await TorrentService.GetTorrents();
			if (Array.isArray(initialTorrents)) {
				setTorrents(initialTorrents as unknown as TorrentItem[]);
			}

			const initialSettings = await SettingsService.GetSettings();
			if (initialSettings) {
				setSettings(initialSettings as unknown as UserSettings);
			}
		} catch (err) {
			console.error("Failed to load initial application data:", err);
		} finally {
			setIsAppLoading(false);
		}
	}, []);

	useEffect(() => {
		loadInitialData();

		// Listen to real-time throttled stats event from Go backend
		const unsubscribe = Events.On("torrent:stats", (event) => {
			if (event && Array.isArray(event.data)) {
				setTorrents(event.data as unknown as TorrentItem[]);
			} else if (event?.data) {
				setTorrents([event.data] as unknown as TorrentItem[]);
			}
		});

		return () => {
			if (unsubscribe) unsubscribe();
		};
	}, [loadInitialData]);

	// Apply active theme (dark, light, or system) to documentElement
	useEffect(() => {
		const applyTheme = () => {
			const themeMode = settings.theme || "system";
			let isDark = true;

			if (themeMode === "dark") {
				isDark = true;
			} else if (themeMode === "light") {
				isDark = false;
			} else {
				isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
			}

			if (isDark) {
				document.documentElement.classList.add("dark");
				document.documentElement.classList.remove("light");
			} else {
				document.documentElement.classList.add("light");
				document.documentElement.classList.remove("dark");
			}
		};

		applyTheme();

		const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
		const handleChange = () => {
			if ((settings.theme || "system") === "system") {
				applyTheme();
			}
		};

		mediaQuery.addEventListener("change", handleChange);
		return () => mediaQuery.removeEventListener("change", handleChange);
	}, [settings.theme]);

	const handleSaveSettings = useCallback(async (newSettings: UserSettings) => {
		await SettingsService.SaveSettings(
			newSettings as unknown as Parameters<
				typeof SettingsService.SaveSettings
			>[0],
		);
		setSettings(newSettings);
	}, []);

	// Apply UI Zoom scale via root font-size scaling
	useEffect(() => {
		const scale = settings.uiScale || 100;
		document.documentElement.style.fontSize = `${scale}%`;
	}, [settings.uiScale]);

	// Global Keyboard Shortcuts (Ctrl +, Ctrl -, Ctrl 0, Ctrl N, Ctrl M, Ctrl ,)
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			const isCtrl = e.ctrlKey || e.metaKey;
			if (!isCtrl) return;

			const key = e.key.toLowerCase();

			if (key === "=" || key === "+" || e.code === "NumpadAdd") {
				e.preventDefault();
				const current = settings.uiScale || 100;
				const nextScale = Math.min(150, current + 10);
				handleSaveSettings({ ...settings, uiScale: nextScale });
			} else if (key === "-" || e.code === "NumpadSubtract") {
				e.preventDefault();
				const current = settings.uiScale || 100;
				const nextScale = Math.max(75, current - 10);
				handleSaveSettings({ ...settings, uiScale: nextScale });
			} else if (key === "0" || e.code === "Numpad0") {
				e.preventDefault();
				handleSaveSettings({ ...settings, uiScale: 100 });
			} else if (key === "n") {
				e.preventDefault();
				setIsAddTorrentOpen(true);
			} else if (key === "m") {
				e.preventDefault();
				setIsAddMagnetOpen(true);
			} else if (key === ",") {
				e.preventDefault();
				setCurrentView("settings");
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [settings, handleSaveSettings]);

	// Actions
	const handlePause = useCallback(async (id: string) => {
		try {
			await TorrentService.PauseTorrent(id);
		} catch (err) {
			console.error("Failed to pause torrent:", err);
		}
	}, []);

	const handleResume = useCallback(async (id: string) => {
		try {
			await TorrentService.ResumeTorrent(id);
		} catch (err) {
			console.error("Failed to resume torrent:", err);
		}
	}, []);

	const handlePauseAll = useCallback(async () => {
		try {
			await TorrentService.PauseAllTorrents();
			loadInitialData();
		} catch (err) {
			console.error("Failed to pause all torrents:", err);
		}
	}, [loadInitialData]);

	const handleResumeAll = useCallback(async () => {
		try {
			await TorrentService.ResumeAllTorrents();
			loadInitialData();
		} catch (err) {
			console.error("Failed to resume all torrents:", err);
		}
	}, [loadInitialData]);

	const handleConfirmRemove = useCallback(
		async (id: string, deleteFiles: boolean) => {
			if (!removeTarget) return;
			try {
				if (id === "all") {
					await TorrentService.RemoveAllTorrents(deleteFiles);
				} else if (id.includes(",")) {
					const ids = id.split(",");
					await TorrentService.RemoveSelectedTorrents(ids, deleteFiles);
				} else {
					await TorrentService.RemoveTorrent(id, deleteFiles);
				}
				loadInitialData();
			} catch (err) {
				console.error("Failed to remove torrent(s):", err);
			} finally {
				setRemoveTarget(null);
			}
		},
		[removeTarget, loadInitialData],
	);

	const handleOpenFolder = useCallback(async (path: string) => {
		try {
			await FileService.OpenDownloadFolder(path);
		} catch (err) {
			console.error("Failed to open download folder:", err);
		}
	}, []);

	const handleSelectFile = async (): Promise<string> => {
		try {
			return await FileService.SelectTorrentFile();
		} catch (err) {
			console.error(err);
			return "";
		}
	};

	const handleSelectFolder = async (): Promise<string> => {
		try {
			return await FileService.SelectDownloadDirectory();
		} catch (err) {
			console.error(err);
			return "";
		}
	};

	const handleAddTorrentFile = async (
		filePath: string,
		downloadDir: string,
	) => {
		await TorrentService.AddTorrentFile(filePath, downloadDir);
		loadInitialData();
	};

	const handleAddMagnetLink = async (
		magnetURI: string,
		downloadDir: string,
	) => {
		await TorrentService.AddMagnetLink(magnetURI, downloadDir);
		loadInitialData();
	};

	const handleFetchDetails = async (
		id: string,
	): Promise<TorrentDetails | null> => {
		try {
			const res = await TorrentService.GetTorrentDetails(id);
			return res as unknown as TorrentDetails;
		} catch (err) {
			console.error("Failed to fetch torrent details:", err);
			return null;
		}
	};

	// Safe Array Reference
	const safeTorrents = Array.isArray(torrents) ? torrents : [];

	// Transfer totals for navbar
	const totalDnSpeed = safeTorrents.reduce(
		(acc, t) => acc + (t?.downloadSpeed || 0),
		0,
	);
	const totalUpSpeed = safeTorrents.reduce(
		(acc, t) => acc + (t?.uploadSpeed || 0),
		0,
	);

	// Category counts
	const counts = {
		all: safeTorrents.length,
		downloading: safeTorrents.filter(
			(t) =>
				t?.status === "Downloading" ||
				t?.status === "Fetching Metadata" ||
				t?.status === "Checking",
		).length,
		completed: safeTorrents.filter((t) => t?.status === "Completed").length,
		paused: safeTorrents.filter((t) => t?.status === "Paused").length,
		error: safeTorrents.filter((t) => t?.status === "Error").length,
	};

	return (
		<div className="flex flex-col h-full w-full bg-slate-950 text-slate-100 overflow-hidden select-none app-shell">
			{showSplashScreen && (
				<SplashScreen
					isLoading={isAppLoading}
					onFinished={() => setShowSplashScreen(false)}
				/>
			)}

			{/* Top Navbar */}
			<Navbar
				totalDnSpeed={totalDnSpeed}
				totalUpSpeed={totalUpSpeed}
				searchQuery={searchQuery}
				onSearchChange={setSearchQuery}
				onOpenAddTorrent={() => setIsAddTorrentOpen(true)}
				onOpenAddMagnet={() => setIsAddMagnetOpen(true)}
			/>

			{/* Main Content Shell */}
			<div className="flex-1 flex overflow-hidden">
				{/* Left Sidebar */}
				<Sidebar
					currentView={currentView}
					onSelectView={setCurrentView}
					counts={counts}
				/>

				{/* Center Panel View */}
				<main className="flex-1 bg-slate-950 relative overflow-hidden">
					{currentView === "settings" ? (
						<SettingsPage
							settings={settings}
							onSaveSettings={handleSaveSettings}
							onSelectFolder={handleSelectFolder}
						/>
					) : (
						<TorrentList
							torrents={safeTorrents}
							currentView={currentView}
							searchQuery={searchQuery}
							onPause={handlePause}
							onResume={handleResume}
							onPauseAll={handlePauseAll}
							onResumeAll={handleResumeAll}
							onOpenFolder={handleOpenFolder}
							onShowDetails={(id) => setSelectedDetailId(id)}
							onRemoveRequest={(id, name) => setRemoveTarget({ id, name })}
							onRemoveAllRequest={() =>
								setRemoveTarget({ id: "all", name: "All Torrents" })
							}
							onRemoveSelectedRequest={(ids) =>
								setRemoveTarget({
									id: ids.join(","),
									name: `${ids.length} selected torrents`,
								})
							}
							onOpenAddTorrent={() => setIsAddTorrentOpen(true)}
							onOpenAddMagnet={() => setIsAddMagnetOpen(true)}
						/>
					)}
				</main>
			</div>

			{/* Dialog Modals */}
			<AddTorrentModal
				isOpen={isAddTorrentOpen}
				defaultDownloadDir={settings.downloadDir}
				onClose={() => setIsAddTorrentOpen(false)}
				onSelectFile={handleSelectFile}
				onSelectFolder={handleSelectFolder}
				onAdd={handleAddTorrentFile}
			/>

			<AddMagnetModal
				isOpen={isAddMagnetOpen}
				defaultDownloadDir={settings.downloadDir}
				onClose={() => setIsAddMagnetOpen(false)}
				onSelectFolder={handleSelectFolder}
				onAdd={handleAddMagnetLink}
			/>

			<TorrentDetailModal
				torrentId={selectedDetailId}
				onClose={() => setSelectedDetailId(null)}
				onFetchDetails={handleFetchDetails}
			/>

			<RemoveConfirmModal
				isOpen={!!removeTarget}
				torrentId={removeTarget?.id || ""}
				torrentName={removeTarget?.name || ""}
				onClose={() => setRemoveTarget(null)}
				onConfirm={handleConfirmRemove}
			/>
		</div>
	);
}

export default App;
