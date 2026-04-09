import React from 'react';

export const SparkBar: React.FC<{
  value: number | null;
  max: number;
  color: string;
  label: string;
  dark: boolean;
}> = ({ value, max, color, label, dark }) => {
  if (value == null || max <= 0) return <span className={dark ? 'text-gray-600' : 'text-gray-400'}>—</span>;
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="flex items-center gap-1.5 min-w-[110px]">
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: dark ? '#374151' : '#e5e7eb' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className={'text-xs tabular-nums font-medium ' + (dark ? 'text-gray-300' : 'text-gray-700')}>{label}</span>
    </div>
  );
};
