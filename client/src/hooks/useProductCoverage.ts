// Hook: fetch and cache product-coverage-2026.json
import { useState, useCallback } from 'react';
import type { ProductCoverageData } from '../types';

export function useProductCoverage() {
  const [data, setData] = useState<ProductCoverageData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const fetchCoverage = useCallback(() => {
    if (data) return;
    setLoading(true);
    setError(false);
    fetch('/product-coverage-2026.json')
      .then(r => r.ok ? r.json() : Promise.reject('not ok'))
      .then(d => {
        if (d) setData(d as ProductCoverageData);
        setLoading(false);
      })
      .catch(() => { setLoading(false); setError(true); });
  }, [data]);

  return { data, loading, error, fetchCoverage };
}
