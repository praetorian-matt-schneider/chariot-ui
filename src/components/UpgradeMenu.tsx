import React, { useEffect, useRef } from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

import { Button } from '@/components/Button';
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
  const ref = useRef<HTMLDivElement>(null);
  const { mutate: upgrade, status: upgradeStatus } = useModifyAccount('link');
  const { mutate: startFreeTrial } = useUpgrade();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        if ((event.target as HTMLElement).id !== 'upgrade-plan') {
          onClose();
        }
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className={`absolute right-0 top-12 z-50 rounded-md border border-gray-500 bg-header p-4 shadow-2xl transition-all duration-200 ease-out ${
        open
          ? 'pointer-events-auto translate-y-0 opacity-100'
          : 'pointer-events-none -translate-y-5 opacity-0'
      }`}
    >
      <div className="mb-4 flex items-center justify-between space-x-2">
        <div className="">
          <p className="flex space-x-1 text-sm">
            <span className="font-normal text-gray-400">Current Plan:</span>
            <span className="font-medium capitalize text-white">
              {currentPlan}
            </span>
          </p>
          {currentPlan === 'freemium' && (
            <p className="text-xs text-gray-400">
              Used {used?.toLocaleString()} of {total?.toLocaleString()}{' '}
              available assets
            </p>
          )}
        </div>
        {used >= total && currentPlan === 'freemium' && (
          <ExclamationTriangleIcon className="size-8 text-yellow-500" />
        )}
      </div>
      <div className="flex space-x-4">
        {/* Unmanaged Plan */}
        {currentPlan === 'freemium' && (
          <div className="relative w-48 rounded-md bg-header-dark p-4 text-white shadow-md">
            <h3 className="text-lg font-semibold">Unmanaged</h3>
            <p className="text-sm text-gray-400">Unlimited assets</p>
            <Button
              className="mt-4 w-full bg-brand text-white"
              onClick={() => upgrade({ username: 'license', config: {} })}
              disabled={upgradeStatus === 'pending'}
            >
              Upgrade
            </Button>
          </div>
        )}

        {/* Managed Plan */}
        <div className="relative w-48 rounded-md bg-header-dark p-4 text-white shadow-md">
          <h3 className="text-lg font-semibold">Managed</h3>
          <p className="text-sm text-gray-400">Go hands-free.</p>
          <Button
            className="mt-4 w-full bg-brand text-white"
            onClick={() => {
              onClose();
              startFreeTrial();
            }}
          >
            Free Trial
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UpgradeMenu;
