import { Folder, Link as LinkIcon, Loader2, X } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";

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
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	useEffect(() => {
		if (isOpen) {
			setDownloadDir(defaultDownloadDir || "");
			setMagnetURI("");
			setError("");
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

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const cleanURI = magnetURI.trim();
		if (!cleanURI.startsWith("magnet:?")) {
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
		<div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
			<div className="glass-panel max-w-md w-full p-6 rounded-2xl border border-slate-700 shadow-2xl space-y-5">
				<div className="flex items-center justify-between">
					<h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
						<LinkIcon className="w-5 h-5 text-purple-400" /> Add Magnet Link
					</h3>
					<button
						type="button"
						onClick={onClose}
						className="p-1 text-slate-400 hover:text-slate-200 rounded-lg"
					>
						<X className="w-4 h-4" />
					</button>
				</div>

				<form onSubmit={handleSubmit} className="space-y-4">
					{/* Magnet Link Input */}
					<div>
						<label
							htmlFor="magnet-uri-input"
							className="block text-xs font-semibold text-slate-300 mb-1.5"
						>
							Magnet Link URI
						</label>
						<textarea
							id="magnet-uri-input"
							rows={3}
							value={magnetURI}
							onChange={(e) => setMagnetURI(e.target.value)}
							placeholder="Paste magnet link URI (e.g. magnet:?xt=urn:btih:...)"
							className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 font-mono placeholder-slate-600 focus:outline-none focus:border-purple-500 resize-none"
						/>
					</div>

					{/* Download Directory Picker */}
					<div>
						<label
							htmlFor="magnet-download-dir"
							className="block text-xs font-semibold text-slate-300 mb-1.5"
						>
							Download Location
						</label>
						<div className="flex gap-2">
							<input
								id="magnet-download-dir"
								type="text"
								value={downloadDir}
								onChange={(e) => setDownloadDir(e.target.value)}
								placeholder="Select download directory"
								className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-purple-500 font-mono"
							/>
							<button
								type="button"
								onClick={handlePickFolder}
								className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5"
							>
								<Folder className="w-3.5 h-3.5" />
								<span>Choose</span>
							</button>
						</div>
					</div>

					{error && (
						<div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300">
							{error}
						</div>
					)}

					<div className="flex justify-end gap-2 pt-2">
						<button
							type="button"
							onClick={onClose}
							className="px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 rounded-xl"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={loading}
							className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-purple-600/20 flex items-center gap-2"
						>
							{loading && <Loader2 className="w-4 h-4 animate-spin" />}
							<span>Add Magnet</span>
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};
