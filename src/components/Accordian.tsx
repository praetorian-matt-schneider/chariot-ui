import { ReactNode } from 'react';
import { ChevronUpIcon } from '@heroicons/react/24/outline';

import { cn } from '@/utils/classname';
import { useStorage } from '@/utils/storage/useStorage.util';

interface AccordianProps {
  title: ReactNode;
  children: ReactNode;
  defaultValue?: boolean;
  value?: boolean;
  onChange?: (open: boolean) => void;
  className?: string;
  contentClassName?: string;
  headerClassName?: string;
}

export function Accordian(props: AccordianProps) {
  const [open, setOpen] = useStorage(
    { parentState: props.value, onParentStateChange: props.onChange },
    props.defaultValue ?? true
  );

  return (
    <div
      className={cn(
        'bg-white border border-gray-300 p-2 rounded-sm',
        props.className
      )}
    >
      <div
        className={cn(
          'flex cursor-pointer items-center justify-between gap-2 py-1 select-none',
          props.headerClassName
        )}
        onClick={() => {
          setOpen(!open);
        }}
      >
        <h6 className="truncate text-sm font-semibold">{props.title}</h6>
        <ChevronUpIcon
          className={cn(
            'size-4 stroke-[3px] text-default-dark transition-transform duration-150 select-none',
            !open && 'rotate-180'
          )}
        />
      </div>
      {open && (
        <div className={cn('', props.contentClassName)}>{props.children}</div>
      )}
    </div>
  );
}
