import { Dispatch, SetStateAction } from 'react';

import { Button } from '@/components/Button';
import { Loader } from '@/components/Loader';
import { Plan } from '@/types';
import { cn } from '@/utils/classname';

export const AssetUsage: React.FC<{
  assetCountStatus: 'pending' | 'success' | 'error';
  used: number;
  total: number;
  currentPlan: Plan;
  setIsUpgradePlanOpen: Dispatch<SetStateAction<boolean>>;
}> = ({ assetCountStatus, used, total, currentPlan, setIsUpgradePlanOpen }) => {
  const available = total - used;
  const isLoading = assetCountStatus === 'pending';
  const isFreemium = currentPlan === 'freemium';
  const isFreemiumMaxed =
    currentPlan === 'freemium' && !isLoading && available < 0;

  if (isFreemiumMaxed) {
    return (
      <div className="relative">
        <div
          className="flex min-w-[250px] flex-col items-center justify-center overflow-hidden rounded-sm bg-header-dark text-white shadow-md"
          onClick={() => {
            setIsUpgradePlanOpen(true);
          }}
          role={'button'}
        >
          <Loader isLoading={isLoading} className="h-14 bg-header-dark">
            {/* Progress bar */}
            <div className={cn('mr-auto h-2 rounded-r-sm bg-red-600 w-full')} />
            {/* Assets Monitored */}
            <div
              className={cn(
                'flex items-center gap-8 py-2',
                available > 0 ? 'px-12' : 'px-8'
              )}
            >
              <div className="flex flex-col items-center">
                <p
                  className={cn(
                    'text-xl font-semibold',
                    isFreemiumMaxed && 'text-red-600'
                  )}
                >
                  {used?.toLocaleString()}
                </p>
                <p className="text-xs font-bold text-gray-400">
                  Assets Monitored
                </p>
                {isFreemium && available > 0 && (
                  <p className="text-xs text-gray-400">
                    {available.toLocaleString()} of {total.toLocaleString()}{' '}
                    available
                  </p>
                )}
                {isFreemium && available <= 0 && (
                  <p className="text-xs text-red-600">
                    {`${(used - total).toLocaleString()} 
                assets above limit`}
                  </p>
                )}
              </div>
              {/* Upgrade Button */}
              <Button className="h-6 bg-red-600 text-layer0">
                Upgrade Plan
              </Button>
            </div>
          </Loader>
        </div>
      </div>
    );
  }

  return null;
};
