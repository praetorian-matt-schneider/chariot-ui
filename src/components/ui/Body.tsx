import { forwardRef, ReactNode } from 'react';

import Footer from '@/components/ui/Footer';
import { Header } from '@/sections/AuthenticatedApp';
import PushNotificationSetup from '@/sections/stepper/PushNotificationSetup';
import { Stepper } from '@/sections/stepper/Stepper';
import { cn } from '@/utils/classname';

export const Body = forwardRef(function Paper(props: { children?: ReactNode }) {
  return (
    // <div className="flex flex-col">
    <div
      className={cn(
        'flex size-full flex-col justify-between overflow-x-auto rounded-[2px]'
      )}
      id="body"
      style={{ overflowAnchor: 'none' }}
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
        <Stepper />
        <PushNotificationSetup />
      </div>

      <Footer />
    </div>

    // </div>
  );
});
