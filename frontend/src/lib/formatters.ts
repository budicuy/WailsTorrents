export function formatBytes(bytes: number, decimals = 1): string {
	if (bytes <= 0 || !Number.isFinite(bytes)) return "0 B";
	const k = 1024;
	const dm = decimals < 0 ? 0 : decimals;
	const sizes = ["B", "KB", "MB", "GB", "TB", "PB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	const val = bytes / k ** i;
	return `${parseFloat(val.toFixed(dm))} ${sizes[i]}`;
}

export function formatSpeed(bytesPerSec: number): string {
	if (bytesPerSec <= 0 || !Number.isFinite(bytesPerSec)) return "0 B/s";
	return `${formatBytes(bytesPerSec)}/s`;
}

export function formatETA(seconds: number): string {
	if (seconds < 0 || !Number.isFinite(seconds)) return "∞";
	if (seconds === 0) return "0s";

	const hrs = Math.floor(seconds / 3600);
	const mins = Math.floor((seconds % 3600) / 60);
	const secs = Math.floor(seconds % 60);

	if (hrs > 0) {
		return `${hrs}h ${mins}m`;
	}
	if (mins > 0) {
		return `${mins}m ${secs}s`;
	}
	return `${secs}s`;
}

export function formatDate(dateString: string): string {
	if (!dateString) return "-";
	try {
		const date = new Date(dateString);
		return date.toLocaleDateString(undefined, {
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	} catch {
		return dateString;
	}
}
