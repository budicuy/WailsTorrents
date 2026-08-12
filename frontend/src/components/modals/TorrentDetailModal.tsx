import { Check, Copy, FileText, HardDrive, X } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { formatBytes, formatDate, formatSpeed } from "../../lib/formatters";
import type { TorrentDetails } from "../../types/torrent";

interface TorrentDetailModalProps {
	torrentId: string | null;
	onClose: () => void;
	onFetchDetails: (id: string) => Promise<TorrentDetails | null>;
}

export const TorrentDetailModal: React.FC<TorrentDetailModalProps> = ({
	torrentId,
	onClose,
	onFetchDetails,
}) => {
	const [details, setDetails] = useState<TorrentDetails | null>(null);
	const [activeTab, setActiveTab] = useState<"general" | "files">("general");
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		if (torrentId) {
			onFetchDetails(torrentId).then((data) => {
				if (data) setDetails(data);
			});
		} else {
			setDetails(null);
		}
	}, [torrentId, onFetchDetails]);

	if (!torrentId || !details) return null;

	const handleCopyMagnet = () => {
		if (details.magnetUri) {
			navigator.clipboard.writeText(details.magnetUri);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		}
	};

	return (
		<div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
			<div className="glass-panel max-w-2xl w-full p-6 rounded-2xl border border-slate-700 shadow-2xl space-y-5 max-h-[90vh] flex flex-col">
				{/* Header */}
				<div className="flex items-start justify-between gap-4 shrink-0">
					<div className="min-w-0">
						<h3 className="text-base font-bold text-slate-100 truncate">
							{details.name}
						</h3>
						<p className="text-xs font-mono text-slate-400 truncate mt-0.5">
							Hash: {details.hash}
						</p>
					</div>
					<button
						type="button"
						onClick={onClose}
						className="p-1 text-slate-400 hover:text-slate-200 rounded-lg shrink-0"
					>
						<X className="w-4 h-4" />
					</button>
				</div>

				{/* Tab Navigation */}
				<div className="flex border-b border-slate-800 shrink-0">
					<button
						type="button"
						onClick={() => setActiveTab("general")}
						className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
							activeTab === "general"
								? "border-indigo-500 text-indigo-400"
								: "border-transparent text-slate-400 hover:text-slate-200"
						}`}
					>
						<HardDrive className="w-3.5 h-3.5" /> General Info
					</button>

					<button
						type="button"
						onClick={() => setActiveTab("files")}
						className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
							activeTab === "files"
								? "border-indigo-500 text-indigo-400"
								: "border-transparent text-slate-400 hover:text-slate-200"
						}`}
					>
						<FileText className="w-3.5 h-3.5" /> Files (
						{details.files?.length || 0})
					</button>
				</div>

				{/* Tab Contents */}
				<div className="flex-1 overflow-y-auto pr-1 space-y-4">
					{activeTab === "general" && (
						<div className="space-y-4 text-xs">
							<div className="grid grid-cols-2 gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800/80">
								<div>
									<span className="text-slate-500 block mb-0.5">Status</span>
									<span className="font-semibold text-slate-200">
										{details.status}
									</span>
								</div>
								<div>
									<span className="text-slate-500 block mb-0.5">Progress</span>
									<span className="font-semibold text-indigo-400">
										{details.progress.toFixed(1)}%
									</span>
								</div>
								<div>
									<span className="text-slate-500 block mb-0.5">
										Total Size
									</span>
									<span className="font-semibold text-slate-200">
										{formatBytes(details.totalSize)}
									</span>
								</div>
								<div>
									<span className="text-slate-500 block mb-0.5">
										Downloaded
									</span>
									<span className="font-semibold text-slate-200">
										{formatBytes(details.downloadedBytes)}
									</span>
								</div>
								<div>
									<span className="text-slate-500 block mb-0.5">
										Download Speed
									</span>
									<span className="font-semibold text-emerald-400">
										{formatSpeed(details.downloadSpeed)}
									</span>
								</div>
								<div>
									<span className="text-slate-500 block mb-0.5">
										Upload Speed
									</span>
									<span className="font-semibold text-sky-400">
										{formatSpeed(details.uploadSpeed)}
									</span>
								</div>
								<div>
									<span className="text-slate-500 block mb-0.5">
										Peers / Seeds
									</span>
									<span className="font-semibold text-slate-200">
										{details.peers} active / {details.seeds} seeds
									</span>
								</div>
								<div>
									<span className="text-slate-500 block mb-0.5">
										Added Date
									</span>
									<span className="font-semibold text-slate-200">
										{formatDate(details.addedAt)}
									</span>
								</div>
							</div>

							{/* Download Directory */}
							<div>
								<span className="text-slate-400 font-semibold block mb-1">
									Save Directory
								</span>
								<div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl font-mono text-slate-300 break-all select-all">
									{details.savePath}
								</div>
							</div>

							{/* Magnet Link */}
							{details.magnetUri && (
								<div>
									<div className="flex items-center justify-between mb-1">
										<span className="text-slate-400 font-semibold">
											Magnet Link
										</span>
										<button
											type="button"
											onClick={handleCopyMagnet}
											className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-medium"
										>
											{copied ? (
												<Check className="w-3 h-3 text-emerald-400" />
											) : (
												<Copy className="w-3 h-3" />
											)}
											<span>{copied ? "Copied!" : "Copy URI"}</span>
										</button>
									</div>
									<div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl font-mono text-slate-400 text-[11px] break-all max-h-24 overflow-y-auto">
										{details.magnetUri}
									</div>
								</div>
							)}
						</div>
					)}

					{activeTab === "files" && (
						<div className="space-y-2">
							{details.files && details.files.length > 0 ? (
								details.files.map((file) => (
									<div
										key={file.index}
										className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 flex items-center justify-between gap-4 text-xs"
									>
										<div className="min-w-0 flex-1">
											<p className="font-medium text-slate-200 truncate">
												{file.path}
											</p>
											<span className="text-[11px] text-slate-400">
												{formatBytes(file.size)}
											</span>
										</div>

										<div className="w-24 text-right shrink-0">
											<div className="text-[11px] font-semibold text-slate-300 mb-1">
												{file.progress.toFixed(0)}%
											</div>
											<div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
												<div
													className="bg-indigo-500 h-full rounded-full"
													style={{ width: `${Math.max(1, file.progress)}%` }}
												/>
											</div>
										</div>
									</div>
								))
							) : (
								<div className="text-center py-8 text-slate-500 text-xs">
									File list will be available once torrent metadata finishes
									loading.
								</div>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};
