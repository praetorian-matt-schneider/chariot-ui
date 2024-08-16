import React from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

import { Dropdown, DropdownMenu } from '@/components/Dropdown';
import { useCounts } from '@/hooks/useCounts';

interface SourceDropdownProps {
  type: 'asset' | 'job' | 'risk';
  onChange: (selected: string[]) => void;
  value: string[];
  countFilters: string[][];
}

interface SourceData {
  [key: string]: number;
}

const SourceDropdown: React.FC<SourceDropdownProps> = ({
  type,
  onChange: handleSelect,
  value: sourcesFilter,
  countFilters,
}) => {
  const { data, status: countsStatus } = useCounts({
    resource: type,
    filters: countFilters,
  });

  const sourceData: SourceData = (data?.source as unknown as SourceData) || {};

  const name = 'Origins';

  function override(item: string) {
    switch (item?.toLowerCase()) {
      case 'azuread-discovery':
        return 'Azure AD Discovery';
      case 'github':
        return 'GitHub';
      case 'github-discovery':
        return 'GitHub Discovery';
      case 'ssh':
      case 'ns1':
      case 'cidr':
      case 'whois':
        return item.toUpperCase();
      default:
        if (item.includes('@')) return item;
        return <span>{item}</span>;
    }
  }

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
            labelSuffix: Object.values(sourceData)
              ?.reduce((a, b) => a + b, 0)
              ?.toLocaleString(),
            value: '',
          },
          {
            label: 'Divider',
            type: 'divider',
          },
          ...Object.keys(sourceData).map(item => ({
            label: override(item),
            labelSuffix: sourceData[item].toLocaleString(),
            value: item,
          })),
        ];

  return (
    <Dropdown
      styleType="header"
      label={
        sourcesFilter.length === 0 ? `All ${name}` : sourcesFilter.join(', ')
      }
      className="capitalize"
      endIcon={<ChevronDownIcon className="size-5 text-gray-500" />}
      menu={{
        items,
        onSelect: handleSelect,
        value: sourcesFilter.length === 0 ? [''] : sourcesFilter,
        multiSelect: true,
      }}
    />
  );
};

export default SourceDropdown;
