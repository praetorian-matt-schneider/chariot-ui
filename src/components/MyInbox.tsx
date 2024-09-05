import React from 'react';

import { Dropdown } from '@/components/Dropdown';
import { useGetAccountAlerts } from '@/hooks/useGetAccountAlerts';
import { cn } from '@/utils/classname';
import { sToMs } from '@/utils/date.util';
import { getRoute } from '@/utils/route.util';
import { generatePathWithSearch } from '@/utils/url.util';

const MyInbox: React.FC<{ className?: string }> = ({ className }) => {
  const { data: alertsWithAttribute = [], status } = useGetAccountAlerts({
    refetchInterval: sToMs(30),
  });
  const alerts = alertsWithAttribute.filter(
    ({ value }) => !value.startsWith('#attribute')
  );

  const getMenuItems = () => {
    if (alerts === null || alerts.length === 0) {
      return [
        {
          label: 'No risks found',
          className: 'flex items-center text-gray-500 italic',
          to: getRoute(['app', 'risks']),
        },
      ];
    } else {
      return [
        // {
        //   label: 'All Risks',
        //   labelSuffix: totalAlerts.toLocaleString(),
        //   className: 'flex items-center',
        //   to: getRoute(['app', 'risks']),
        // },
        // {
        //   label: 'Divider',
        //   type: 'divider' as const,
        // },
        ...alerts.map(alert => ({
          label: alert.name,
          className: 'flex items-center',
          to: generatePathWithSearch({
            pathname: getRoute(['app', 'risks']),
            appendSearch: [
              [
                'riskFilters',
                JSON.stringify({
                  search: '',
                  query: alert.value,
                }),
              ],
            ],
          }),
        })),
      ];
    }
  };

  return (
    <Dropdown
      className={cn('h-7 relative')}
      startIcon={
        <span className="inline-flex items-center space-x-2">
          {status !== 'pending' && alerts.length === 0 && (
            <span
              role="label"
              className={cn(
                'text-white bg-red-500 rounded-full absolute flex justify-center items-center text-xs text-center font-semibold transition duration-150 ease-in-out w-5 h-5 -top-2 -right-1'
              )}
            >
              {'!'}
            </span>
          )}
        </span>
      }
      styleType="none"
      menu={{
        items: getMenuItems(),
      }}
    >
      <span
        className={cn(
          `mt-1 border-b-2 pb-1 text-sm font-medium capitalize transition-colors hover:text-gray-100`,
          className
        )}
      >
        Risks
      </span>
    </Dropdown>
  );
};

export default MyInbox;
