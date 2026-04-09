// SiteTooltip: click-to-open, interactive, scrollable, portal-rendered
// Positioning: uses viewport-relative coords (fixed), no scrollY offset needed
import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactDOM from 'react-dom';
import type { Site } from '../../types';
import type { T } from '../../constants/translations';
import { levelPill } from '../../utils/funnel';
import { ZONE_COLORS } from '../../constants/domains';

interface TooltipProps { sites: Site[]; level: string; t: T; dark: boolean; }

export const SiteTooltip: React.FC<TooltipProps> = ({ sites, level, t, dark }) => {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, below: false });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 8;

  const toggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!triggerRef.current) return;
    if (visible) { setVisible(false); return; }
    const r = triggerRef.current.getBoundingClientRect();
    setPos({ top: r.top, left: r.left + r.width / 2, below: false });
    setPage(0);
    setVisible(true);
  }, [visible]);

  // Reposition after tooltip renders to avoid overflow
  useEffect(() => {
    if (!visible || !tooltipRef.current || !triggerRef.current) return;
    const tp = tooltipRef.current.getBoundingClientRect();
    const tr = triggerRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const MARGIN = 10;
    const TIP_W = tp.width;
    const TIP_H = tp.height;

    let top: number;
    let below = false;
    if (tr.top - TIP_H - MARGIN >= 0) {
      top = tr.top - TIP_H - MARGIN;
    } else {
      top = tr.bottom + MARGIN;
      below = true;
    }

    let left = tr.left + tr.width / 2 - TIP_W / 2;
    if (left < MARGIN) left = MARGIN;
    if (left + TIP_W > vw - MARGIN) left = vw - TIP_W - MARGIN;

    setPos({ top, left, below });
  }, [visible]);

  // Close on outside click
  useEffect(() => {
    if (!visible) return;
    const handler = (e: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setVisible(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [visible]);

  const bg = dark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-950 border-gray-800 text-white';
  const totalPages = Math.ceil(sites.length / PAGE_SIZE);
  const pageSites = sites.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <>
      <div
        ref={triggerRef}
        onClick={toggle}
        className={'absolute inset-0 z-10 ' + (sites.length > 0 ? 'cursor-pointer' : 'cursor-default')}
        title={sites.length > 0 ? `${sites.length} sites exclusivos — clique para ver` : undefined}
      />
      {visible && ReactDOM.createPortal(
        <div
          ref={tooltipRef}
          className={'fixed z-[9999] rounded-2xl shadow-2xl border p-4 w-80 pointer-events-auto ' + (bg)}
          style={{ top: pos.top, left: pos.left }}
          onClick={e => e.stopPropagation()}
        >
          <div className={'flex items-center gap-2 border-b pb-2 mb-3 ' + (dark ? 'border-gray-700' : 'border-gray-800')}>
            <span className={levelPill(level, dark)}>{level}</span>
            <span className="font-bold text-sm flex-1">{t.tooltipSites(level, sites.length)}</span>
            <div className="flex items-center gap-1">
              {totalPages > 1 && (
                <span className="text-[10px] text-gray-400">{page + 1}/{totalPages}</span>
              )}
              <button
                onClick={() => setVisible(false)}
                className="ml-1 text-gray-500 hover:text-gray-300 text-lg leading-none"
              >×</button>
            </div>
          </div>

          {sites.length === 0
            ? <p className="text-gray-400 italic text-xs text-center py-3">{t.tooltipEmpty}</p>
            : <div className="space-y-1">
                {pageSites.map((s, i) => {
                  const zc = ZONE_COLORS[s.zone];
                  return (
                    <div key={i} className="flex items-center justify-between gap-2 py-1 border-b border-gray-800 last:border-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={'px-1.5 py-0.5 rounded-full text-[9px] font-black border ' + (dark ? zc.darkBg + ' ' + zc.darkText : 'bg-gray-800 text-gray-200') + ' border-transparent'}>{s.zone}</span>
                        <span className="font-semibold text-xs truncate">{s.name}</span>
                      </div>
                      <span className="text-gray-400 text-[10px] whitespace-nowrap flex-shrink-0">{(s.volume / 1e6).toFixed(1)}M · {s.group}</span>
                    </div>
                  );
                })}
              </div>
          }

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-800">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-2 py-1 rounded text-[11px] font-bold disabled:opacity-30 hover:bg-gray-800 transition-colors"
              >← Prev</button>
              <span className="text-[10px] text-gray-500">{page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, sites.length)} de {sites.length}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
                className="px-2 py-1 rounded text-[11px] font-bold disabled:opacity-30 hover:bg-gray-800 transition-colors"
              >Next →</button>
            </div>
          )}

          <p className="text-[9px] text-gray-500 mt-2 pt-2 border-t border-gray-800">{t.tooltipNote}</p>
        </div>,
        document.body
      )}
    </>
  );
};
