#!/usr/bin/env python3
"""
replace_compare_tab.py
Replaces Sections A + B in the compare tab with the new domain-level design.
Also removes two dead code blocks.
"""
from pathlib import Path

APP = Path(__file__).parent.parent / "client/src/App.tsx"
content = APP.read_text(encoding="utf-8")

# ── 1. Remove zoneAdoption computation + replace return() with new design ──────
# We'll replace from "// ── Zone adoption data" through the closing of Section B

OLD_ZONE_ADOPTION_MARKER = """              // ── Zone adoption data (always all 6 zones) ───────────────────
              const ZONE_LIST_ALL = ['NAZ','MAZ','SAZ','EUR','AFR','APAC'] as const;
              const zoneAdoption = ZONE_LIST_ALL.map(z => {"""

assert OLD_ZONE_ADOPTION_MARKER in content, "ZONE_ADOPTION marker not found"

# Find the Section B end: "</div>\n\n                </div>\n              );\n            })()}"
OLD_SECTION_B_END = """                </div>

                </div>
              );
            })()}"""

assert OLD_SECTION_B_END in content, "SECTION_B_END marker not found"

# Build the NEW code block (replacing from zoneAdoption to end of return statement)
NEW_CODE = """              // ── DOMAIN-LEVEL COMPARISON: UNION of all zone legacy products ────────────
              const allLegacyKeySet = new Set<string>();
              legacyProductsSorted.forEach(([prod]) => {
                resolveProdKeys(prod).forEach(k => allLegacyKeySet.add(k));
              });
              const lReadyCaps = allCaps.filter(({cap}) =>
                cap.status==='READY' && (cap.coveredBy as string[]).some((k:string) => allLegacyKeySet.has(k))
              );
              const lGateCov: Record<string,number> = {L1:0,L2:0,L3:0,L4:0};
              lReadyCaps.forEach(({gate}) => { lGateCov[gate]=(lGateCov[gate]||0)+1; });
              const gapCaps = gReadyCaps.filter(({cap}) =>
                !(cap.coveredBy as string[]).some((k:string) => allLegacyKeySet.has(k))
              );
              const legacyExtraCaps = lReadyCaps.filter(({cap}) => !gReadyLocal(cap));

              // ── GPI (Global Parity Index) ──────────────────────────────────────────────
              const sitesWithDom = [...gSites, ...lSites];
              const avgScoreDom = sitesWithDom.length > 0
                ? sitesWithDom.reduce((a,s) => a+(s.scores[fullDom]??0),0)/sitesWithDom.length : 0;
              const capReadyPct = allCaps.length > 0 ? gReadyCaps.length/allCaps.length : 0;
              const globalAdoptionFrac = (gSites.length+lSites.length) > 0
                ? gSites.length/(gSites.length+lSites.length) : 0;
              const gpi = 0.50*capReadyPct + 0.30*globalAdoptionFrac + 0.20*Math.min(avgScoreDom/2.0, 1.0);
              const gpiColor = gpi>=0.70?(dark?'#10B981':'#059669'):gpi>=0.45?(dark?'#F59E0B':'#D97706'):(dark?'#EF4444':'#DC2626');

              return (
                <div className="space-y-5">

                  {/* ── KPI Hero Strip ───────────────────────────────────── */}
                  <div className="grid grid-cols-3 gap-3">
                    {/* GPI */}
                    <div className={'rounded-xl border p-4 ' + card} style={{borderTopWidth:3,borderTopColor:gpiColor}}>
                      <div className={'text-3xl font-black tabular-nums'} style={{color:gpiColor}}>
                        {Math.round(gpi*100)}%
                      </div>
                      <div className={'text-xs font-bold mt-1 ' + hdr}>Global Parity Index</div>
                      <div className={'text-[10px] mt-1 ' + sub}>
                        {Math.round(capReadyPct*100)}% caps · {Math.round(globalAdoptionFrac*100)}% G sites · avg {avgScoreDom.toFixed(1)}
                      </div>
                      <div className={'mt-2 h-1.5 rounded-full overflow-hidden '+(dark?'bg-gray-700':'bg-gray-200')}>
                        <div className="h-full rounded-full transition-all" style={{width:`${Math.round(gpi*100)}%`,backgroundColor:gpiColor}}/>
                      </div>
                      <div className={'flex justify-between mt-0.5'}>
                        <span className={'text-[8px] '+sub}>0%</span>
                        <span className={'text-[8px] font-bold '+(dark?'text-amber-400':'text-amber-600')}>meta: 85%</span>
                        <span className={'text-[8px] '+sub}>100%</span>
                      </div>
                    </div>
                    {/* Capability coverage */}
                    <div className={'rounded-xl border p-4 ' + card} style={{borderTopWidth:3,borderTopColor:'#3B82F6'}}>
                      <div className={'text-3xl font-black tabular-nums '+(dark?'text-blue-400':'text-blue-600')}>
                        {gReadyCaps.length}<span className={'text-lg font-normal '+(dark?'text-gray-500':'text-gray-400')}>/{allCaps.length}</span>
                      </div>
                      <div className={'text-xs font-bold mt-1 ' + hdr}>{lang==='pt'?'Caps. READY (Global)':'Caps. READY (Global)'}</div>
                      <div className={'text-[10px] mt-1 ' + sub}>{gSites.length} {lang==='pt'?'sites com prod. global':'sites with global prod.'}</div>
                    </div>
                    {/* Gap */}
                    {(() => {
                      const gc = gapCaps.length===0?(dark?'#10B981':'#059669'):gapCaps.length<=10?(dark?'#F59E0B':'#D97706'):(dark?'#EF4444':'#DC2626');
                      return (
                        <div className={'rounded-xl border p-4 ' + card} style={{borderTopWidth:3,borderTopColor:gc}}>
                          <div className={'text-3xl font-black tabular-nums'} style={{color:gc}}>{gapCaps.length}</div>
                          <div className={'text-xs font-bold mt-1 ' + hdr}>{lang==='pt'?'N4s com Gap':'N4s with Gap'}</div>
                          <div className={'text-[10px] mt-1 ' + sub}>
                            {lang==='pt'
                              ? `Global READY, legado ${compareZoneFilter??'todas zonas'} não cobre`
                              : `Global READY, ${compareZoneFilter??'all zones'} legacy doesn't cover`}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* ── Portfolio Comparison: Global vs Zone Legacy Combined ─ */}
                  <div className={'rounded-xl border overflow-hidden ' + (dark?'border-gray-700':'border-gray-200')}>
                    <div className={'px-4 py-2.5 flex items-center gap-3 border-b ' + (dark?'bg-gray-800 border-gray-700':'bg-gray-50 border-gray-200')}>
                      <span className={'text-xs font-black uppercase tracking-wider ' + sub}>
                        {lang==='pt'?'Cobertura por Nível':'Coverage by Gate'} — {compareDom}{compareZoneFilter?' · '+compareZoneFilter:''}
                      </span>
                      <div className="flex-1"/>
                      <span className={'text-[10px] ' + sub}>
                        {lang==='pt'
                          ? `Legado = union de ${Object.keys(legacyProductMap).length} produto(s)`
                          : `Legacy = union of ${Object.keys(legacyProductMap).length} product(s)`}
                      </span>
                    </div>
                    <div className="p-4 space-y-3">
                      {/* Column headers */}
                      <div className="flex items-center gap-3">
                        <div className="w-20 flex-shrink-0"/>
                        {(['L1','L2','L3','L4'] as const).map(g => (
                          <div key={g} className="flex-1 min-w-0 text-center">
                            <span className={'text-[9px] font-black px-1.5 py-0.5 rounded'} style={{backgroundColor:gateColor[g]+'33',color:gateColor[g]}}>{g}</span>
                            <span className={'text-[8px] block ' + sub}>{gateTotals[g]} caps</span>
                          </div>
                        ))}
                      </div>
                      {/* Global row */}
                      <div className={'rounded-lg border p-3 '+(dark?'border-blue-700/40 bg-blue-900/10':'border-blue-200 bg-blue-50/40')}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={'text-[9px] font-black px-1.5 py-0.5 rounded '+(dark?'bg-blue-900/60 text-blue-300':'bg-blue-100 text-blue-700')}>🌐 Global</span>
                          <span className={'text-xs font-bold flex-1 '+(dark?'text-blue-200':'text-blue-800')}>
                            {[...gk].map(k => PROD_DISPLAY[k]??k).join(' · ') || compareDom}
                          </span>
                          {gAvg!=null && (
                            <span className={'text-[10px] font-black px-1.5 py-0.5 rounded-full border'} style={{backgroundColor:levelColors[gLevel]+'33',color:levelColors[gLevel],borderColor:levelColors[gLevel]+'66'}}>
                              L{gLevel} · {gAvg.toFixed(1)}
                            </span>
                          )}
                          <span className={'text-[9px] ' + sub}>{gSites.length} sites · {gReadyCaps.length}/{allCaps.length} caps</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-20 flex-shrink-0"/>
                          {(['L1','L2','L3','L4'] as const).map(g => (
                            <div key={g} className="flex-1 min-w-0">{capBar(gGateCov[g]||0, gateTotals[g]||0, gateColor[g])}</div>
                          ))}
                        </div>
                      </div>
                      {/* Zone legacy combined row */}
                      {lSites.length > 0 ? (
                        <div className={'rounded-lg border p-3 '+(dark?'border-amber-700/40 bg-amber-900/5':'border-amber-200 bg-amber-50/30')}>
                          <div className="flex items-center gap-2 mb-2">
                            <span className={'text-[9px] font-black px-1.5 py-0.5 rounded '+(dark?'bg-amber-900/60 text-amber-300':'bg-amber-100 text-amber-700')}>⬡ {lang==='pt'?'Legado':'Legacy'}</span>
                            <span className={'text-xs font-bold flex-1 truncate '+(dark?'text-amber-200':'text-amber-800')}>
                              {legacyProductsSorted.map(([p])=>p).join(' + ') || (lang==='pt'?'Portfólio da Zona':'Zone Portfolio')}
                            </span>
                            {(() => {
                              const lAvg = lSites.reduce((a,s)=>a+(s.scores[fullDom]??0),0)/lSites.length;
                              const lLv = Math.min(4,Math.round(lAvg));
                              return <span className={'text-[10px] font-black px-1.5 py-0.5 rounded-full border flex-shrink-0'} style={{backgroundColor:levelColors[lLv]+'33',color:levelColors[lLv],borderColor:levelColors[lLv]+'66'}}>L{lLv} · {lAvg.toFixed(1)}</span>;
                            })()}
                            <span className={'text-[9px] flex-shrink-0 ' + sub}>{lSites.length} sites · {lReadyCaps.length}/{allCaps.length} caps</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="w-20 flex-shrink-0"/>
                            {(['L1','L2','L3','L4'] as const).map(g => (
                              <div key={g} className="flex-1 min-w-0">{capBar(lGateCov[g]||0, gateTotals[g]||0, gateColor[g])}</div>
                            ))}
                          </div>
                          {legacyProductsSorted.length > 1 && (
                            <div className={'mt-2 flex flex-wrap gap-1.5'}>
                              {legacyProductsSorted.map(([prod, data]) => (
                                <span key={prod} className={'text-[9px] px-1.5 py-0.5 rounded border '+(dark?'border-amber-700/40 text-amber-400 bg-amber-900/20':'border-amber-200 text-amber-700 bg-amber-50')}>
                                  {prod} ({data.sites.length})
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className={'text-xs italic px-2 ' + sub}>{lang==='pt'?'Nenhum produto legado na zona selecionada.':'No legacy products in the selected zone.'}</div>
                      )}
                    </div>
                  </div>

                  {/* ── Gap Detail: N4s global READY, zone legacy combined doesn't cover ─ */}
                  {gapCaps.length > 0 && (
                    <div className={'rounded-xl border overflow-hidden ' + (dark?'border-red-900/40':'border-red-200')}>
                      <div className={'px-4 py-2.5 flex items-center gap-3 border-b ' + (dark?'bg-red-900/10 border-red-900/30':'bg-red-50/60 border-red-200')}>
                        <span className={'text-xs font-black uppercase tracking-wider '+(dark?'text-red-400':'text-red-700')}>
                          Δ {lang==='pt'
                            ? `Gap: ${gapCaps.length} N4s que o Global entrega e o portfólio legado não cobre`
                            : `Gap: ${gapCaps.length} N4s Global delivers, legacy portfolio doesn't cover`}
                        </span>
                        <div className="flex-1"/>
                        {compareZoneFilter && <span className={'text-[10px] '+sub}>{compareZoneFilter}</span>}
                      </div>
                      <div className={'divide-y ' + (dark?'divide-gray-700/50':'divide-gray-100')}>
                        {(['L1','L2','L3','L4'] as const).map(gate => {
                          const gateGaps = gapCaps.filter(x => x.gate===gate);
                          if (gateGaps.length===0) return null;
                          const gKey = `gap_g_${gate}`;
                          const isOpen = expandedN3s.has(gKey);
                          const n3Map: Record<string, typeof gateGaps> = {};
                          gateGaps.forEach(x => { const k=x.cap.n3||'—'; if(!n3Map[k]) n3Map[k]=[]; n3Map[k].push(x); });
                          return (
                            <div key={gate}>
                              <button onClick={() => toggleN3(gKey)}
                                className={'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ' + (dark?'hover:bg-gray-700/30':'hover:bg-gray-50')}>
                                <span className={'text-[9px] font-black px-1.5 py-0.5 rounded flex-shrink-0'} style={{backgroundColor:gateColor[gate]+'33',color:gateColor[gate]}}>{gate}</span>
                                <span className={'text-xs flex-1 ' + (dark?'text-gray-300':'text-gray-600')}>{gateGaps.length} {lang==='pt'?'N4s não cobertas':'N4s not covered'}</span>
                                <span className={'text-[10px] ' + sub}>{Object.keys(n3Map).length} N3</span>
                                <svg className={'w-3 h-3 flex-shrink-0 transition-transform ' + (isOpen?'rotate-90':'')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path d="M9 5l7 7-7 7"/>
                                </svg>
                              </button>
                              {isOpen && (
                                <div className={'divide-y ' + (dark?'divide-gray-700/30':'divide-gray-100')}>
                                  {Object.entries(n3Map).map(([n3k, items]) => {
                                    const n3key = `gap_g_${gate}_${n3k}`;
                                    const n3open = expandedN3s.has(n3key);
                                    return (
                                      <div key={n3k} className={dark?'bg-gray-800/20':'bg-gray-50/40'}>
                                        <button onClick={() => toggleN3(n3key)}
                                          className={'w-full flex items-center gap-2 px-6 py-1.5 text-left ' + (dark?'hover:bg-gray-700/30':'hover:bg-gray-50')}>
                                          <span className={'text-[10px] flex-1 font-medium ' + (dark?'text-gray-300':'text-gray-600')}>{n3k}</span>
                                          <span className={'text-[9px] ' + sub}>{items.length} N4</span>
                                          <svg className={'w-2.5 h-2.5 flex-shrink-0 transition-transform ' + (n3open?'rotate-90':'')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path d="M9 5l7 7-7 7"/>
                                          </svg>
                                        </button>
                                        {n3open && (
                                          <div className="pl-8 pr-4 pb-2 space-y-1">
                                            {items.map(({cap}, i) => {
                                              const gProds = [...new Set((cap.coveredBy as string[]).filter((k:string) => gk.has(k)).map((k:string) => PROD_DISPLAY[k]??k))];
                                              return (
                                                <div key={i} className="flex items-start gap-1.5">
                                                  <span className={'text-[8px] flex-shrink-0 mt-0.5 '+(dark?'text-red-400':'text-red-500')}>○</span>
                                                  <div className="flex-1 min-w-0">
                                                    <div className={'text-[9px] leading-tight '+(dark?'text-gray-300':'text-gray-600')}>{cap.name}</div>
                                                    {gProds.length>0 && <div className={'text-[8px] '+(dark?'text-blue-400':'text-blue-500')}>🌐 {gProds.join(', ')}</div>}
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {gapCaps.length === 0 && lSites.length > 0 && (
                    <div className={'rounded-xl border p-4 flex items-center gap-3 '+(dark?'border-emerald-700/40 bg-emerald-900/10':'border-emerald-200 bg-emerald-50/40')}>
                      <span className="text-2xl">✓</span>
                      <div>
                        <div className={'text-sm font-bold '+(dark?'text-emerald-400':'text-emerald-700')}>{lang==='pt'?'Paridade atingida!':'Parity achieved!'}</div>
                        <div className={'text-xs ' + sub}>{lang==='pt'
                          ? `O portfólio legado da zona cobre todas as ${gReadyCaps.length} caps READY do Global.`
                          : `Zone legacy portfolio covers all ${gReadyCaps.length} READY capabilities of Global.`}</div>
                      </div>
                    </div>
                  )}

                  {/* Legacy extras: what zone legacy has READY that global doesn't */}
                  {legacyExtraCaps.length > 0 && (
                    <div className={'rounded-xl border overflow-hidden ' + (dark?'border-amber-900/40':'border-amber-200')}>
                      <button className={'w-full px-4 py-2.5 flex items-center gap-3 border-b text-left ' + (dark?'bg-amber-900/10 border-amber-900/30 hover:bg-amber-900/20':'bg-amber-50/60 border-amber-200 hover:bg-amber-50')}
                        onClick={() => toggleN3('legacy_extras')}>
                        <span className={'text-xs font-black uppercase tracking-wider '+(dark?'text-amber-400':'text-amber-700')}>
                          + {lang==='pt'
                            ? `${legacyExtraCaps.length} N4s que o portfólio legado cobre e o Global ainda não entrega`
                            : `${legacyExtraCaps.length} N4s legacy covers that Global doesn't deliver yet`}
                        </span>
                        <div className="flex-1"/>
                        <svg className={'w-3 h-3 flex-shrink-0 transition-transform '+(expandedN3s.has('legacy_extras')?'rotate-90':'')} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path d="M9 5l7 7-7 7"/>
                        </svg>
                      </button>
                      {expandedN3s.has('legacy_extras') && (
                        <div className="p-3 space-y-1">
                          {legacyExtraCaps.map(({gate,cap},i) => (
                            <div key={i} className="flex items-start gap-1.5">
                              <span className={'text-[9px] px-1 py-0 rounded font-bold flex-shrink-0'} style={{backgroundColor:gateColor[gate]+'33',color:gateColor[gate]}}>{gate}</span>
                              <div className={'text-[9px] leading-tight flex-1 '+(dark?'text-gray-300':'text-gray-600')}>{cap.name}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              );
            })()}"""

