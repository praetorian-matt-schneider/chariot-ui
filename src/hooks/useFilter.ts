import { useStorage } from '@/utils/storage/useStorage.util';
import { useEffect } from 'react';

export const useFilter = <T>(
  defaultValue: T,
  key: string,
  setSelectedRows?: (value: string[]) => void
): [T, (filter: T) => void] => {
  const [filter, setFilter] = useStorage({ key }, defaultValue);

  useEffect(() => {
    const el = document.getElementById('body');
    if (el) {
      el.scrollTo({ top: 0, behavior: 'smooth' });
    }

    if (setSelectedRows) {
      setSelectedRows([]);
    }
  }, [filter, setSelectedRows]);

  return [filter, setFilter];
};
