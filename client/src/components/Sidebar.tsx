import React, { useMemo } from 'react';
import type { Site } from '../types';
import type { T } from '../constants/translations';

export const Sidebar: React.FC<{
  sites: Site[];
  volFilter: string; onFilter: (g: string) => void;
  complexityFilter: string; onComplexity: (c: string) => void;
  t: T; dark: boolean;
}> = ({sites, volFilter, onFilter, complexityFilter, onComplexity, t, dark}) => {
  const counts = useMemo(()=>({
    All: sites.length,
    G1: sites.filter(s=>s.group==='G1').length,
    G2: sites.filter(s=>s.group==='G2').length,
    G3: sites.filter(s=>s.group==='G3').length,
  }),[sites]);

  const groups = [
    {key:'All', label:t.allSites,  range:t.fullUniverse, dotCls:'bg-gray-400'},
    {key:'G1',  label:'G1',        range:'< 2M HL',       dotCls:'bg-gray-300'},
    {key:'G2',  label:'G2',        range:'2–6M HL',       dotCls:'bg-gray-500'},
    {key:'G3',  label:'G3',        range:'> 6M HL',       dotCls:'bg-gray-800'},
  ];

  const levels = [
    {code:'L0', hex:'#D1D5DB'},
    {code:'L1', hex:'#FFE066'},
    {code:'L2', hex:'#FFC000'},
    {code:'L3', hex:'#F59E0B'},
    {code:'L4', hex:'#10B981'},
  ] as const;

  const card = dark?'bg-gray-800 border-gray-700':'bg-white border-gray-100';
  const hdr  = dark?'border-gray-700 text-gray-400':'border-gray-100 text-gray-500';

  return (
    <div className="flex flex-col gap-3">
      {/* Volume — compact pill row */}
      <div className={'rounded-xl border shadow-sm overflow-hidden ' + (card)}>
        <div className={'px-4 pt-3 pb-2 border-b ' + (hdr)}>
          <p className="text-[10px] font-black uppercase tracking-widest">{t.volumeGroups}</p>
        </div>
        <div className="p-2 flex flex-col gap-1">
          {groups.map(g=>{
            const active=volFilter===g.key;
            const count=counts[g.key as keyof typeof counts];
            return(
              <button key={g.key} onClick={()=>onFilter(g.key)}
                className={'w-full px-3 py-2 rounded-lg font-bold transition-all flex items-center gap-2.5 ' + (
                  active
                    ? 'bg-yellow-400 text-gray-900'
                    : (dark?'text-gray-300 hover:bg-gray-700':'text-gray-600 hover:bg-gray-50')
                )}>
                <div className={'w-2.5 h-2.5 rounded-full flex-shrink-0 ' + (active?'bg-gray-900':g.dotCls)}/>
                <span className="text-xs font-bold flex-1 text-left">{g.label}</span>
                <span className={'text-[10px] font-normal ' + (active?'text-gray-700':dark?'text-gray-500':'text-gray-400')}>{g.range}</span>
                <span className={'text-[10px] font-bold tabular-nums min-w-[28px] text-right ' + (active?'text-gray-800':(dark?'text-gray-400':'text-gray-400'))}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Complexidade do Mix */}
      <div className={'rounded-xl border shadow-sm overflow-hidden ' + (card)}>
        <div className={'px-4 pt-3 pb-2 border-b ' + (hdr)}>
          <p className="text-[10px] font-black uppercase tracking-widest">Complexidade do mix</p>
        </div>
        <div className="p-2 flex flex-col gap-1">
          {([
            {key:'All', label:'Todos',  desc:'',                dotCls:'bg-gray-400',
             tooltip:'Todas as operações, sem filtro de complexidade.'},
            {key:'L',   label:'Baixa',  desc:'Domínios homogêneos', dotCls:'bg-indigo-300',
             tooltip:'Baixa heterogeneidade (1º tercil da variância de domínio).\nOperações com todos os domínios no mesmo nível: ex. 9 domínios todos em score 2 → variância zero.\nNeste dataset, captura principalmente operações L2 completamente equilibradas.\n⚠️ Para análise de maturidade vs resultados, use "Todos" — este filtro concentra operações no mesmo nível tecnológico, impossibilitando correlação.'},
            {key:'M',   label:'Média',  desc:'Domínios parcialmente assimétricos', dotCls:'bg-indigo-500',
             tooltip:'Heterogeneidade média (2º tercil).\nOperações com alguns domínios acima da média: ex. TG=2 mas BP=3, QL=3.\nMix de L1 avançados e L2 com capacidades diferenciadas em domínios específicos.\nUtil para identificar operações em transição de nível.'},
            {key:'H',   label:'Alta',   desc:'Domínios muito assimétricos', dotCls:'bg-indigo-800',
             tooltip:'Alta heterogeneidade (3º tercil).\nOperações com domínios muito desiguais: ex. score 2 em 8 domínios mas 0 em 1 domínio crítico → nível L0.\nCaptura principalmente operações L0/L1 onde o domínio mais fraco "segura" o nível global.\nIdeal para análise de onde concentrar investimento para destravar o próximo nível.'},
          ] as const).map(g=>{
            const active = complexityFilter === g.key;
            return (
              <button key={g.key} onClick={()=>onComplexity(g.key)} title={g.tooltip}
                className={'w-full px-3 py-2 rounded-lg font-bold transition-all flex items-center gap-2.5 ' + (
                  active ? 'bg-yellow-400 text-gray-900' : (dark?'text-gray-300 hover:bg-gray-700':'text-gray-600 hover:bg-gray-50')
                )}>
                <div className={'w-2.5 h-2.5 rounded-full flex-shrink-0 ' + (active ? 'bg-gray-900' : g.dotCls)}/>
                <span className="text-xs font-bold flex-1 text-left">{g.label}</span>
                <span className={'text-[10px] font-normal truncate max-w-[80px] ' + (active?'text-gray-700':dark?'text-gray-500':'text-gray-400')}>{g.desc}</span>
              </button>
            );
          })}
        </div>
        <div className={'px-4 pb-2 pt-1 border-t ' + (hdr)}>
          <p className="text-[9px] leading-snug">Tercis do dataset. Volume real (9 KPIs PB-R0xxx) quando disponível; proxy pela variância de scores de domínio caso contrário.</p>
        </div>
      </div>

      {/* Glide Path */}
      <div className={'rounded-xl border shadow-sm overflow-hidden ' + (card)}>
        <div className={'px-4 pt-3 pb-2 border-b ' + (hdr)}>
          <p className="text-[10px] font-black uppercase tracking-widest">{t.glidePathTitle}</p>
        </div>
        <div className="p-2">
          {levels.map((l,i)=>{
            const info = t.levels[l.code as keyof typeof t.levels];
            const isLast = i === levels.length-1;
            return(
              <div key={l.code} className="flex items-stretch gap-2.5">
                <div className="flex flex-col items-center w-6 flex-shrink-0">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 border border-black/10" style={{backgroundColor:l.hex}}>
                    <span className="text-[9px] font-black text-gray-800">{l.code}</span>
                  </div>
                  {!isLast && <div className={'w-px flex-1 my-0.5 ' + (dark?'bg-gray-600':'bg-gray-200')}/>}
                </div>
                <div className={'py-1 ' + (!isLast?'pb-2':'')}>
                  <p className={'text-[11px] font-bold leading-tight ' + (dark?'text-gray-200':'text-gray-800')}>{info.label}</p>
                  <p className={'text-[9px] leading-snug ' + (dark?'text-gray-500':'text-gray-400')}>{info.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
