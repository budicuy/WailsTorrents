import {
	AlertCircle,
	CheckCircle2,
	Clock,
	Download,
	FolderOpen,
	Info,
	Loader2,
	Pause,
	Play,
	RefreshCw,
	Trash2,
	Upload,
	Users,
} from "lucide-react";
import { useState } from "react";
import { formatBytes, formatETA, formatSpeed } from "../../lib/formatters";
import type { TorrentItem } from "../../types/torrent";

interface TorrentCardProps {
	torrent: TorrentItem;
	onPause: (id: string) => void;
	onResume: (id: string) => void;
	onOpenFolder: (path: string) => void;
	onShowDetails: (id: string) => void;
	onRemove: (id: string, deleteFiles: boolean) => void;
}

export const TorrentCard: React.FC<TorrentCardProps> = ({
	torrent,
	onPause,
	onResume,
	onOpenFolder,
	onShowDetails,
	onRemove,
}) => {
	const [showConfirmRemove, setShowConfirmRemove] = useState(false);
	const [deleteFiles, setDeleteFiles] = useState(false);

	const isPaused = torrent.status === "Paused";
	const isCompleted = torrent.status === "Completed";
	const isChecking = torrent.status === "Checking";
	const isError = torrent.status === "Error";

	const getStatusBadge = () => {
		switch (torrent.status) {
			case "Completed":
				return (
					<span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
						<CheckCircle2 className="w-3 h-3" /> Completed
					</span>
				);
			case "Downloading":
				return (
					<span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
						<Download className="w-3 h-3 animate-pulse" /> Downloading
					</span>
				);
			case "Checking":
				return (
					<span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
						<RefreshCw className="w-3 h-3 animate-spin text-cyan-400" />{" "}
						Checking Files
					</span>
				);
			case "Paused":
				return (
					<span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
						<Pause className="w-3 h-3" /> Paused
					</span>
				);
			case "Fetching Metadata":
				return (
					<span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
						<Loader2 className="w-3 h-3 animate-spin" /> Fetching Metadata
					</span>
				);
			case "Error":
				return (
					<span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
						<AlertCircle className="w-3 h-3" /> Error
					</span>
				);
			default:
				return (
					<span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-400">
						{torrent.status}
					</span>
				);
		}
	};

	return (
		<div className="glass-card rounded-2xl p-5 shadow-lg transition-all duration-200 hover:border-slate-700/80">
			{/* Top Header */}
			<div className="flex items-start justify-between gap-4 mb-3">
				<div className="min-w-0 flex-1">
					<h3
						className="text-sm font-semibold text-slate-100 truncate cursor-pointer hover:text-indigo-400 transition-colors"
						onClick={() => onShowDetails(torrent.id)}
						onKeyDown={(e) => {
							if (e.key === "Enter" || e.key === " ") {
								onShowDetails(torrent.id);
							}
						}}
						title={torrent.name}
					>
						{torrent.name}
					</h3>
					<div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
						<span>
							{formatBytes(torrent.downloadedBytes)} /{" "}
							{formatBytes(torrent.totalSize)}
						</span>
						<span>•</span>
						<span>{torrent.progress.toFixed(1)}%</span>
					</div>
				</div>

				<div className="flex items-center gap-2 shrink-0">
					{getStatusBadge()}

					{/* Quick Actions */}
					<div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
						{isPaused ? (
							<button
								type="button"
								onClick={() => onResume(torrent.id)}
								title="Resume Download"
								className="p-1.5 text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-colors"
							>
								<Play className="w-4 h-4 fill-emerald-400/20" />
							</button>
						) : (
							<button
								type="button"
								onClick={() => onPause(torrent.id)}
								title="Pause Download"
								className="p-1.5 text-amber-400 hover:bg-amber-500/20 rounded-lg transition-colors"
							>
								<Pause className="w-4 h-4" />
							</button>
						)}

						<button
							type="button"
							onClick={() => onOpenFolder(torrent.savePath)}
							title="Open Download Folder"
							className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
						>
							<FolderOpen className="w-4 h-4" />
						</button>

						<button
							type="button"
							onClick={() => onShowDetails(torrent.id)}
							title="Torrent Details"
							className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
						>
							<Info className="w-4 h-4" />
						</button>

						<button
							type="button"
							onClick={() => setShowConfirmRemove(true)}
							title="Remove Torrent"
							className="p-1.5 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors"
						>
							<Trash2 className="w-4 h-4" />
						</button>
					</div>
				</div>
			</div>

			{/* Progress Bar */}
			<div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden mb-3 border border-slate-800 relative">
				{isChecking ? (
					// Animated sweep bar for checking — not bound to progress %
					<div
						className="h-full w-1/3 rounded-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
						style={{
							animation: "checking-sweep 1.6s ease-in-out infinite",
						}}
					/>
				) : (
					<div
						className={`h-full rounded-full transition-all duration-300 ${
							isCompleted
								? "bg-gradient-to-r from-emerald-500 to-teal-400"
								: isPaused
									? "bg-amber-500/60"
									: isError
										? "bg-rose-500"
										: "bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-400"
						}`}
						style={{ width: `${Math.max(1, torrent.progress)}%` }}
					/>
				)}
			</div>

			{/* Transfer Metrics Footer */}
			<div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-400 font-mono">
				<div className="flex items-center gap-1.5">
					<Download className="w-3.5 h-3.5 text-indigo-400" />
					<span>{formatSpeed(torrent.downloadSpeed)}</span>
				</div>

				<div className="flex items-center gap-1.5">
					<Upload className="w-3.5 h-3.5 text-sky-400" />
					<span>{formatSpeed(torrent.uploadSpeed)}</span>
				</div>

				<div className="flex items-center gap-1.5">
					<Clock className="w-3.5 h-3.5 text-slate-500" />
					{isChecking ? (
						<span className="text-cyan-400">Verifying files...</span>
					) : (
						<span>ETA: {formatETA(torrent.etaSeconds)}</span>
					)}
				</div>

				<div className="flex items-center gap-1.5">
					<Users className="w-3.5 h-3.5 text-slate-500" />
					<span>
						{torrent.seeds} seeds / {torrent.peers} peers
					</span>
				</div>
			</div>

			{/* Delete Confirmation Modal Overlay */}
			{showConfirmRemove && (
				<div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
					<div className="glass-panel max-w-sm w-full p-6 rounded-2xl border border-slate-700 shadow-2xl space-y-4">
						<h4 className="text-base font-semibold text-slate-100">
							Remove Torrent
						</h4>
						<p className="text-xs text-slate-300">
							Are you sure you want to remove{" "}
							<span className="font-semibold text-white">{torrent.name}</span>?
						</p>

						<label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-300">
							<input
								type="checkbox"
								checked={deleteFiles}
								onChange={(e) => setDeleteFiles(e.target.checked)}
								className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-rose-600 focus:ring-rose-500"
							/>
							<span className="text-rose-300 font-medium">
								Also delete downloaded files from disk
							</span>
						</label>

						<div className="flex items-center justify-end gap-2 pt-2">
							<button
								type="button"
								onClick={() => setShowConfirmRemove(false)}
								className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={() => {
									onRemove(torrent.id, deleteFiles);
									setShowConfirmRemove(false);
								}}
								className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-600/20 transition-all"
							>
								Remove
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};
