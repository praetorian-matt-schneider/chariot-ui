import { Dispatch, SetStateAction } from 'react';
import { useNavigate } from 'react-router-dom';
import { CircleArrowUp } from 'lucide-react';

import { Button } from '@/components/Button';
import { Loader } from '@/components/Loader';
import { Plan } from '@/types';
import { cn } from '@/utils/classname';
import { getRoute } from '@/utils/route.util';

export const AssetUsage: React.FC<{
  assetCountStatus: 'pending' | 'success' | 'error';
  used: number;
  total: number;
  currentPlan: Plan;
  setIsUpgradePlanOpen: Dispatch<SetStateAction<boolean>>;
}> = ({ assetCountStatus, used, total, currentPlan, setIsUpgradePlanOpen }) => {
  const navigate = useNavigate();
  const percentageUsed = Math.min((used / total) * 100, 100);
  const available = total - used;
  const isLoading = assetCountStatus === 'pending';
  const isFreemium = currentPlan === 'freemium';
  const isFreemiumMaxed =
    currentPlan === 'freemium' && !isLoading && available < 0;

  return (
    <div className="relative">
      <div
        className="flex min-w-[250px] flex-col items-center justify-center overflow-hidden rounded-sm bg-header-dark text-white shadow-md"
        onClick={() => {
          isFreemiumMaxed
            ? setIsUpgradePlanOpen(v => !v)
            : navigate(getRoute(['app', 'assets']));
        }}
        role={currentPlan !== 'managed' ? 'button' : undefined}
      >
        <Loader isLoading={isLoading} className="h-14 bg-header-dark">
          <>
            {/* Progress bar for used assets */}
            {currentPlan === 'freemium' && (
              <div
                className={cn(
                  'mr-auto h-2 rounded-r-sm',
                  available > 0 ? 'bg-green-500' : 'bg-red-600'
                )}
                style={{ width: `${percentageUsed}%` }}
              />
            )}

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
              {isFreemium && available <= 0 && (
                <Button className="h-6 bg-red-600 text-layer0">
                  Upgrade Plan
                </Button>
              )}
              {currentPlan !== 'managed' && (
                <CircleArrowUp
                  className="absolute right-0 top-3 mr-2 size-6"
                  onClick={e => {
                    e.stopPropagation();
                    setIsUpgradePlanOpen(true);
                  }}
                />
              )}
            </div>
          </>
        </Loader>
      </div>
    </div>
  );
};
