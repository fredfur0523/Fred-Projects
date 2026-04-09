import React, { useMemo } from "react";
import { GHQ_TOTALS } from "../constants/domains";
import type { T } from "../constants/translations";
import type { KpiHistoryData, Site } from "../types";
import { barColor, calcFunnel } from "../utils/funnel";
import { SiteTooltip } from "./shared/SiteTooltip";

interface FunnelCardProps {
	title: string;
	subtitle?: string;
	domain: string;
	zone: string;
	volFilter: string;
	sites: Site[];
	isFeatured?: boolean;
	accent?: string;
	t: T;
	dark: boolean;
	kpiHistory?: KpiHistoryData | null;
}

const FunnelCardInner: React.FC<FunnelCardProps> = ({
	title,
	subtitle,
	domain,
	zone,
	volFilter,
	sites,
	isFeatured,
	accent,
	t,
	dark,
	kpiHistory,
}) => {
	const { avg, totalSites, funnel } = useMemo(
		() => calcFunnel(sites, domain, zone, volFilter),
		[sites, domain, zone, volFilter],
	);
	const ghqTotal = GHQ_TOTALS[domain]?.[zone] ?? 0;
	const ghqCls =
		ghqTotal >= 70
			? dark
				? "border-emerald-500 bg-emerald-900/30 text-emerald-300"
				: "border-emerald-400 bg-emerald-50 text-emerald-800"
			: ghqTotal >= 40
				? dark
					? "border-yellow-500 bg-yellow-900/30 text-yellow-300"
					: "border-yellow-400 bg-yellow-50 text-yellow-800"
				: dark
					? "border-red-500 bg-red-900/30 text-red-300"
					: "border-red-300 bg-red-50 text-red-700";
	const cardBg = dark
		? "bg-gray-800 border-gray-700 hover:border-yellow-500"
		: "bg-white border-gray-100 hover:border-yellow-300";
	const lang = (t as any).langToggle === "EN" ? "pt" : "en";

	// OSE trend badge (3-month delta)
	const oseTrend = useMemo(() => {
		if (!kpiHistory || !zone || zone === "Global") return null;
		const zoneMonths = kpiHistory.months
			.filter((m) => m.zone === zone)
			.sort((a, b) => a.period.localeCompare(b.period));
		if (zoneMonths.length < 3) return null;
		const recent = zoneMonths.slice(-3);
		const delta = recent[2].OSE - recent[0].OSE;
		const p0 = recent[0].period;
		const p2 = recent[2].period;
		const arrow = delta > 1 ? "↑" : delta < -1 ? "↓" : "→";
		const label =
			Math.abs(delta) <= 1
				? lang === "pt"
					? "estável"
					: "stable"
				: `${delta > 0 ? "+" : ""}${delta.toFixed(1)}pp OSE`;
		const color =
			delta > 1
				? dark
					? "text-emerald-400 border-emerald-700 bg-emerald-900/30"
					: "text-emerald-700 border-emerald-300 bg-emerald-50"
				: delta < -1
					? dark
						? "text-red-400 border-red-700 bg-red-900/30"
						: "text-red-700 border-red-300 bg-red-50"
					: dark
						? "text-gray-400 border-gray-600 bg-gray-700"
						: "text-gray-500 border-gray-300 bg-gray-50";
		const tooltip = `${lang === "pt" ? "Tendência" : "Trend"} OSE (3M): ${zone} ${p0}→${p2}`;
		return { arrow, label, color, tooltip };
	}, [kpiHistory, zone, dark, lang]);

	return (
		<div
			className={
				"rounded-2xl border shadow-sm hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden ${cardBg} " +
				(isFeatured ? "h-full" : "")
			}
		>
			{accent && <div className="h-1 w-full flex-shrink-0" style={{ backgroundColor: accent }} />}
			<div className="p-5 flex flex-col flex-grow">
				<div className="flex justify-between items-start mb-4">
					<div className="min-w-0 mr-3">
						<h3 className={"text-base font-black leading-tight " + (dark ? "text-white" : "text-gray-900")}>{title}</h3>
						{subtitle && <p className={"text-xs mt-0.5 " + (dark ? "text-gray-400" : "text-gray-400")}>{subtitle}</p>}
					</div>
					<div className="flex flex-col items-end gap-1.5 flex-shrink-0">
						<div className="flex gap-1.5">
							<span className={"border px-2 py-0.5 rounded-full text-[11px] font-bold " + ghqCls}>GHQ {ghqTotal}%</span>
							<span
								className={
									"border px-2 py-0.5 rounded-full text-[11px] font-bold " +
									(dark ? "border-gray-600 bg-gray-700 text-gray-300" : "border-gray-200 bg-gray-50 text-gray-700")
								}
							>
								Avg {avg}
							</span>
						</div>
						<span className={"text-[10px] font-medium " + (dark ? "text-gray-500" : "text-gray-400")}>
							{totalSites} sites
						</span>
						{oseTrend && (
							<span
								className={"border px-1.5 py-0.5 rounded-full text-[10px] font-bold " + oseTrend.color}
								title={oseTrend.tooltip}
							>
								{oseTrend.arrow} {oseTrend.label}
							</span>
						)}
					</div>
				</div>

				{totalSites === 0 ? (
					<p className={"text-xs px-1 py-2 " + (dark ? "text-amber-400/90" : "text-amber-600")}>{t.noSitesInFilter}</p>
				) : (
					<div className="flex flex-grow" style={{ minHeight: isFeatured ? "240px" : "200px" }}>
						{/* Funnel arrow */}
						<div className="w-7 flex-shrink-0 relative mr-3">
							<div className="absolute inset-0 flex flex-col items-center pt-2 pb-2">
								<div className="w-[3px] flex-1 bg-gradient-to-b from-gray-300 to-emerald-500 rounded-t" />
								<div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[7px] border-l-transparent border-r-transparent border-t-emerald-500" />
							</div>
							<span
								className={
									"absolute -top-1 left-1/2 -translate-x-1/2 text-[9px] font-black " +
									(dark ? "text-gray-500" : "text-gray-400")
								}
							>
								L0
							</span>
							<span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-black text-emerald-500">
								L4
							</span>
						</div>

						<div className="flex-grow flex flex-col justify-between py-0.5">
							{funnel.map((item) => (
								<div key={item.level} className="flex items-center w-full relative">
									<SiteTooltip sites={item.exclusiveSites} level={item.level} t={t} dark={dark} />
									<span
										className={
											"text-[11px] font-black w-7 flex-shrink-0 " +
											(item.pct === 0
												? dark
													? "text-gray-600"
													: "text-gray-300"
												: dark
													? "text-gray-400"
													: "text-gray-500")
										}
									>
										{item.level}
									</span>
									<div className="flex-grow mx-2">
										<div
											className={
												"h-7 rounded-lg overflow-hidden border " +
												(dark ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-100")
											}
										>
											<div
												className="h-full rounded-lg transition-all duration-700 ease-out"
												style={{ width: item.pct + "%", backgroundColor: barColor(item.level) }}
											/>
										</div>
									</div>
									<div className="flex items-center gap-1.5 flex-shrink-0 justify-end" style={{ minWidth: "80px" }}>
										<span
											className={
												"font-black text-sm tabular-nums " +
												(item.pct === 0
													? dark
														? "text-gray-600"
														: "text-gray-300"
													: dark
														? "text-white"
														: "text-gray-900")
											}
										>
											{item.pct}%
										</span>
										<span
											className={
												"text-xs tabular-nums " +
												(item.pct === 0
													? dark
														? "text-gray-700"
														: "text-gray-200"
													: dark
														? "text-gray-500"
														: "text-gray-400")
											}
										>
											({item.siteCount})
										</span>
									</div>
								</div>
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export const FunnelCard = React.memo(FunnelCardInner);
