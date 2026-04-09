import React from 'react';
import ReactDOM from 'react-dom';
import type { T } from '../constants/translations';

export const FloatingComparisonBar: React.FC<{
  selected: string[]; dark: boolean; t: T;
  onRemove: (name: string) => void; onClear: () => void; onCompare: () => void;
}> = ({ selected, dark, t, onRemove, onClear, onCompare }) => {
  if (selected.length === 0) return null;
  const bar = dark ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900';
  return ReactDOM.createPortal(
    <div className="fixed bottom-0 left-0 right-0 z-[90] flex justify-center p-3 pointer-events-none">
      <div className={'pointer-events-auto flex items-center gap-3 px-5 py-3 rounded-2xl border shadow-2xl backdrop-blur-lg ' + bar} style={{maxWidth: 600}}>
        <span className="text-sm font-bold">🔍</span>
        {selected.map(name => (
          <span key={name} className={'inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ' + (dark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700')}>
            {name}
            <button onClick={() => onRemove(name)} className="ml-0.5 hover:text-red-400 transition-colors">×</button>
          </span>
        ))}
        {selected.length === 2 && (
          <button onClick={onCompare}
            className="px-4 py-1.5 rounded-xl text-xs font-black bg-yellow-400 text-gray-900 hover:bg-yellow-300 transition-all shadow-sm">
            {t.compareSites}
          </button>
        )}
        <button onClick={onClear}
          className={'ml-1 p-1.5 rounded-lg transition-all ' + (dark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-400')}>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
    </div>,
    document.body
  );
};
