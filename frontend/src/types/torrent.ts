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
	uiScale: number;
}

export type ViewFilter =
	| "all"
	| "downloading"
	| "completed"
	| "paused"
	| "error";

export interface TorrentFileInfo {
	path: string;
	size: number;
}

export interface TorrentInspectData {
	name: string;
	hash: string;
	totalSize: number;
	pieceLength: number;
	numPieces: number;
	createdBy: string;
	creationDate: number;
	sourceFilePath: string;
	files: TorrentFileInfo[];
	trackers: string[];
}
