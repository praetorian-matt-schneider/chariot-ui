import { ReactNode } from 'react';

interface HorizontalSplitProps {
  leftContainer: ReactNode;
  rightContainer: ReactNode;
}

export function HorizontalSplit(props: HorizontalSplitProps) {
  return (
    <div className="flex size-full gap-14">
      <div className="w-full">{props.leftContainer}</div>
      <div className="w-1/3 min-w-[350px] shrink-0">{props.rightContainer}</div>
    </div>
  );
}
