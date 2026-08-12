import {
	CheckSquare,
	DownloadCloud,
	Link as LinkIcon,
	PauseCircle,
	PlayCircle,
	Plus,
	Square,
	Trash2,
} from "lucide-react";
import type React from "react";
import { useCallback, useState } from "react";
import type { TorrentItem, ViewFilter } from "../../../types/torrent";
import { TorrentCard } from "./TorrentCard";

interface TorrentListProps {
	torrents: TorrentItem[];
	currentView: ViewFilter;
	searchQuery: string;
	onPause: (id: string) => void;
	onResume: (id: string) => void;
	onPauseAll: () => void;
	onResumeAll: () => void;
	onOpenFolder: (path: string) => void;
	onShowDetails: (id: string) => void;
	onRemoveRequest: (id: string, name: string) => void;
	onRemoveAllRequest: () => void;
	onRemoveSelectedRequest: (ids: string[]) => void;
	onOpenAddTorrent: () => void;
	onOpenAddMagnet: () => void;
}

export const TorrentList: React.FC<TorrentListProps> = ({
	torrents,
	currentView,
	searchQuery,
	onPause,
	onResume,
	onPauseAll,
	onResumeAll,
	onOpenFolder,
	onShowDetails,
	onRemoveRequest,
	onRemoveAllRequest,
	onRemoveSelectedRequest,
	onOpenAddTorrent,
	onOpenAddMagnet,
}) => {
	const [isSelectMode, setIsSelectMode] = useState(false);
	const [selectedIds, setSelectedIds] = useState<string[]>([]);

	const handleToggleSelect = useCallback((id: string) => {
		setSelectedIds((prev) =>
			prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
		);
	}, []);

	const filteredTorrents = torrents.filter((t) => {
		if (
			currentView === "downloading" &&
			t.status !== "Downloading" &&
			t.status !== "Fetching Metadata" &&
			t.status !== "Checking"
		) {
			return false;
		}
		if (currentView === "completed" && t.status !== "Completed") {
			return false;
		}
		if (currentView === "paused" && t.status !== "Paused") {
			return false;
		}
		if (currentView === "error" && t.status !== "Error") {
			return false;
		}

		if (searchQuery.trim() !== "") {
			const q = searchQuery.toLowerCase();
			return (
				t.name.toLowerCase().includes(q) || t.hash.toLowerCase().includes(q)
			);
		}

		return true;
	});

	if (filteredTorrents.length === 0) {
		return (
			<div className="h-full w-full flex flex-col items-center justify-center p-8 text-center">
				<div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4 text-indigo-400">
					<DownloadCloud className="w-8 h-8" />
				</div>
				<h3 className="text-base font-bold text-slate-100 mb-1">
					No downloads yet
				</h3>
				<p className="text-xs text-slate-400 max-w-sm mb-6">
					Add a .torrent file or paste a magnet link to start downloading
					high-speed torrents instantly.
				</p>

				<div className="flex items-center gap-3">
					<button
						type="button"
						onClick={onOpenAddTorrent}
						className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all hover:scale-105"
					>
						<Plus className="w-4 h-4" />
						<span>Add Torrent File</span>
					</button>

					<button
						type="button"
						onClick={onOpenAddMagnet}
						className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-all hover:scale-105"
					>
						<LinkIcon className="w-4 h-4 text-purple-400" />
						<span>Add Magnet Link</span>
					</button>
				</div>
			</div>
		);
	}

	// Sort by addedAt descending (newest file on top, fixed static order)
	const sortedTorrents = [...filteredTorrents].sort((a, b) => {
		const timeA = a.addedAt ? new Date(a.addedAt).getTime() : 0;
		const timeB = b.addedAt ? new Date(b.addedAt).getTime() : 0;
		return timeB - timeA;
	});

	const handleSelectAll = () => {
		if (selectedIds.length === sortedTorrents.length) {
			setSelectedIds([]);
		} else {
			setSelectedIds(sortedTorrents.map((t) => t.id));
		}
	};

	const handleRemoveSelected = () => {
		if (selectedIds.length > 0) {
			onRemoveSelectedRequest(selectedIds);
			setSelectedIds([]);
			setIsSelectMode(false);
		}
	};

	return (
		<div className="p-6 space-y-4 overflow-y-auto max-h-full">
			{/* Batch Action Toolbar above content */}
			<div className="glass-panel p-3 rounded-2xl border border-slate-800 flex items-center justify-between gap-3 shrink-0 flex-wrap">
				<div className="flex items-center gap-2">
					<button
						type="button"
						onClick={onPauseAll}
						className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-xl text-xs font-semibold border border-amber-500/20"
						title="Pause All Downloads"
					>
						<PauseCircle className="w-3.5 h-3.5" />
						<span>Pause All</span>
					</button>

					<button
						type="button"
						onClick={onResumeAll}
						className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl text-xs font-semibold border border-emerald-500/20"
						title="Resume All Downloads"
					>
						<PlayCircle className="w-3.5 h-3.5" />
						<span>Resume All</span>
					</button>

					<button
						type="button"
						onClick={onRemoveAllRequest}
						className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold border border-rose-500/20"
						title="Delete All Downloads"
					>
						<Trash2 className="w-3.5 h-3.5" />
						<span>Delete All</span>
					</button>
				</div>

				<div className="flex items-center gap-2">
					{isSelectMode && (
						<>
							<button
								type="button"
								onClick={handleSelectAll}
								className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700"
							>
								{selectedIds.length === sortedTorrents.length ? (
									<CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
								) : (
									<Square className="w-3.5 h-3.5 text-slate-400" />
								)}
								<span>
									Select All ({selectedIds.length}/{sortedTorrents.length})
								</span>
							</button>

							{selectedIds.length > 0 && (
								<button
									type="button"
									onClick={handleRemoveSelected}
									className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-rose-600/20"
								>
									<Trash2 className="w-3.5 h-3.5" />
									<span>Delete Selected ({selectedIds.length})</span>
								</button>
							)}
						</>
					)}

					<button
						type="button"
						onClick={() => {
							setIsSelectMode(!isSelectMode);
							if (isSelectMode) setSelectedIds([]);
						}}
						className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border ${
							isSelectMode
								? "bg-indigo-600/20 text-indigo-300 border-indigo-500/50"
								: "bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700"
						}`}
					>
						<CheckSquare className="w-3.5 h-3.5" />
						<span>{isSelectMode ? "Done Selecting" : "Checklist Mode"}</span>
					</button>
				</div>
			</div>

			{/* Torrent Cards List */}
			{sortedTorrents.map((torrent) => (
				<TorrentCard
					key={torrent.id}
					torrent={torrent}
					onPause={onPause}
					onResume={onResume}
					onOpenFolder={onOpenFolder}
					onShowDetails={onShowDetails}
					onRemoveRequest={onRemoveRequest}
					isSelectMode={isSelectMode}
					isSelected={selectedIds.includes(torrent.id)}
					onToggleSelect={handleToggleSelect}
				/>
			))}
		</div>
	);
};
