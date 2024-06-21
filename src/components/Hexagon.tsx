import React, { ReactNode } from 'react';

import { Notification } from '@/components/Notification';
import { cn } from '@/utils/classname';

interface HexagonProps {
  notify?: boolean;
  children: ReactNode;
  className?: string;
}

export function Hexagon(props: HexagonProps) {
  return (
    <div className={cn('relative', props.className)}>
      <div
        style={{
          clipPath:
            'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
        }}
        className="relative flex h-[1.2em] w-[1em] items-center justify-center bg-header-dark text-[32px]"
      >
        {props.children}
      </div>
      {props.notify && <Notification />}
    </div>
  );
}
