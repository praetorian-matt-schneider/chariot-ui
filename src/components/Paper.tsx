import { forwardRef } from 'react';

import { cn } from '@/utils/classname';

export const Paper = forwardRef(function Paper(
  props: React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLDivElement>,
    HTMLDivElement
  >,
  ref?: React.Ref<HTMLDivElement>
) {
  return (
    <div
      {...props}
      ref={ref}
      className={cn(
        'size-full overflow-x-auto rounded-[2px] bg-layer0 px-6 border-default border',
        props.className
      )}
    />
  );
});
