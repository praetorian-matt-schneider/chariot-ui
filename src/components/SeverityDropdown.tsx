import React from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

import { Dropdown } from '@/components/Dropdown';
import { RiskSeverity, SeverityDef } from '@/types';

interface SeverityDropdownProps {
  value: RiskSeverity[];
  onChange: (selected: RiskSeverity[]) => void;
}

const SeverityDropdown: React.FC<SeverityDropdownProps> = ({
  onChange: onSelect,
  value: severityFilter,
}) => {
  const name = 'Severities';

  const handleSelect = (selectedRows: RiskSeverity[]) => {
    onSelect(selectedRows);
  };

  return (
    <Dropdown
      styleType="header"
      label={
        severityFilter.length === 0
          ? `All ${name}`
          : severityFilter.map(severity => SeverityDef[severity]).join(', ')
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
          ...Object.keys(SeverityDef)
            .map(severity => ({
              label: SeverityDef[severity as keyof typeof SeverityDef],
              value: severity,
            }))
            .reverse(),
        ],
        onSelect: value => handleSelect(value as RiskSeverity[]),
        value: severityFilter.length === 0 ? [''] : severityFilter,
        multiSelect: true,
      }}
    />
  );
};

export default SeverityDropdown;
