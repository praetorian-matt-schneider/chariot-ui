import { forwardRef, useState } from 'react';

import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { Notification } from '@/components/Notification';
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
        <Button
          className="absolute bottom-16 right-8 size-16 rounded border border-layer1 bg-layer0 p-2 shadow-sm "
          onClick={() => setIsOpen(true)}
        >
          <Notification />
          <CrownIcon />
        </Button>
      )}
      <UpgradeModal isOpen={isOpen} setIsOpen={setIsOpen} />
    </div>
  );
});

const CrownIcon = () => (
  <svg
    version="1.1"
    id="Layer_1"
    x="0px"
    y="0px"
    viewBox="0 0 122.88 107.76"
    xmlSpace="preserve"
  >
    <g>
      <path
        className="st0 "
        fill="#eab308"
        d="M21.13,83.86h80.25l12.54-34.73c0.65,0.21,1.35,0.32,2.07,0.32c3.8,0,6.89-3.08,6.89-6.89 c0-3.8-3.08-6.89-6.89-6.89c-3.8,0-6.89,3.08-6.89,6.89c0,1.5,0.48,2.88,1.29,4.01l-7.12,5.86c-9.97,8.2-16.22,4.4-14.27-8.34 l1.1-7.17c0.38,0.07,0.78,0.1,1.18,0.1c3.8,0,6.89-3.08,6.89-6.89c0-3.8-3.08-6.89-6.89-6.89c-3.8,0-6.89,3.08-6.89,6.89 c0,2.17,1.01,4.11,2.58,5.37l-1.71,2.7c-8.38,12.58-14.56,7.76-17.03-4.67l-4.41-20.31c2.47-1.05,4.21-3.49,4.21-6.35 c0-3.8-3.08-6.89-6.89-6.89c-3.8,0-6.89,3.08-6.89,6.89c0,3.18,2.15,5.85,5.07,6.65L56.46,25.1c-2.48,10.61-5.45,31.75-18.88,13.73 l-2.19-2.98c1.73-1.25,2.86-3.29,2.86-5.59c0-3.8-3.08-6.89-6.89-6.89c-3.8,0-6.89,3.08-6.89,6.89c0,3.8,3.08,6.89,6.89,6.89 c0.53,0,1.05-0.06,1.55-0.18l0.46,4.68c0.9,6.39,2.05,15.04-5.29,14.63c-3.64-0.2-5.01-1.44-7.79-3.42l-7.94-5.63 c0.89-1.16,1.42-2.61,1.42-4.19c0-3.8-3.08-6.89-6.89-6.89c-3.8,0-6.89,3.08-6.89,6.89s3.08,6.89,6.89,6.89 c0.9,0,1.75-0.17,2.54-0.48L21.13,83.86L21.13,83.86z M21.07,93.47h80.51v14.29H21.07V93.47L21.07,93.47z"
      />
    </g>
  </svg>
);

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
