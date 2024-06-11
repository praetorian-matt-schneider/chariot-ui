import { useEffect, useState } from 'react';

export const useFilter = (
  defaultValue = '',
  setSelectedRows?: (value: string[]) => void
): [string, (filter: string) => void] => {
  const [filter, setFilter] = useState(defaultValue);

  useEffect(() => {
    const el = document.getElementById('body');
    el && el.scrollTo({ top: 0, behavior: 'smooth' });

    setSelectedRows?.([]);
  }, [filter]);

  return [filter, setFilter];
};
