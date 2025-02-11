import { ReactNode, useRef } from 'react';
import { UserCircleIcon } from '@heroicons/react/24/outline';

interface TimelineProps {
  items: { title: ReactNode; description?: ReactNode; icon?: ReactNode }[];
}
export function Timeline(props: TimelineProps) {
  const lastItemRef = useRef<HTMLDivElement>(null);
  const lastItemHeight = lastItemRef.current?.clientHeight || 0;

  return (
    <div className="relative mx-4 flex flex-col gap-8 pt-4 text-default">
      <div
        className="absolute left-[19px] top-0 z-0 w-[2px] bg-default"
        style={{
          height: `calc( 100% - ${lastItemHeight / 2}px)`,
        }}
      ></div>
      {props.items.map((item, index) => {
        if (!item.title) {
          return null;
        }
        return (
          <div
            ref={index === props.items.length - 1 ? lastItemRef : undefined}
            key={index}
            className="flex gap-3"
          >
            <div className="z-10 flex items-center justify-center rounded-full [&>*]:size-10 [&>*]:bg-layer0 [&>*]:text-gray-600">
              {item.icon || <UserCircleIcon className="stroke-1" />}
            </div>
            <div className="flex flex-col gap-1">
              <div className="text-sm">{item.title}</div>
              <div className="text-xs text-default-light">
                {item.description}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
