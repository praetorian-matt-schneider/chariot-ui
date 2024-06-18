import { useEffect, useState } from 'react';

export const useFilter = <T>(
  defaultValue: T,
  setSelectedRows?: (value: string[]) => void
): [T, (filter: T) => void] => {
  const [filter, setFilter] = useState<T>(defaultValue);

  useEffect(() => {
    const el = document.getElementById('body');
    el && el.scrollTo({ top: 0, behavior: 'smooth' });

    setSelectedRows?.([]);
  }, [filter]);

  return [filter, setFilter];
};
