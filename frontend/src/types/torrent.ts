export type TorrentStatus =
	| "Queued"
	| "Checking"
	| "Fetching Metadata"
	| "Downloading"
	| "Paused"
	| "Completed"
	| "Error";

export interface TorrentItem {
	id: string;
	name: string;
	hash: string;
	status: TorrentStatus;
	progress: number; // 0 - 100
	downloadSpeed: number; // bytes/sec
	uploadSpeed: number; // bytes/sec
	downloadedBytes: number;
	uploadedBytes: number;
	totalSize: number;
	etaSeconds: number;
	seeds: number;
	peers: number;
	ratio: number;
	savePath: string;
	addedAt: string;
	completedAt?: string;
	errorMessage?: string;
}

export interface TorrentFile {
	index: number;
	path: string;
	size: number;
	progress: number;
}

export interface TorrentDetails extends TorrentItem {
	files: TorrentFile[];
	pieceSize: number;
	pieceCount: number;
	magnetUri?: string;
}

export interface UserSettings {
	downloadDir: string;
	downloadSpeedLimit: number;
	uploadSpeedLimit: number;
	theme: "system" | "dark" | "light";
	maxActiveDownloads: number;
}

export type ViewFilter =
	| "all"
	| "downloading"
	| "completed"
	| "paused"
	| "error";
