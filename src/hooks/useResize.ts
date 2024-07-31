import { useEffect } from 'react';

import { StorageKey, useStorage } from '@/utils/storage/useStorage.util';

interface Props {
  el: HTMLElement;
  minWidth?: number;
  position?: 'left' | 'right';
  storageKey?: string; // Optional storage key to make it element-specific
}

export const useResize = (props: Props) => {
  const { minWidth = 100, el, position = 'left', storageKey } = props;

  // Use storage for persisting the size
  const [size, setSize] = useStorage(
    {
      key: storageKey ? `${StorageKey.RESIZE}_${storageKey}` : undefined,
    },
    {
      x: 0,
      y: 0,
    }
  );

  useEffect(() => {
    const { width, height } = el.getBoundingClientRect();
    setSize({
      x: getWidth(width),
      y: height,
    });
  }, [el]);

  const getWidth = (width: number) => {
    return width < minWidth ? minWidth : width;
  };

  const onMouseDown = (mouseDownEvent: React.MouseEvent<HTMLDivElement>) => {
    const startSize = size;
    const startPosition = { x: mouseDownEvent.pageX, y: mouseDownEvent.pageY };
    document.body.classList.add('col-resize');

    function onMouseMove(mouseMoveEvent: MouseEvent) {
      setSize({
        x:
          position === 'left'
            ? getWidth(startSize.x - startPosition.x + mouseMoveEvent.pageX)
            : getWidth(screen.width - mouseMoveEvent.pageX),
        y: startSize.y - startPosition.y + mouseMoveEvent.pageY,
      });
    }

    function onMouseUp() {
      document.body.classList.remove('col-resize');
      document.body.removeEventListener('mousemove', onMouseMove);
    }

    document.body.addEventListener('mousemove', onMouseMove);
    document.body.addEventListener('mouseup', onMouseUp, { once: true });
  };

  return {
    size,
    onMouseDown,
  };
};
