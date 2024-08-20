import React from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

import { Dropdown, DropdownMenu } from '@/components/Dropdown';
import { countDescription } from '@/components/Menu';
import { useCounts } from '@/hooks/useCounts';
import { AssetStatus, AssetStatusLabel } from '@/types';

interface AssetStatusDropdownProps {
  onChange: (selected: AssetStatus[]) => void;
  value: AssetStatus[];
}

const AssetStatusDropdown: React.FC<AssetStatusDropdownProps> = ({
  onChange: onSelect,
  value: statusFilter,
}) => {
  const { data, status: countsStatus } = useCounts({ resource: 'asset' });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, unused-imports/no-unused-vars
  const { FL, FH, ...restStatus } = data?.status || {};
  const statusData: { [key: string]: number } = {
    ...restStatus,
    [AssetStatus.Frozen]: Object.entries(data?.status || {}).reduce(
      (acc, [key, value]) => {
        if (key.startsWith('F')) {
          return acc + value;
        }

        return acc;
      },
      0
    ),
  };
  const name = 'Statuses';

  const handleSelect = (selectedRows: AssetStatus[]) => {
    if (
      selectedRows.length === 0 ||
      selectedRows.length === Object.keys(AssetStatusLabel).length
    ) {
      onSelect([]);
    } else {
      onSelect(selectedRows);
    }
  };

  const allSelected =
    statusFilter.length === 0 ||
    statusFilter.length === Object.keys(AssetStatusLabel).length;

  const items: DropdownMenu['items'] =
    countsStatus === 'pending'
      ? Array(1)
          .fill(0)
          .map(() => {
            return {
              label: 'Loading...',
              className: 'w-60 h-4',
              value: '',
              isLoading: true,
            };
          })
      : [
          {
            label: `All ${name}`,
            labelSuffix: Object.values(statusData)
              .reduce((a, b) => a + b, 0)
              .toLocaleString(),
            value: '',
          },
          {
            label: 'Divider',
            type: 'divider',
          },
          ...Object.keys(AssetStatusLabel)
            .filter(status => status !== AssetStatus.Deleted)
            .map(status => ({
              label: AssetStatusLabel[status as AssetStatus],
              labelSuffix: (
                statusData[status as AssetStatus] || 0
              ).toLocaleString(),
              value: status,
            })),
          countDescription,
        ];

  return (
    <Dropdown
      styleType="header"
      label={
        allSelected
          ? `All ${name}`
          : statusFilter.map(status => AssetStatusLabel[status]).join(', ')
      }
      className="capitalize"
      endIcon={<ChevronDownIcon className="size-5 text-gray-500" />}
      menu={{
        items,
        onSelect: value => {
          const selectedValues = value.filter(v => v !== '');
          handleSelect(selectedValues as AssetStatus[]);
        },
        value: statusFilter,
        multiSelect: true,
      }}
    />
  );
};

export default AssetStatusDropdown;
