import { useCallback, useEffect } from 'react';

import { debounce } from '@/utils/debounce.util';

export const useScroll = (
  parentRef: HTMLElement | null,
  fetchNextPage?: () => void
) => {
  const handleScroll = useCallback(() => {
    if (parentRef) {
      const { scrollTop, clientHeight, scrollHeight } = parentRef;
      if (scrollTop + clientHeight >= scrollHeight - 200) {
        fetchNextPage && fetchNextPage();
      }
    }
  }, [parentRef, fetchNextPage]);

  useEffect(() => {
    const debounceHandleScroll = debounce(handleScroll, 500);

    if (parentRef && parentRef) {
      parentRef.addEventListener('scroll', debounceHandleScroll);
      return () => {
        parentRef &&
          parentRef.removeEventListener('scroll', debounceHandleScroll);
      };
    }
  }, [parentRef]);
};

export const useScrollToElement = ({ className }: { className: string }) => {
  function scrollToElement() {
    const el = document.getElementsByClassName(className);
    if (el && el.length > 0) {
      el[0].scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }

  return { scrollToElement };
};
