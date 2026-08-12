import type React from "react";
import { useState } from "react";

interface RemoveConfirmModalProps {
	isOpen: boolean;
	torrentName: string;
	torrentId: string;
	onConfirm: (id: string, deleteFiles: boolean) => void;
	onClose: () => void;
}

export const RemoveConfirmModal: React.FC<RemoveConfirmModalProps> = ({
	isOpen,
	torrentName,
	torrentId,
	onConfirm,
	onClose,
}) => {
	const [deleteFiles, setDeleteFiles] = useState(false);

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 modal-overlay flex items-center justify-center p-4 select-none">
			<div className="modal-card max-w-sm w-full p-6 rounded-2xl shadow-2xl space-y-4">
				<h4 className="text-base font-semibold text-slate-100">
					Remove Torrent
				</h4>
				<p className="text-xs text-slate-300 leading-relaxed">
					Are you sure you want to remove{" "}
					<span className="font-semibold text-white">{torrentName}</span>?
				</p>

				<label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-300 pt-1">
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

				<div className="flex items-center justify-end gap-2 pt-3">
					<button
						type="button"
						onClick={onClose}
						className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
					>
						Cancel
					</button>
					<button
						type="button"
						onClick={() => {
							onConfirm(torrentId, deleteFiles);
							onClose();
						}}
						className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/25 transition-all active:scale-95"
					>
						Remove
					</button>
				</div>
			</div>
		</div>
	);
};
