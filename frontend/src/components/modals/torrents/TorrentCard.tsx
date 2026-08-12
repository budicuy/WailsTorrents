import {
	AlertCircle,
	Check,
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
import type React from "react";
import { memo } from "react";
import { formatBytes, formatETA, formatSpeed } from "../../../lib/formatters";
import type { TorrentItem } from "../../../types/torrent";

interface TorrentCardProps {
	torrent: TorrentItem;
	onPause: (id: string) => void;
	onResume: (id: string) => void;
	onOpenFolder: (path: string) => void;
	onShowDetails: (id: string) => void;
	onRemoveRequest: (id: string, name: string) => void;
	isSelectMode?: boolean;
	isSelected?: boolean;
	onToggleSelect?: (id: string) => void;
}

export const TorrentCard: React.FC<TorrentCardProps> = memo(
	({
		torrent,
		onPause,
		onResume,
		onOpenFolder,
		onShowDetails,
		onRemoveRequest,
		isSelectMode,
		isSelected,
		onToggleSelect,
	}) => {
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
			<div className="glass-card rounded-2xl p-5 shadow-lg overflow-hidden border border-slate-800/80 hover:border-slate-700/80">
				{/* Top Header */}
				<div className="flex items-start justify-between gap-4 mb-3">
					{isSelectMode && (
						<label
							onClick={(e) => e.stopPropagation()}
							onKeyDown={(e) => e.stopPropagation()}
							className="relative flex items-center justify-center cursor-pointer shrink-0 mt-0.5 select-none p-1 -m-1"
						>
							<input
								type="checkbox"
								checked={isSelected}
								onChange={() => onToggleSelect?.(torrent.id)}
								className="sr-only"
							/>
							<div
								className={`w-5 h-5 rounded-md flex items-center justify-center border shrink-0 transition-none ${
									isSelected
										? "bg-indigo-600 border-indigo-500 text-white shadow-sm"
										: "bg-slate-900 border-slate-700 hover:border-indigo-500"
								}`}
							>
								{isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
							</div>
						</label>
					)}

					<div className="min-w-0 flex-1">
						<h3
							className="text-sm font-semibold text-slate-100 truncate cursor-pointer hover:text-indigo-400"
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
									className="p-1.5 text-emerald-400 hover:bg-emerald-500/20 rounded-lg"
								>
									<Play className="w-4 h-4 fill-emerald-400/20" />
								</button>
							) : (
								<button
									type="button"
									onClick={() => onPause(torrent.id)}
									title="Pause Download"
									className="p-1.5 text-amber-400 hover:bg-amber-500/20 rounded-lg"
								>
									<Pause className="w-4 h-4" />
								</button>
							)}

							<button
								type="button"
								onClick={() => onOpenFolder(torrent.savePath)}
								title="Open Download Folder"
								className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg"
							>
								<FolderOpen className="w-4 h-4" />
							</button>

							<button
								type="button"
								onClick={() => onShowDetails(torrent.id)}
								title="Torrent Details"
								className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg"
							>
								<Info className="w-4 h-4" />
							</button>

							<button
								type="button"
								onClick={() => onRemoveRequest(torrent.id, torrent.name)}
								title="Remove Torrent"
								className="p-1.5 text-rose-400 hover:bg-rose-500/20 rounded-lg"
							>
								<Trash2 className="w-4 h-4" />
							</button>
						</div>
					</div>
				</div>

				{/* Progress Bar */}
				<div className="w-full bg-slate-900/90 h-2 rounded-full overflow-hidden mb-3 border border-slate-800/60 relative">
					{isChecking ? (
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
			</div>
		);
	},
	(prevProps, nextProps) => {
		if (
			prevProps.isSelectMode !== nextProps.isSelectMode ||
			prevProps.isSelected !== nextProps.isSelected
		) {
			return false;
		}
		const p = prevProps.torrent;
		const n = nextProps.torrent;
		return (
			p.id === n.id &&
			p.status === n.status &&
			p.progress === n.progress &&
			p.downloadSpeed === n.downloadSpeed &&
			p.uploadSpeed === n.uploadSpeed &&
			p.downloadedBytes === n.downloadedBytes &&
			p.totalSize === n.totalSize &&
			p.etaSeconds === n.etaSeconds &&
			p.seeds === n.seeds &&
			p.peers === n.peers
		);
	},
);