# Now find the dead code blocks to remove
OLD_DEAD_BLOCK_1_START = '\n            {/* old ALL-domains code removed */}\n            {false && (() => {'
OLD_DEAD_BLOCK_2_START = '\n            {/* ── SINGLE DOMAIN view — replaced by new 2-section design above ── */}\n            {false && (() => {'

# The two dead blocks end with `})()}`
# We'll do replacements in order

# ── Step 1: Replace from zoneAdoption through end of current IIFE return ──────────
# The marker for end of current IIFE is: "              );\n            })()}"
OLD_ZONE_TO_END = content[content.index(OLD_ZONE_ADOPTION_MARKER):content.index(OLD_SECTION_B_END)+len(OLD_SECTION_B_END)]
content = content.replace(OLD_ZONE_TO_END, NEW_CODE, 1)
print(f"Step 1: Replaced zoneAdoption + Sections A+B ({len(OLD_ZONE_TO_END)} chars → {len(NEW_CODE)} chars)")

# ── Step 2: Remove dead code block 1 ──────────────────────────────────────────────
# Find from {/* old ALL-domains code removed */} to the next })()}
if OLD_DEAD_BLOCK_1_START in content:
    start_idx = content.index(OLD_DEAD_BLOCK_1_START)
    # Find the closing })()}\n of this block
    search_from = start_idx + len(OLD_DEAD_BLOCK_1_START)
    end_marker = '\n            })()}'
    end_idx = content.index(end_marker, search_from) + len(end_marker)
    removed = content[start_idx:end_idx]
    content = content[:start_idx] + content[end_idx:]
    print(f"Step 2: Removed dead block 1 ({len(removed)} chars)")
else:
    print("Step 2: Dead block 1 not found (may have already been removed)")

# ── Step 3: Remove dead code block 2 ──────────────────────────────────────────────
if OLD_DEAD_BLOCK_2_START in content:
    start_idx = content.index(OLD_DEAD_BLOCK_2_START)
    search_from = start_idx + len(OLD_DEAD_BLOCK_2_START)
    end_marker = '\n            })()}'
    end_idx = content.index(end_marker, search_from) + len(end_marker)
    removed = content[start_idx:end_idx]
    content = content[:start_idx] + content[end_idx:]
    print(f"Step 3: Removed dead block 2 ({len(removed)} chars)")
else:
    print("Step 3: Dead block 2 not found (may have already been removed)")

# ── Write output ───────────────────────────────────────────────────────────────────
APP.write_text(content, encoding="utf-8")
lines = content.count('\n') + 1
print(f"\nDone. Written to {APP} ({lines} lines)")
