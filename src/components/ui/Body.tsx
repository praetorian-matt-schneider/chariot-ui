import { forwardRef, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

import Footer from '@/components/ui/Footer';
import { Header } from '@/sections/AuthenticatedApp';
import { cn } from '@/utils/classname';
import { getRoute } from '@/utils/route.util';

export const Body = forwardRef(function Paper(props: { children?: ReactNode }) {
  const { pathname } = useLocation();

  const isOverview = pathname === getRoute(['app', 'overview']);
  const overviewContainerStyle = isOverview
    ? {
        background:
          'radial-gradient(circle at center, rgb(41, 34, 90) 0%, rgb(24, 22, 60) 70%, rgb(13, 13, 40) 100%)',
      }
    : {};

  return (
    <div
      className={cn(
        'flex size-full flex-col justify-between overflow-x-auto rounded-[2px]'
      )}
      id="body"
      style={{ overflowAnchor: 'none', ...overviewContainerStyle }}
    >
      <div className="flex flex-1 flex-col">
        <Header />
        <div
          className={cn(
            'mx-auto w-full max-w-screen-xl rounded-sm px-4 flex flex-1 flex-col'
          )}
          style={{ marginTop: -16 }}
        >
          {props.children}
        </div>
      </div>
      <Footer />
    </div>
  );
});
