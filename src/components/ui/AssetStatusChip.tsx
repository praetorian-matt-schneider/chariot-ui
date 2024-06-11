import { cn } from '@/utils/classname';

import { AssetStatus } from '../../types';
import { Chip, ChipProps } from '../Chip';

export const AssetStatusChip: React.FC<{
  className?: string;
  status: AssetStatus;
}> = ({ className, status }) => {
  const chipStyle: Record<AssetStatus, ChipProps['style']> = {
    [AssetStatus.Frozen]: 'error',
    [AssetStatus.Unknown]: 'secondary',
    [AssetStatus.Active]: 'primary',
    [AssetStatus.ActiveHigh]: 'primary',
  };

  const chipText = {
    [AssetStatus.Frozen]: 'Frozen',
    [AssetStatus.Unknown]: 'Unknown',
    [AssetStatus.Active]: 'Active',
    [AssetStatus.ActiveHigh]: 'Active',
  };

  return (
    <div className="flex items-center gap-2">
      <Chip
        className={cn(status !== AssetStatus.ActiveHigh && 'ml-4', className)}
        style={chipStyle[status]}
      >
        {chipText[status]}
      </Chip>
    </div>
  );
};
