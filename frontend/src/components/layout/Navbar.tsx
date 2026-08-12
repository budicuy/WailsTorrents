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
		<header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-6 flex items-center justify-between z-20 shrink-0 select-none">
			{/* Brand & App Title */}
			<div className="flex items-center gap-2">
				<img
					src="./appicon.png"
					alt="TorrentLite Logo"
					className="w-7 h-7 aspect-square object-contain shrink-0 filter drop-shadow(0 2px 8px rgba(249, 115, 22, 0.6))"
				/>
				<h1 className="text-base font-extrabold text-slate-100 tracking-tight">
					Torrent<span className="text-orange-500">Lite</span>
				</h1>
			</div>

			{/* Right Group: Transfer Speed Monitor + Search + Add Buttons */}
			<div className="flex items-center gap-3">
				{/* Global Speed Monitor Pill */}
				<div className="flex items-center gap-3 bg-slate-950/80 px-3.5 py-1.5 rounded-xl border border-slate-800/80 text-xs shadow-inner">
					<div className="flex items-center gap-1.5 text-emerald-400 font-mono font-medium">
						<Download className="w-3.5 h-3.5 text-emerald-400" />
						<span>{formatSpeed(totalDnSpeed)}</span>
					</div>
					<div className="h-3 w-px bg-slate-800" />
					<div className="flex items-center gap-1.5 text-blue-400 font-mono font-medium">
						<Upload className="w-3.5 h-3.5 text-blue-400" />
						<span>{formatSpeed(totalUpSpeed)}</span>
					</div>
				</div>

				{/* Search Input */}
				<div className="relative w-44 lg:w-60">
					<Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
					<input
						type="text"
						placeholder="Search torrents..."
						value={searchQuery}
						onChange={(e) => onSearchChange(e.target.value)}
						className="w-full pl-9 pr-3.5 py-1.5 bg-slate-950/80 border border-slate-800 rounded-full text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500"
					/>
				</div>

				{/* Action Buttons */}
				<button
					type="button"
					onClick={onOpenAddTorrent}
					className="flex items-center gap-1.5 px-4 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-full text-xs font-extrabold shadow-md shadow-orange-600/30 cursor-pointer active:scale-95"
				>
					<Plus className="w-4 h-4 stroke-[2.5]" />
					<span>Torrent</span>
				</button>

				<button
					type="button"
					onClick={onOpenAddMagnet}
					className="flex items-center gap-1.5 px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-full text-xs font-extrabold shadow-md shadow-red-600/30 cursor-pointer active:scale-95"
				>
					<Link className="w-4 h-4 stroke-[2.5]" />
					<span>Magnet</span>
				</button>
			</div>
		</header>
	);
};
