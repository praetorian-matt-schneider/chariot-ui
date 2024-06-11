import { useEffect } from 'react';

export const useMutationObserver = (
  ref: HTMLElement | null,
  callback: MutationCallback,
  options: MutationObserverInit = {}
) => {
  useEffect(() => {
    if (ref) {
      const observer = new MutationObserver(callback);
      observer.observe(ref, options);
      return () => observer.disconnect();
    }
  }, [callback, options]);
};
