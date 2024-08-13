import { useState } from 'react';
import { CircleArrowUp } from 'lucide-react';

import { Loader } from '@/components/Loader';
import UpgradeMenu from '@/components/UpgradeMenu';
import { Plan } from '@/types';
import { cn } from '@/utils/classname';

export const AssetUsage: React.FC<{
  assetCountStatus: 'pending' | 'success' | 'error';
  used: number;
  total: number;
  currentPlan: Plan;
}> = ({ assetCountStatus, used, total, currentPlan }) => {
  const [isUpgradePlanOpen, setIsUpgradePlanOpen] = useState(false);

  const percentageUsed = Math.min((used / total) * 100, 100);

  return (
    <div className="relative">
      <div
        className=" flex w-[200px] flex-col items-center justify-center rounded-sm bg-header-dark px-4 pt-2 text-white shadow-md"
        onClick={() => {
          currentPlan !== 'managed' && setIsUpgradePlanOpen(v => !v);
        }}
        role={currentPlan !== 'managed' ? 'button' : undefined}
      >
        <div className="flex flex-col items-center">
          <Loader isLoading={assetCountStatus === 'pending'} className="h-5">
            <p className="text-xl font-semibold">{used?.toLocaleString()}</p>
          </Loader>
          <p className="text-xs font-medium text-gray-400">Assets Monitored</p>
        </div>

        {currentPlan === 'freemium' && (
          <div className="relative mt-2 w-full">
            <div className="h-5 w-full overflow-hidden rounded-full bg-gray-600">
              <div
                className={cn(
                  'h-full rounded-full rounded-r-none text-xs text-white flex items-center justify-center transition-all duration-500 ease-in-out',
                  percentageUsed < 70
                    ? 'bg-green-500'
                    : percentageUsed < 90
                      ? 'bg-yellow-500'
                      : 'bg-[#E24B4B]'
                )}
                style={{ width: `${percentageUsed}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="px-2 capitalize">
                  {`${used?.toLocaleString()} / ${total} available assets`}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="mt-2 flex w-full items-center justify-between">
          {currentPlan !== 'managed' && (
            <CircleArrowUp className="absolute right-0 top-3 mr-2 size-6" />
          )}
        </div>
      </div>
      {isUpgradePlanOpen && (
        <UpgradeMenu
          open={isUpgradePlanOpen}
          onClose={() => setIsUpgradePlanOpen(false)}
          currentPlan={currentPlan}
          used={used}
          total={total}
        />
      )}
    </div>
  );
};
