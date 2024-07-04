import { Chip, ChipProps } from '@/components/Chip';
import { getAssetStatusIcon } from '@/components/icons/AssetStatus.icon';
import { AssetStatus } from '@/types';
import { cn } from '@/utils/classname';

const getStatusProperties = (status: AssetStatus) => {
  const styles: Record<AssetStatus, ChipProps['style']> = {
    [AssetStatus.Frozen]: 'error',
    [AssetStatus.Unknown]: 'secondary',
    [AssetStatus.Active]: 'primary',
    [AssetStatus.ActiveHigh]: 'primary',
    [AssetStatus.ActiveLow]: 'primary',
  };

  const texts: Record<AssetStatus, string> = {
    [AssetStatus.Frozen]: 'Frozen',
    [AssetStatus.Unknown]: 'Frozen',
    [AssetStatus.Active]: 'Active',
    [AssetStatus.ActiveHigh]: 'Active',
    [AssetStatus.ActiveLow]: 'Active',
  };

  const details: Record<AssetStatus, string | undefined> = {
    [AssetStatus.Frozen]: undefined,
    [AssetStatus.Unknown]: 'Unknown Asset',
    [AssetStatus.Active]: 'Standard Priority',
    [AssetStatus.ActiveHigh]: 'High Priority',
    [AssetStatus.ActiveLow]: 'Low Priority',
  };

  return {
    style: styles[status],
    text: texts[status],
    detail: details[status],
  };
};

export const AssetStatusChip: React.FC<{
  className?: string;
  status: AssetStatus;
}> = ({ className, status }) => {
  const { style, text } = getStatusProperties(status);

  return (
    <Chip className={className} style={style}>
      {text}
    </Chip>
  );
};

export const AssetStatusText: React.FC<{
  className?: string;
  status: AssetStatus;
  showIcon?: boolean;
}> = ({ className, status, showIcon }) => {
  const { text, detail } = getStatusProperties(status);

  return (
    <div className={cn('flex items-center flex-row space-x-1', className)}>
      {text}{' '}
      {detail && (
        <div className="flex space-x-1 items-center p-2 bg-gray-50 text-gray-500 font-medium text-xs rounded-sm ml-3">
          {showIcon && getAssetStatusIcon(status)}
          <p>{detail}</p>
        </div>
      )}
    </div>
  );
};
