import type React from "react";
import { useEffect, useState } from "react";

interface SplashScreenProps {
	isLoading: boolean;
	onFinished: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
	isLoading,
	onFinished,
}) => {
	const [progress, setProgress] = useState(0);
	const [statusText, setStatusText] = useState("Initializing Engine...");
	const [isFadingOut, setIsFadingOut] = useState(false);

	useEffect(() => {
		let timer: ReturnType<typeof setInterval>;

		// Smooth dynamic progress ticker
		timer = setInterval(() => {
			setProgress((prev) => {
				// If backend is still loading data, climb smoothly up to 90%
				if (isLoading) {
					if (prev < 30) return prev + 3;
					if (prev < 70) return prev + 2;
					if (prev < 90) return prev + 1;
					return prev;
				}

				// Once backend load completes (isLoading == false), climb rapidly to 100%
				if (prev < 100) {
					return Math.min(100, prev + 5);
				}

				clearInterval(timer);
				return 100;
			});
		}, 30);

		return () => clearInterval(timer);
	}, [isLoading]);

	// Update status text based on progress milestone
	useEffect(() => {
		if (progress < 25) {
			setStatusText("Initializing BitTorrent Engine...");
		} else if (progress < 55) {
			setStatusText("Loading Settings & Configuration...");
		} else if (progress < 85) {
			setStatusText("Restoring Saved Download Sessions...");
		} else if (progress < 100) {
			setStatusText("Connecting to Peer Network...");
		} else {
			setStatusText("Ready!");
		}

		// Trigger smooth exit transition when 100% reached
		if (progress === 100) {
			const exitTimer = setTimeout(() => {
				setIsFadingOut(true);
				const finishTimer = setTimeout(() => {
					onFinished();
				}, 600); // Duration of fade-out transition
				return () => clearTimeout(finishTimer);
			}, 300);
			return () => clearTimeout(exitTimer);
		}
	}, [progress, onFinished]);

	return (
		<div
			className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-slate-100 transition-all duration-500 ease-out select-none ${
				isFadingOut
					? "opacity-0 scale-105 pointer-events-none"
					: "opacity-100 scale-100"
			}`}
		>
			{/* Ambient Glowing Background Effect */}
			<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-tr from-indigo-600/20 via-purple-600/15 to-cyan-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />

			{/* Main Splash Content */}
			<div className="relative z-10 flex flex-col items-center max-w-sm w-full px-6 space-y-6 text-center">
				{/* Plain Enlarged Logo without card wrapper */}
				<div className="relative flex items-center justify-center">
					<img
						src="/appicon.png"
						alt="App Logo"
						className="w-32 h-32 object-contain filter drop-shadow(0 8px 24px rgba(99, 102, 241, 0.5)) transition-transform duration-300 hover:scale-105"
					/>
				</div>

				{/* Title & Tagline */}
				<div className="space-y-1">
					<h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-300 via-slate-100 to-cyan-300 bg-clip-text text-transparent">
						TorrentLite
					</h1>
					<p className="text-xs font-medium text-slate-400">
						Fast • Lightweight • Secure
					</p>
				</div>

				{/* Dynamic Progress Bar & Percentage */}
				<div className="w-full space-y-2 pt-2">
					<div className="w-full bg-slate-900/90 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-800 shadow-inner">
						<div
							className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 transition-all duration-150 ease-out shadow-lg shadow-indigo-500/30"
							style={{ width: `${progress}%` }}
						/>
					</div>

					{/* Counter & Status Row */}
					<div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
						<span className="truncate max-w-[200px] text-slate-300">
							{statusText}
						</span>
						<span className="font-bold text-cyan-400">{progress}%</span>
					</div>
				</div>
			</div>

			{/* Footer Version info */}
			<div className="absolute bottom-6 text-[10px] font-mono text-slate-500 tracking-wider">
				v1.0.0 • Wails v3
			</div>
		</div>
	);
};
