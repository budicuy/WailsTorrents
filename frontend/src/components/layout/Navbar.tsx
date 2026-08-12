import { Download, Link, Plus, Search, Upload } from "lucide-react";
import type React from "react";
import { formatSpeed } from "../../lib/formatters";

interface NavbarProps {
	totalDnSpeed: number;
	totalUpSpeed: number;
	searchQuery: string;
	onSearchChange: (query: string) => void;
	onOpenAddTorrent: () => void;
	onOpenAddMagnet: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
	totalDnSpeed,
	totalUpSpeed,
	searchQuery,
	onSearchChange,
	onOpenAddTorrent,
	onOpenAddMagnet,
}) => {
	return (
		<header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-6 flex items-center justify-between z-20 shrink-0">
			{/* Brand & App Title */}
			<div className="flex items-center gap-3">
				<img
					src="./appicon.png"
					alt="TorrentDownloader Logo"
					className="w-12 h-12 object-contain shrink-0"
				/>
				<div>
					<h1 className="text-base font-bold text-slate-100 tracking-tight leading-none">
						TorrentDownloader
					</h1>
					<span className="text-[11px] font-medium text-slate-400">
						Wails v3 • High Performance Engine
					</span>
				</div>
			</div>

			{/* Global Transfer Rates */}
			<div className="hidden md:flex items-center gap-6 bg-slate-950/60 px-4 py-1.5 rounded-full border border-slate-800/80 text-xs">
				<div className="flex items-center gap-2 text-emerald-400 font-mono">
					<Download className="w-3.5 h-3.5" />
					<span>{formatSpeed(totalDnSpeed)}</span>
				</div>
				<div className="h-3 w-px bg-slate-800" />
				<div className="flex items-center gap-2 text-sky-400 font-mono">
					<Upload className="w-3.5 h-3.5" />
					<span>{formatSpeed(totalUpSpeed)}</span>
				</div>
			</div>

			{/* Actions & Search */}
			<div className="flex items-center gap-3">
				<div className="relative w-48 lg:w-64">
					<Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
					<input
						type="text"
						placeholder="Search torrents..."
						value={searchQuery}
						onChange={(e) => onSearchChange(e.target.value)}
						className="w-full pl-9 pr-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
					/>
				</div>

				<button
					type="button"
					onClick={onOpenAddTorrent}
					className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
				>
					<Plus className="w-4 h-4" />
					<span>Torrent</span>
				</button>

				<button
					type="button"
					onClick={onOpenAddMagnet}
					className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600/90 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-purple-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
				>
					<Link className="w-4 h-4" />
					<span>Magnet</span>
				</button>
			</div>
		</header>
	);
};
