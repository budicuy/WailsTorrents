import { Events } from "@wailsio/runtime";
import { useCallback, useEffect, useState } from "react";
import {
	FileService,
	SettingsService,
	TorrentService,
} from "../bindings/TorrentDownloader/backend/services/index";
import { Navbar } from "./components/layout/Navbar";
import { Sidebar } from "./components/layout/Sidebar";
import { AddMagnetModal } from "./components/modals/AddMagnetModal";
import { AddTorrentModal } from "./components/modals/AddTorrentModal";
import { TorrentDetailModal } from "./components/modals/TorrentDetailModal";
import { TorrentList } from "./components/torrents/TorrentList";
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
	});

	const [isAddTorrentOpen, setIsAddTorrentOpen] = useState(false);
	const [isAddMagnetOpen, setIsAddMagnetOpen] = useState(false);
	const [selectedDetailId, setSelectedDetailId] = useState<string | null>(null);

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

	// Actions
	const handlePause = async (id: string) => {
		try {
			await TorrentService.PauseTorrent(id);
		} catch (err) {
			console.error("Failed to pause torrent:", err);
		}
	};

	const handleResume = async (id: string) => {
		try {
			await TorrentService.ResumeTorrent(id);
		} catch (err) {
			console.error("Failed to resume torrent:", err);
		}
	};

	const handleRemove = async (id: string, deleteFiles: boolean) => {
		try {
			await TorrentService.RemoveTorrent(id, deleteFiles);
			setTorrents((prev) =>
				Array.isArray(prev) ? prev.filter((t) => t.id !== id) : [],
			);
		} catch (err) {
			console.error("Failed to remove torrent:", err);
		}
	};

	const handleOpenFolder = async (path: string) => {
		try {
			await FileService.OpenDownloadFolder(path);
		} catch (err) {
			console.error("Failed to open download folder:", err);
		}
	};

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

	const handleSaveSettings = async (newSettings: UserSettings) => {
		await SettingsService.SaveSettings(
			newSettings as unknown as Parameters<
				typeof SettingsService.SaveSettings
			>[0],
		);
		setSettings(newSettings);
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
		<div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden select-none">
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
							onOpenFolder={handleOpenFolder}
							onShowDetails={(id) => setSelectedDetailId(id)}
							onRemove={handleRemove}
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
		</div>
	);
}

export default App;
