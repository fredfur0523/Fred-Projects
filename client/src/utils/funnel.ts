// Funnel calculation and level color/pill utilities
import type { Site, FunnelMetrics, FunnelLevel } from '../types';
import { GHQ_TOTALS } from '../constants/domains';

export const calcFunnel = (sites: Site[], domain: string, zone: string, volFilter: string): FunnelMetrics => {
  const n = sites.length;
  const emptyFunnel: FunnelLevel[] = [
    {level:'L0',pct:0,siteCount:0,exclusiveSites:[],ghq:0},
    {level:'L1',pct:0,siteCount:0,exclusiveSites:[],ghq:0},
    {level:'L2',pct:0,siteCount:0,exclusiveSites:[],ghq:0},
    {level:'L3',pct:0,siteCount:0,exclusiveSites:[],ghq:0},
    {level:'L4',pct:0,siteCount:0,exclusiveSites:[],ghq:0},
  ];
  if (!n) return { avg:"0.00", totalSites:0, funnel:emptyFunnel };

  const byScore: Record<number,Site[]> = {0:[],1:[],2:[],3:[],4:[]};
  let sum = 0;
  sites.forEach(s => {
    const sc = s.scores[domain] ?? 0;
    sum += sc;
    byScore[Math.min(sc,4)].push(s);
  });

  const pe0=(byScore[0].length/n)*100, pe1=(byScore[1].length/n)*100,
      pe2=(byScore[2].length/n)*100, pe3=(byScore[3].length/n)*100;
  const avg=(sum/n).toFixed(2), total=n;

  const pct0=100;
  const pct1=Math.max(0,Math.round(100-pe0));
  const pct2=Math.max(0,Math.round(100-pe0-pe1));
  const pct3=Math.max(0,Math.round(100-pe0-pe1-pe2));
  const pct4=Math.max(0,Math.round(100-pe0-pe1-pe2-pe3));
  const sc=(p:number)=>Math.round((p/100)*total);
  const ghq=GHQ_TOTALS[domain]?.[zone]??0;

  return {
    avg, totalSites:total,
    funnel:[
      {level:'L0',pct:pct0,siteCount:sc(pct0),exclusiveSites:byScore[0],ghq:(ghq*pct0)/100},
      {level:'L1',pct:pct1,siteCount:sc(pct1),exclusiveSites:byScore[1],ghq:(ghq*pct1)/100},
      {level:'L2',pct:pct2,siteCount:sc(pct2),exclusiveSites:byScore[2],ghq:(ghq*pct2)/100},
      {level:'L3',pct:pct3,siteCount:sc(pct3),exclusiveSites:byScore[3],ghq:(ghq*pct3)/100},
      {level:'L4',pct:pct4,siteCount:sc(pct4),exclusiveSites:byScore[4],ghq:(ghq*pct4)/100},
    ]
  };
};

export const barColor=(l:string)=>l==='L0'?'#D1D5DB':l==='L1'?'#FFE066':l==='L2'?'#FFC000':l==='L3'?'#F59E0B':'#10B981';

export const levelPill=(l:string,dark:boolean)=>{
  const base='inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-black ';
  if(l==='L0') return base+(dark?'bg-gray-700 text-gray-300':'bg-gray-100 text-gray-500');
  if(l==='L1') return base+(dark?'bg-yellow-900/60 text-yellow-300':'bg-yellow-100 text-yellow-700');
  if(l==='L2') return base+'bg-yellow-400 text-gray-900';
  if(l==='L3') return base+'bg-amber-500 text-white';
  return base+'bg-emerald-500 text-white';
};
