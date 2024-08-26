import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import { omit } from '@/utils/lodash.util';

// Define the context and its interface for selections
interface StickyContextType {
  useCreateSticky<T extends HTMLElement>(props: {
    id: string;
    offset?: number;
    notSticky?: boolean;
  }): React.RefObject<T>;
  getSticky(...args: string[]): number;
}

const StickyContext = createContext<StickyContextType | undefined>(undefined);

export const useSticky = () => {
  const context = useContext(StickyContext);
  if (!context) {
    throw new Error('useSticky must be used within a StickyProvider');
  }
  return context;
};

export const StickyProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [stickyElements, setStickyElements] = useState<Record<string, number>>(
    {}
  );

  function useCreateSticky<T extends HTMLElement>(props: {
    id: string;
    offset?: number;
    notSticky?: boolean;
  }): React.RefObject<T> {
    const ref = useRef<T>(null);

    function getStickyElementsHeight() {
      setStickyElements(prevStickyElements => {
        return {
          ...prevStickyElements,
          [props.id]: (ref.current?.clientHeight || 0) + (props.offset || 0),
        };
      });
    }

    useEffect(() => {
      if (ref.current && !props.notSticky) {
        const observer = new MutationObserver(getStickyElementsHeight);

        observer.observe(ref.current, {
          attributes: true,
          childList: true,
          subtree: true,
        });

        window.addEventListener('resize', getStickyElementsHeight);

        getStickyElementsHeight();

        return () => {
          window.removeEventListener('resize', getStickyElementsHeight);
          observer.disconnect();

          setStickyElements(prevStickyElements =>
            omit(prevStickyElements, props.id)
          );
        };
      } else {
        setStickyElements(prevStickyElements =>
          omit(prevStickyElements, props.id)
        );
      }
    }, [props.notSticky]);

    return ref;
  }

  const getSticky = useCallback(
    (...args: string[]) => {
      return args.reduce((acc, id) => acc + (stickyElements[id] || 0), 0);
    },
    [JSON.stringify(stickyElements)]
  );

  console.log('stickyElements', stickyElements);
  return (
    <StickyContext.Provider value={{ useCreateSticky, getSticky }}>
      {children}
    </StickyContext.Provider>
  );
};
