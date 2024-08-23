import React from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

import { Dropdown, DropdownMenu } from '@/components/Dropdown';

interface SourceDropdownProps {
  type: 'asset' | 'job' | 'risk';
  onChange: (selected: string[]) => void;
  value: string[];
}

const SourceDropdown: React.FC<SourceDropdownProps> = ({
  onChange: handleSelect,
  value: sourcesFilter,
}) => {
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

  const items: DropdownMenu['items'] = [
    {
      label: `All ${name}`,
      value: '',
    },
    {
      label: 'Divider',
      type: 'divider',
    },
    ...['discovered', 'provided'].map(item => ({
      label: override(item),
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
