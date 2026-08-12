import { Check, Folder, Gauge, Monitor, Moon, Save, Sun } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import type { UserSettings } from "../types/torrent";

interface SettingsPageProps {
	settings: UserSettings;
	onSaveSettings: (settings: UserSettings) => Promise<void>;
	onSelectFolder: () => Promise<string>;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
	settings,
	onSaveSettings,
	onSelectFolder,
}) => {
	const [downloadDir, setDownloadDir] = useState(settings.downloadDir);
	const [downloadLimit, setDownloadLimit] = useState(
		settings.downloadSpeedLimit,
	);
	const [uploadLimit, setUploadLimit] = useState(settings.uploadSpeedLimit);
	const [theme, setTheme] = useState<"system" | "dark" | "light">(
		settings.theme || "system",
	);
	const [saved, setSaved] = useState(false);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		setDownloadDir(settings.downloadDir);
		setDownloadLimit(settings.downloadSpeedLimit);
		setUploadLimit(settings.uploadSpeedLimit);
		setTheme(settings.theme || "system");
	}, [settings]);

	const speedOptions = [
		{ label: "Unlimited", value: 0 },
		{ label: "100 KB/s", value: 100 * 1024 },
		{ label: "500 KB/s", value: 500 * 1024 },
		{ label: "1 MB/s", value: 1024 * 1024 },
		{ label: "5 MB/s", value: 5 * 1024 * 1024 },
		{ label: "10 MB/s", value: 10 * 1024 * 1024 },
	];

	const handlePickFolder = async () => {
		try {
			const selected = await onSelectFolder();
			if (selected) {
				setDownloadDir(selected);
			}
		} catch (err) {
			console.error(err);
		}
	};

	const handleSave = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		try {
			await onSaveSettings({
				...settings,
				downloadDir,
				downloadSpeedLimit: downloadLimit,
				uploadSpeedLimit: uploadLimit,
				theme,
			});
			setSaved(true);
			setTimeout(() => setSaved(false), 2500);
		} catch (err) {
			console.error(err);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="p-8 max-w-3xl mx-auto space-y-8 overflow-y-auto max-h-full">
			<div>
				<h2 className="text-xl font-bold text-slate-100">
					Application Settings
				</h2>
				<p className="text-xs text-slate-400 mt-1">
					Configure default download folders, global bandwidth limits, and
					display themes.
				</p>
			</div>

			<form onSubmit={handleSave} className="space-y-6">
				{/* Download Location Section */}
				<div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
					<div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
						<Folder className="w-4 h-4 text-indigo-400" />
						<span>Default Download Directory</span>
					</div>

					<div className="flex gap-2">
						<input
							type="text"
							value={downloadDir}
							onChange={(e) => setDownloadDir(e.target.value)}
							className="flex-1 px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
						/>
						<button
							type="button"
							onClick={handlePickFolder}
							className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
						>
							Browse...
						</button>
					</div>
				</div>

				{/* Bandwidth Limits Section */}
				<div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
					<div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
						<Gauge className="w-4 h-4 text-indigo-400" />
						<span>Global Bandwidth Limits</span>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div>
							<label
								htmlFor="max-download-limit"
								className="block text-xs font-medium text-slate-400 mb-1.5"
							>
								Maximum Download Speed
							</label>
							<select
								id="max-download-limit"
								value={downloadLimit}
								onChange={(e) => setDownloadLimit(Number(e.target.value))}
								className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
							>
								{speedOptions.map((opt) => (
									<option key={opt.value} value={opt.value}>
										{opt.label}
									</option>
								))}
							</select>
						</div>

						<div>
							<label
								htmlFor="max-upload-limit"
								className="block text-xs font-medium text-slate-400 mb-1.5"
							>
								Maximum Upload Speed
							</label>
							<select
								id="max-upload-limit"
								value={uploadLimit}
								onChange={(e) => setUploadLimit(Number(e.target.value))}
								className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
							>
								{speedOptions.map((opt) => (
									<option key={opt.value} value={opt.value}>
										{opt.label}
									</option>
								))}
							</select>
						</div>
					</div>
				</div>

				{/* Theme Preference Section */}
				<div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
					<div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
						<Sun className="w-4 h-4 text-indigo-400" />
						<span>Appearance Theme</span>
					</div>

					<div className="grid grid-cols-3 gap-3">
						{[
							{ id: "system", label: "System Default", icon: Monitor },
							{ id: "dark", label: "Dark Theme", icon: Moon },
							{ id: "light", label: "Light Theme", icon: Sun },
						].map((item) => {
							const Icon = item.icon;
							const isSelected = theme === item.id;
							return (
								<button
									key={item.id}
									type="button"
									onClick={() =>
										setTheme(item.id as "system" | "dark" | "light")
									}
									className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl text-xs font-semibold border transition-all ${
										isSelected
											? "bg-indigo-600/20 text-indigo-300 border-indigo-500/50 shadow-md shadow-indigo-500/10"
											: "bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700"
									}`}
								>
									<Icon className="w-5 h-5" />
									<span>{item.label}</span>
								</button>
							);
						})}
					</div>
				</div>

				{/* Save Bar */}
				<div className="flex items-center justify-between pt-2">
					{saved ? (
						<span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
							<Check className="w-4 h-4" /> Settings saved successfully!
						</span>
					) : (
						<span />
					)}

					<button
						type="submit"
						disabled={loading}
						className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-indigo-600/20 transition-all hover:scale-105 active:scale-95"
					>
						<Save className="w-4 h-4" />
						<span>Save Settings</span>
					</button>
				</div>
			</form>
		</div>
	);
};
