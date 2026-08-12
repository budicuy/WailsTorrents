import { AlertTriangle, RefreshCw } from "lucide-react";
import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
	children: ReactNode;
}

interface State {
	hasError: boolean;
	error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
	public state: State = {
		hasError: false,
		error: null,
	};

	public static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error };
	}

	public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		console.error("Uncaught Error Boundary Exception:", error, errorInfo);
	}

	public render() {
		if (this.state.hasError) {
			return (
				<div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-slate-100">
					<div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4 text-rose-400">
						<AlertTriangle className="w-8 h-8" />
					</div>
					<h2 className="text-lg font-bold text-slate-100 mb-2">
						Something went wrong
					</h2>
					<p className="text-xs font-mono text-rose-300 max-w-md bg-slate-900 p-3 rounded-xl border border-slate-800 mb-6 break-words">
						{this.state.error?.message || "An unexpected UI error occurred"}
					</p>
					<button
						type="button"
						onClick={() => window.location.reload()}
						className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all"
					>
						<RefreshCw className="w-4 h-4" />
						<span>Reload Application</span>
					</button>
				</div>
			);
		}

		return this.props.children;
	}
}
