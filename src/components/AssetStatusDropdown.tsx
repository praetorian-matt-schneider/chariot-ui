import React from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

import { Dropdown, DropdownMenu } from '@/components/Dropdown';
import { AssetStatus, AssetStatusLabel } from '@/types';

interface AssetStatusDropdownProps {
  onChange: (selected: AssetStatus[]) => void;
  value: AssetStatus[];
}

const AssetStatusDropdown: React.FC<AssetStatusDropdownProps> = ({
  onChange: onSelect,
  value: statusFilter,
}) => {
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

  const items: DropdownMenu['items'] = [
    {
      label: `All ${name}`,

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
        value: status,
      })),
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
