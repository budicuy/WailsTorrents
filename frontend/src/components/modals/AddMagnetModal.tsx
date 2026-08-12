import {
	Check,
	Copy,
	File,
	Folder,
	Globe,
	HardDrive,
	Hash,
	Info,
	Layers,
	Link as LinkIcon,
	Loader2,
	X,
} from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { FileService } from "../../../bindings/TorrentLite/backend/services/index";
import { formatBytes } from "../../lib/formatters";
import type { TorrentInspectData } from "../../types/torrent";

interface AddMagnetModalProps {
	isOpen: boolean;
	defaultDownloadDir: string;
	onClose: () => void;
	onSelectFolder: () => Promise<string>;
	onAdd: (magnetURI: string, downloadDir: string) => Promise<void>;
}

export const AddMagnetModal: React.FC<AddMagnetModalProps> = ({
	isOpen,
	defaultDownloadDir,
	onClose,
	onSelectFolder,
	onAdd,
}) => {
	const [magnetURI, setMagnetURI] = useState("");
	const [downloadDir, setDownloadDir] = useState(defaultDownloadDir);
	const [inspectData, setInspectData] = useState<TorrentInspectData | null>(
		null,
	);
	const [inspecting, setInspecting] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [activeTab, setActiveTab] = useState<"general" | "files" | "trackers">(
		"general",
	);
	const [copiedHash, setCopiedHash] = useState(false);

	const inspectMagnet = useCallback(async (uri: string) => {
		const clean = uri.trim();
		if (!clean.toLowerCase().startsWith("magnet:")) {
			setInspectData(null);
			return;
		}
		setInspecting(true);
		setError("");
		try {
			const res = await FileService.InspectMagnetLink(clean);
			if (res) {
				setInspectData(res as unknown as TorrentInspectData);
			}
		} catch (err: unknown) {
			console.error("Failed to inspect magnet URI:", err);
			setInspectData(null);
		} finally {
			setInspecting(false);
		}
	}, []);

	useEffect(() => {
		if (isOpen) {
			setDownloadDir(defaultDownloadDir || "");
			setMagnetURI("");
			setInspectData(null);
			setError("");
			setActiveTab("general");
		}
	}, [isOpen, defaultDownloadDir]);

	if (!isOpen) return null;

	const handlePickFolder = async () => {
		try {
			const selected = await onSelectFolder();
			if (selected) {
				setDownloadDir(selected);
			}
		} catch (err: unknown) {
			const msg = err instanceof Error ? err.message : String(err);
			setError(msg);
		}
	};

	const handleCopyHash = () => {
		if (inspectData?.hash) {
			navigator.clipboard.writeText(inspectData.hash);
			setCopiedHash(true);
			setTimeout(() => setCopiedHash(false), 2000);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const cleanURI = magnetURI.trim();
		if (!cleanURI.toLowerCase().startsWith("magnet:")) {
			setError("Please enter a valid magnet link starting with magnet:?");
			return;
		}

		setLoading(true);
		setError("");

		try {
			await onAdd(cleanURI, downloadDir);
			setLoading(false);
			onClose();
		} catch (err: unknown) {
			setLoading(false);
			const msg = err instanceof Error ? err.message : String(err);
			setError(msg || "Failed to add magnet link");
		}
	};

	return (
		<div className="fixed inset-0 modal-overlay flex items-center justify-center z-50 p-4">
			<div className="modal-card max-w-xl w-full p-6 rounded-2xl shadow-2xl space-y-5 max-h-[90vh] flex flex-col overflow-hidden">
				{/* Modal Header */}
				<div className="flex items-center justify-between shrink-0">
					<h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
						<LinkIcon className="w-5 h-5 text-purple-400" /> Add Magnet Link
					</h3>
					<button
						type="button"
						onClick={onClose}
						className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
					>
						<X className="w-4 h-4" />
					</button>
				</div>

				<form
					onSubmit={handleSubmit}
					className="flex flex-col flex-1 overflow-hidden space-y-4"
				>
					{/* Magnet Input Section */}
					<div className="space-y-3 shrink-0">
						<div>
							<label
								htmlFor="magnet-uri-textarea"
								className="block text-xs font-semibold text-slate-300 mb-1"
							>
								Magnet Link URI
							</label>
							<textarea
								id="magnet-uri-textarea"
								rows={3}
								value={magnetURI}
								onChange={(e) => {
									setMagnetURI(e.target.value);
									inspectMagnet(e.target.value);
								}}
								placeholder="Paste magnet link URI (e.g. magnet:?xt=urn:btih:...)"
								className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 font-mono placeholder-slate-600 focus:outline-none focus:border-purple-500 resize-none"
							/>
						</div>

						{/* Save Directory Picker */}
						<div>
							<label
								htmlFor="magnet-save-dir"
								className="block text-xs font-semibold text-slate-300 mb-1"
							>
								Save Directory
							</label>
							<div className="flex gap-2">
								<input
									id="magnet-save-dir"
									type="text"
									value={downloadDir}
									onChange={(e) => setDownloadDir(e.target.value)}
									placeholder="Select target save directory"
									className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-purple-500 font-mono"
								/>
								<button
									type="button"
									onClick={handlePickFolder}
									className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5 shrink-0 transition-all"
								>
									<Folder className="w-3.5 h-3.5 text-purple-400" />
									<span>Choose</span>
								</button>
							</div>
						</div>
					</div>

					{/* Loading State */}
					{inspecting && (
						<div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-center gap-2 text-xs text-slate-400">
							<Loader2 className="w-4 h-4 animate-spin text-purple-400" />
							<span>Resolving magnet metadata from peer network...</span>
						</div>
					)}

					{/* Magnet Inspection Metadata View */}
					{inspectData && !inspecting && (
						<div className="flex flex-col flex-1 overflow-hidden bg-slate-900/80 rounded-xl border border-slate-800/90 shadow-inner">
							{/* Navigation Tabs */}
							<div className="flex items-center border-b border-slate-800 px-3 bg-slate-950/40 shrink-0">
								<button
									type="button"
									onClick={() => setActiveTab("general")}
									className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition-all ${
										activeTab === "general"
											? "border-purple-500 text-purple-400 bg-purple-500/10"
											: "border-transparent text-slate-400 hover:text-slate-200"
									}`}
								>
									<Info className="w-3.5 h-3.5" />
									<span>Magnet Info</span>
								</button>

								<button
									type="button"
									onClick={() => setActiveTab("files")}
									className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition-all ${
										activeTab === "files"
											? "border-purple-500 text-purple-400 bg-purple-500/10"
											: "border-transparent text-slate-400 hover:text-slate-200"
									}`}
								>
									<File className="w-3.5 h-3.5" />
									<span>Files ({inspectData.files?.length || 0})</span>
								</button>

								<button
									type="button"
									onClick={() => setActiveTab("trackers")}
									className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition-all ${
										activeTab === "trackers"
											? "border-purple-500 text-purple-400 bg-purple-500/10"
											: "border-transparent text-slate-400 hover:text-slate-200"
									}`}
								>
									<Globe className="w-3.5 h-3.5" />
									<span>Trackers ({inspectData.trackers?.length || 0})</span>
								</button>
							</div>

							{/* Tab Content Panels */}
							<div className="p-4 flex-1 overflow-y-auto space-y-3">
								{/* GENERAL TAB */}
								{activeTab === "general" && (
									<div className="space-y-3 text-xs">
										{/* Title Name Card */}
										<div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
											<span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
												Display Name
											</span>
											<span className="font-semibold text-slate-100 text-sm block truncate">
												{inspectData.name}
											</span>
										</div>

										{/* Key Metrics Grid if metadata resolved */}
										{inspectData.totalSize > 0 && (
											<div className="grid grid-cols-2 gap-2 font-mono">
												<div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800 flex items-center gap-2">
													<HardDrive className="w-4 h-4 text-emerald-400 shrink-0" />
													<div>
														<span className="text-[10px] text-slate-400 block">
															Total Size
														</span>
														<span className="font-bold text-emerald-300">
															{formatBytes(inspectData.totalSize)}
														</span>
													</div>
												</div>

												<div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800 flex items-center gap-2">
													<Layers className="w-4 h-4 text-cyan-400 shrink-0" />
													<div>
														<span className="text-[10px] text-slate-400 block">
															Piece Details
														</span>
														<span className="font-bold text-cyan-300">
															{inspectData.numPieces.toLocaleString()} pcs ×{" "}
															{formatBytes(inspectData.pieceLength)}
														</span>
													</div>
												</div>
											</div>
										)}

										{/* Info Hash Card */}
										<div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800 flex items-center justify-between gap-2">
											<div className="min-w-0 flex-1 font-mono">
												<span className="text-[10px] text-slate-400 block flex items-center gap-1">
													<Hash className="w-3 h-3 text-purple-400" /> BTIH Info
													Hash
												</span>
												<span className="text-[11px] text-purple-300 truncate block">
													{inspectData.hash}
												</span>
											</div>
											<button
												type="button"
												onClick={handleCopyHash}
												className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md transition-colors"
												title="Copy Info Hash"
											>
												{copiedHash ? (
													<Check className="w-3.5 h-3.5 text-emerald-400" />
												) : (
													<Copy className="w-3.5 h-3.5" />
												)}
											</button>
										</div>
									</div>
								)}

								{/* FILES TAB */}
								{activeTab === "files" && (
									<div className="space-y-1.5">
										{inspectData.files?.length > 0 ? (
											inspectData.files.map((f, idx) => (
												<div
													// biome-ignore lint/suspicious/noArrayIndexKey: file index is static
													key={idx}
													className="p-2 bg-slate-950/50 hover:bg-slate-950/80 rounded-lg border border-slate-800/60 flex items-center justify-between gap-3 text-xs font-mono transition-colors"
												>
													<span className="truncate text-slate-200 flex-1">
														{f.path}
													</span>
													<span className="text-emerald-400 shrink-0 font-bold text-[11px]">
														{formatBytes(f.size)}
													</span>
												</div>
											))
										) : (
											<p className="text-slate-400 text-xs italic text-center py-6">
												Fetching file tree from seeder network... Full file list
												will appear automatically when downloading starts.
											</p>
										)}
									</div>
								)}

								{/* TRACKERS TAB */}
								{activeTab === "trackers" && (
									<div className="space-y-1.5 font-mono text-[11px]">
										{inspectData.trackers?.length > 0 ? (
											inspectData.trackers.map((tr, idx) => (
												<div
													// biome-ignore lint/suspicious/noArrayIndexKey: tracker index is static
													key={idx}
													className="p-2 bg-slate-950/50 rounded-lg border border-slate-800/60 text-slate-300 truncate"
												>
													{tr}
												</div>
											))
										) : (
											<p className="text-slate-500 text-xs italic text-center py-4">
												No announce trackers included in magnet URI.
											</p>
										)}
									</div>
								)}
							</div>
						</div>
					)}

					{error && (
						<div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 shrink-0">
							{error}
						</div>
					)}

					{/* Actions Footer */}
					<div className="flex justify-end gap-2 pt-2 shrink-0 border-t border-slate-800/60">
						<button
							type="button"
							onClick={onClose}
							className="px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 rounded-xl transition-colors"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={loading || inspecting}
							className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-purple-600/25 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
						>
							{loading && <Loader2 className="w-4 h-4 animate-spin" />}
							<span>Add Download</span>
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};
