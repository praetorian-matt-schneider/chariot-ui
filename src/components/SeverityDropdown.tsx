import React from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

import { Dropdown } from '@/components/Dropdown';
import { useCounts } from '@/hooks/useCounts';
import { RiskSeverity, SeverityDef } from '@/types';

interface SeverityDropdownProps {
  value: RiskSeverity[];
  onChange: (selected: RiskSeverity[]) => void;
}

const SeverityDropdown: React.FC<SeverityDropdownProps> = ({
  onChange: onSelect,
  value: severityFilter,
}) => {
  const { data } = useCounts({ resource: 'risk' });
  const statusData: { [key: string]: number } = data?.status || {};
  const name = 'Severities';

  const handleSelect = (selectedRows: RiskSeverity[]) => {
    onSelect(selectedRows);
  };

  // Compute the counts for each severity
  const getSeverityCounts = (): { [key in RiskSeverity]: number } => {
    const counts: { [key in RiskSeverity]: number } = {
      I: 0,
      L: 0,
      M: 0,
      H: 0,
      C: 0,
    };

    Object.keys(statusData).forEach(key => {
      const severity = key[1] as RiskSeverity;
      counts[severity] += statusData[key];
    });

    return counts;
  };

  const severityCounts = getSeverityCounts();

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
            labelSuffix: Object.values(severityCounts)
              .reduce((a, b) => a + b, 0)
              .toLocaleString(),
            value: '',
          },
          {
            label: 'Divider',
            type: 'divider',
          },
          ...Object.keys(SeverityDef)
            .map(severity => ({
              label: SeverityDef[severity as keyof typeof SeverityDef],
              labelSuffix: (
                severityCounts[severity as RiskSeverity] || 0
              ).toLocaleString(),
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
