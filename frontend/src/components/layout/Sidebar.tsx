import {
	AlertCircle,
	ArrowDownCircle,
	CheckCircle2,
	Layers,
	PauseCircle,
	Settings,
} from "lucide-react";
import type React from "react";
import type { ViewFilter } from "../../types/torrent";

interface SidebarProps {
	currentView: ViewFilter | "settings";
	onSelectView: (view: ViewFilter | "settings") => void;
	counts: {
		all: number;
		downloading: number;
		completed: number;
		paused: number;
		error: number;
	};
}

export const Sidebar: React.FC<SidebarProps> = ({
	currentView,
	onSelectView,
	counts,
}) => {
	const navItems = [
		{
			id: "all" as const,
			label: "All Downloads",
			icon: Layers,
			count: counts.all,
			color: "text-indigo-400",
			badgeColor:
				"bg-indigo-600 text-white font-bold shadow-sm shadow-indigo-600/30 border border-indigo-500/30",
		},
		{
			id: "downloading" as const,
			label: "Downloading",
			icon: ArrowDownCircle,
			count: counts.downloading,
			color: "text-indigo-400",
			badgeColor:
				"bg-indigo-600 text-white font-bold shadow-sm shadow-indigo-600/30 border border-indigo-500/30",
		},
		{
			id: "completed" as const,
			label: "Completed",
			icon: CheckCircle2,
			count: counts.completed,
			color: "text-emerald-400",
			badgeColor:
				"bg-emerald-600 text-white font-bold shadow-sm shadow-emerald-600/30 border border-emerald-500/30",
		},
		{
			id: "paused" as const,
			label: "Paused",
			icon: PauseCircle,
			count: counts.paused,
			color: "text-amber-400",
			badgeColor:
				"bg-amber-500 text-slate-950 font-bold shadow-sm shadow-amber-500/30 border border-amber-400/40",
		},
		{
			id: "error" as const,
			label: "Errors",
			icon: AlertCircle,
			count: counts.error,
			color: "text-rose-400",
			badgeColor:
				"bg-rose-600 text-white font-bold shadow-sm shadow-rose-600/30 border border-rose-500/30",
		},
	];

	return (
		<aside className="w-56 bg-slate-900/60 border-r border-slate-800 shrink-0 flex flex-col justify-between p-3 select-none">
			<div className="space-y-1">
				<div className="px-3 py-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
					Library
				</div>

				{navItems.map((item) => {
					const Icon = item.icon;
					const isActive = currentView === item.id;
					return (
						<button
							key={item.id}
							type="button"
							onClick={() => onSelectView(item.id)}
							className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium ${
								isActive
									? "bg-indigo-600/20 text-indigo-300 font-semibold border border-indigo-500/30"
									: "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
							}`}
						>
							<div className="flex items-center gap-2.5">
								<Icon className={`w-4 h-4 ${item.color}`} />
								<span>{item.label}</span>
							</div>
							{item.count > 0 && (
								<span
									className={`px-2 py-0.5 rounded-full text-[10px] min-w-[20px] text-center inline-block ${item.badgeColor}`}
								>
									{item.count}
								</span>
							)}
						</button>
					);
				})}
			</div>

			{/* Bottom Settings Link */}
			<div className="pt-3 border-t border-slate-800/80">
				<button
					type="button"
					onClick={() => onSelectView("settings")}
					className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium ${
						currentView === "settings"
							? "bg-indigo-600/20 text-indigo-300 font-semibold border border-indigo-500/30"
							: "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
					}`}
				>
					<Settings className="w-4 h-4 text-slate-400" />
					<span>Settings</span>
				</button>
			</div>
		</aside>
	);
};
