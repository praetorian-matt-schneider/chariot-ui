import { Dispatch, SetStateAction } from 'react';
import { CircleArrowUp } from 'lucide-react';

import { Button } from '@/components/Button';
import { Loader } from '@/components/Loader';
import { Plan } from '@/types';

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

  return (
    <div className="relative">
      <div
        className="flex h-12 flex-col items-center justify-center rounded-sm bg-header-dark text-white shadow-md"
        onClick={() => {
          currentPlan !== 'managed' && setIsUpgradePlanOpen(v => !v);
        }}
        role={currentPlan !== 'managed' ? 'button' : undefined}
      >
        <Loader isLoading={isLoading} className="h-14 bg-header-dark">
          <>
            <div className={'flex items-center space-x-2 px-6 py-2'}>
              <p className="text-sm capitalize text-gray-400">
                Current Plan:{' '}
                <span className="capitalize text-white">{currentPlan}</span>
              </p>
              {isFreemium && available <= 0 && (
                <Button className="h-6 bg-red-600 text-layer0">
                  Upgrade Plan
                </Button>
              )}
              {isFreemium && available > 0 && (
                <CircleArrowUp className="size-6" />
              )}
            </div>
          </>
        </Loader>
      </div>
    </div>
  );
};
