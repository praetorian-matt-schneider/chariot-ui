import { forwardRef, useState } from 'react';

import { Modal } from '@/components/Modal';
import { useMy } from '@/hooks';
import { useUpgrade } from '@/hooks/useUpgrade';
import { Header } from '@/sections/AuthenticatedApp';
import { cn } from '@/utils/classname';

import Footer from './Footer';

export const Body = forwardRef(function Paper(
  props: React.DetailedHTMLProps<
    React.HTMLAttributes<HTMLDivElement>,
    HTMLDivElement
  > & { footer?: boolean; header?: boolean },
  ref?: React.Ref<HTMLDivElement>
) {
  const { footer = true, header = true, ...rest } = props;
  const [isOpen, setIsOpen] = useState(false);

  const { data: accounts, status: accountsStatus } = useMy({
    resource: 'account',
  });

  const isTrial = accounts.find(
    account => account.member === 'chariot+trial@praetorian.com'
  );

  return (
    <div
      {...rest}
      ref={ref}
      className={
        'flex size-full flex-col justify-between overflow-x-auto rounded-[2px]'
      }
      id="body"
      style={{ overflowAnchor: 'none' }}
    >
      <div>
        {header && <Header />}
        <div
          className={cn(
            'mx-auto w-full max-w-screen-xl rounded-sm',
            props.className
          )}
          style={{ marginTop: header ? -16 : 0 }}
        >
          {props.children}
        </div>
      </div>
      {footer && <Footer />}
      {accountsStatus === 'success' && !isTrial && (
        <div className="absolute bottom-16 right-8">
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 size-full animate-ping rounded-full bg-indigo-500 opacity-25 blur-md"></div>
            <button
              className="relative z-10 flex items-center space-x-2 rounded-full border border-indigo-500 bg-indigo-600 px-4 py-2 text-white shadow-lg transition-transform hover:scale-105 hover:bg-indigo-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
              onClick={() => setIsOpen(true)}
            >
              <span className="p-3 font-semibold">Upgrade Now</span>
            </button>
          </div>
        </div>
      )}
      <UpgradeModal isOpen={isOpen} setIsOpen={setIsOpen} />
    </div>
  );
});

interface UpgradeModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const UpgradeModal = ({ isOpen, setIsOpen }: UpgradeModalProps) => {
  const { mutate: upgrade } = useUpgrade();

  return (
    <Modal
      title={'Free Upgrade'}
      open={isOpen}
      onClose={() => setIsOpen(false)}
      footer={{
        className: 'w-32',
        text: 'Free Upgrade',
        onClick: () => {
          upgrade();
          setIsOpen(false);
        },
      }}
    >
      <div className="flex flex-col justify-center gap-4 p-2">
        <b>
          We are thrilled that you are using Chariot. 🎉 You are on the free
          plan. It is self-service and limited to one seed.
        </b>

        <p>We have more plans:</p>
        <ol>
          <li>A self-service plan with unlimited seeds.</li>
          <li>
            A managed-service plan where the experts in our Managed Service team
            triage your risks and inform you of exploitable critical risks. This
            includes unlimited seeds.
          </li>
        </ol>

        <p>
          We invite you to try out the managed-service plan for free. Click Free
          Upgrade to add more seeds and have our team triage your risks for 7
          days.
        </p>
      </div>
    </Modal>
  );
};
