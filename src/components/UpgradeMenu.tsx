import React from 'react';
import {
  ExclamationTriangleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { Layers } from 'lucide-react';

import { Button } from '@/components/Button';
import { ManagedPlanIcon } from '@/components/icons/ManagedPlan.icon';
import { ModalWrapper } from '@/components/Modal';
import { useModifyAccount } from '@/hooks';
import { useUpgrade } from '@/hooks/useUpgrade';
import { Plan } from '@/types';

interface Props {
  open: boolean;
  currentPlan: Plan;
  used: number;
  total: number;
  onClose: () => void;
}

const UpgradeMenu: React.FC<Props> = ({
  open,
  currentPlan,
  used,
  total,
  onClose,
}) => {
  const { mutate: upgrade, status: upgradeStatus } = useModifyAccount('link');
  const { mutate: startFreeTrial } = useUpgrade();

  return (
    <ModalWrapper
      className="overflow-hidden rounded-md border-[#323452]"
      open={open}
      onClose={onClose}
    >
      {/* Title */}
      <div className="text-md flex items-center gap-4 bg-[#323452] py-4 pl-8 pr-4 text-layer0">
        {used >= total && currentPlan === 'freemium' && (
          <ExclamationTriangleIcon className="size-10 text-yellow-500" />
        )}
        <div className="flex-1 text-sm font-light">
          <div>
            Current Plan:{' '}
            <span className="font-semibold capitalize">{currentPlan}</span>
          </div>
          {currentPlan === 'freemium' && (
            <p>{`Used ${used} of ${total} available assets`}</p>
          )}
        </div>
        <Button aria-label="CloseIcon" onClick={onClose} styleType="none">
          <XMarkIcon className="size-6" />
        </Button>
      </div>
      {/* Content */}
      <div className="flex flex-col gap-8 bg-header p-8 text-layer0">
        {currentPlan === 'freemium' && (
          <>
            {/* Unmanaged Plan */}
            <UpgradePlanRow
              icon={<Layers className="size-8" />}
              title="Unmanaged"
              description="Unlimited Access"
              button={
                <Button
                  styleType="primary"
                  className="h-8"
                  onClick={() => upgrade({ username: 'license', config: {} })}
                  disabled={upgradeStatus === 'pending'}
                >
                  Upgrade
                </Button>
              }
            />
            <hr className="border-gray-700" />
          </>
        )}
        {/* Managed Plan */}
        <UpgradePlanRow
          title="Managed"
          description="MSP Support Included"
          icon={<ManagedPlanIcon className="size-8 text-brand" />}
          button={
            <Button
              styleType="primary"
              className="h-8"
              onClick={() => {
                onClose();
                startFreeTrial();
              }}
            >
              Free Trial
            </Button>
          }
        />
      </div>
    </ModalWrapper>
  );
};

const UpgradePlanRow = ({
  title,
  description,
  button,
  icon,
}: {
  title: string;
  description: string;
  button: React.ReactElement;
  icon: React.ReactElement;
}) => {
  return (
    <div className="flex items-center gap-4">
      <div className="rounded bg-[#5F47B740] p-2 text-brand">{icon}</div>
      <div className="flex-1 text-sm">
        <h3 className="font-semibold">{title}</h3>
        <p className="text-gray-400">{description}</p>
      </div>
      {button}
    </div>
  );
};

export default UpgradeMenu;
