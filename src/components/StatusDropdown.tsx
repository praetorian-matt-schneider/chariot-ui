import React from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

import { Dropdown } from '@/components/Dropdown';
import { RiskStatus, RiskStatusLabel } from '@/types';

interface StatusDropdownProps {
  value: RiskStatus[];
  onChange: (selected: RiskStatus[]) => void;
}

const StatusDropdown: React.FC<StatusDropdownProps> = ({
  onChange: onSelect,
  value: statusFilter,
}) => {
  const name = 'Statuses';

  const handleSelect = (selectedRows: RiskStatus[]) => {
    onSelect(selectedRows);
  };

  return (
    <Dropdown
      styleType="header"
      label={
        statusFilter.length === 0
          ? `All ${name}`
          : statusFilter.map(status => RiskStatusLabel[status]).join(', ')
      }
      className="capitalize"
      endIcon={<ChevronDownIcon className="size-5 text-gray-500" />}
      menu={{
        items: [
          {
            label: `All ${name}`,
            value: '',
          },
          {
            label: 'Divider',
            type: 'divider',
          },
          ...Object.keys(RiskStatusLabel)
            .filter(label => label !== 'R')
            .map(status => ({
              label: RiskStatusLabel[status as RiskStatus],
              value: status,
            })),
        ],
        onSelect: value => handleSelect(value as RiskStatus[]),
        value: statusFilter.length === 0 ? [''] : statusFilter,
        multiSelect: true,
      }}
    />
  );
};

export default StatusDropdown;
