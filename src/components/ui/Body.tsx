import { forwardRef, ReactNode } from 'react';

import Footer from '@/components/ui/Footer';
import { Header } from '@/sections/AuthenticatedApp';
import { cn } from '@/utils/classname';

export const Body = forwardRef(function Paper(
  props: {
    footer?: boolean;
    header?: boolean;
    className?: string;
    contentClassName?: string;
    style?: React.CSSProperties;
    children?: ReactNode;
  },
  ref?: React.Ref<HTMLDivElement>
) {
  const {
    className = '',
    contentClassName = '',
    footer = true,
    header = true,
  } = props;

  return (
    <div
      ref={ref}
      className={cn(
        'flex size-full flex-col justify-between overflow-x-auto rounded-[2px]',
        className
      )}
      id="body"
      style={{ overflowAnchor: 'none', ...props.style }}
    >
      <div>
        {header && <Header />}
        <div
          className={cn(
            'mx-auto w-full max-w-screen-xl rounded-sm px-4',
            contentClassName
          )}
          style={{ marginTop: header ? -16 : 0 }}
        >
          {props.children}
        </div>
      </div>
      {footer && <Footer />}
    </div>
  );
});
