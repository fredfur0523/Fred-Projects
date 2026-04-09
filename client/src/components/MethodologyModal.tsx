import type React from "react";
import ReactDOM from "react-dom";
import type { T } from "../constants/translations";

export const MethodologyModal: React.FC<{ show: boolean; onClose: () => void; dark: boolean; t: T }> = ({
	show,
	onClose,
	dark,
	t,
}) => {
	if (!show) return null;
	const card = dark ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200 text-gray-900";
	const sub = dark ? "text-gray-400" : "text-gray-500";
	const sectionBg = dark ? "bg-gray-900/50 border-gray-700" : "bg-gray-50 border-gray-200";
	return ReactDOM.createPortal(
		<div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
			<div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
			<div
				className={"relative max-w-lg w-full rounded-2xl border shadow-2xl overflow-hidden " + card}
				onClick={(e) => e.stopPropagation()}
			>
				<div
					className={
						"flex items-center justify-between px-6 py-4 border-b " + (dark ? "border-gray-700" : "border-gray-200")
					}
				>
					<h2 className="text-lg font-black flex items-center gap-2">{t.methodologyTitle}</h2>
					<button
						onClick={onClose}
						className={
							"p-1.5 rounded-lg transition-all " +
							(dark ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-400")
						}
					>
						<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
							<path d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
				<div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
					<div className={"rounded-xl border p-4 " + sectionBg}>
						<h3 className="font-black text-sm">{t.methodologyScoreOverview}</h3>
						<ul className={"mt-2 space-y-1 text-sm " + sub}>
							<li>{t.methodologyScoreOverviewSource}</li>
							<li>{t.methodologyScoreOverviewRepresents}</li>
							<li>{t.methodologyScoreOverviewUse}</li>
						</ul>
					</div>
					<div className={"rounded-xl border p-4 " + sectionBg}>
						<h3 className="font-black text-sm">{t.methodologyScoreN3N4}</h3>
						<ul className={"mt-2 space-y-1 text-sm " + sub}>
							<li>{t.methodologyScoreN3N4Source}</li>
							<li>{t.methodologyScoreN3N4Represents}</li>
							<li>{t.methodologyScoreN3N4Weights}</li>
							<li>{t.methodologyScoreN3N4Gates}</li>
							<li>{t.methodologyScoreN3N4Use}</li>
						</ul>
					</div>
					<div
						className={
							"rounded-xl border p-4 " + (dark ? "bg-amber-900/20 border-amber-700/50" : "bg-amber-50 border-amber-200")
						}
					>
						<h3 className={"font-black text-sm " + (dark ? "text-amber-300" : "text-amber-800")}>
							{t.methodologyWhyDiffer}
						</h3>
						<p className={"mt-2 text-sm " + (dark ? "text-amber-200/80" : "text-amber-700")}>
							{t.methodologyWhyDifferBody}
						</p>
					</div>
				</div>
			</div>
		</div>,
		document.body,
	);
};
