import { DownloadCloud, Link as LinkIcon, Plus } from "lucide-react";
import type React from "react";
import type { TorrentItem, ViewFilter } from "../../types/torrent";
import { TorrentCard } from "./TorrentCard";

interface TorrentListProps {
	torrents: TorrentItem[];
	currentView: ViewFilter;
	searchQuery: string;
	onPause: (id: string) => void;
	onResume: (id: string) => void;
	onOpenFolder: (path: string) => void;
	onShowDetails: (id: string) => void;
	onRemove: (id: string, deleteFiles: boolean) => void;
	onOpenAddTorrent: () => void;
	onOpenAddMagnet: () => void;
}

export const TorrentList: React.FC<TorrentListProps> = ({
	torrents,
	currentView,
	searchQuery,
	onPause,
	onResume,
	onOpenFolder,
	onShowDetails,
	onRemove,
	onOpenAddTorrent,
	onOpenAddMagnet,
}) => {
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

	return (
		<div className="p-6 space-y-4 overflow-y-auto max-h-full">
			{filteredTorrents.map((torrent) => (
				<TorrentCard
					key={torrent.id}
					torrent={torrent}
					onPause={onPause}
					onResume={onResume}
					onOpenFolder={onOpenFolder}
					onShowDetails={onShowDetails}
					onRemove={onRemove}
				/>
			))}
		</div>
	);
};
