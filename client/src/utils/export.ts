// CDN library loaders for export functionality

export const loadXLSX = (): Promise<any> => new Promise((resolve, reject) => {
  if ((window as any).XLSX) { resolve((window as any).XLSX); return; }
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/xlsx-js-style@1.2.0/dist/xlsx.bundle.js';
  script.onload = () => resolve((window as any).XLSX);
  script.onerror = reject;
  document.body.appendChild(script);
});

export const loadHtml2Pdf = (): Promise<any> => new Promise((resolve, reject) => {
  if ((window as any).html2pdf) { resolve((window as any).html2pdf); return; }
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
  script.onload = () => resolve((window as any).html2pdf);
  script.onerror = reject;
  document.body.appendChild(script);
});

export const _loadScript = (src: string): Promise<void> => new Promise((res, rej) => {
  const existing = document.querySelector(`script[src="${src}"]`);
  if (existing) { res(); return; }
  const s = document.createElement('script');
  s.src = src; s.onload = () => res(); s.onerror = rej;
  document.body.appendChild(s);
});

let _d3Loaded = false;
export const loadD3 = async (): Promise<void> => {
  if (_d3Loaded && (window as any).d3 && (window as any).topojson) return;
  await _loadScript('https://cdnjs.cloudflare.com/ajax/libs/d3/7.9.0/d3.min.js');
  await _loadScript('https://cdnjs.cloudflare.com/ajax/libs/topojson/3.0.2/topojson.min.js');
  _d3Loaded = true;
};
