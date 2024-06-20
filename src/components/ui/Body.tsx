import { forwardRef, useState } from 'react';

import { HorseIcon } from '@/components/icons/Horse.icon';
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
    account => account.member === 'research@praetorian.com'
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
              className="relative z-10 flex items-center justify-center space-x-2 rounded-full border border-indigo-500 bg-indigo-600 px-4 py-2 text-white shadow-lg transition-transform hover:bg-indigo-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
              onClick={() => setIsOpen(true)}
            >
              <span className="font-xl px-2 py-1 text-xl font-semibold">
                Upgrade Now
              </span>
              <HorseIcon skipHover={true} fill="white" />
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
        <p>
          <b>We&apos;re excited to have you using Chariot! 🎉</b>
        </p>
        <p>
          Right now, you&apos;re on the <b>free plan</b>.
        </p>
        <p>This plan is self-service and lets you manage one seed.</p>

        <p>We also offer other plans:</p>
        <ol className="list-inside list-decimal">
          <li>
            <b>Self-service</b> plan with unlimited seeds.
          </li>
          <li>
            <b>Managed-service</b> plan with unlimited seeds. Our expert team
            will triage your risks and notify you about critical, exploitable
            risks.
          </li>
        </ol>

        <p>
          Give our managed-service plan a try for free! Upgrade now to have our
          team triage your risks for 7 days.
        </p>
      </div>
    </Modal>
  );
};
