import React, { useEffect } from 'react';
import { Inbox } from 'lucide-react';

import { Dropdown } from '@/components/Dropdown';
import { useGetAccountAlerts } from '@/hooks/useGetAccountAlerts';
import { cn } from '@/utils/classname';
import { getRoute } from '@/utils/route.util';
import { StorageKey, useStorage } from '@/utils/storage/useStorage.util';

const MyInbox: React.FC = () => {
  const { data: alerts = [], isPending } = useGetAccountAlerts();

  const [prevAlertCount, setPrevAlertCount] = useStorage<undefined | number>(
    { key: StorageKey.ALERT_COUNT },
    undefined
  );

  const totalAlerts = alerts.reduce((acc, alert) => acc + alert.count, 0);

  useEffect(() => {
    if (totalAlerts !== prevAlertCount) {
      setPrevAlertCount(totalAlerts);
    }
  }, [isPending, totalAlerts, prevAlertCount]);

  return (
    <Dropdown
      className="h-7 border-r border-dashed border-gray-700 p-2"
      startIcon={
        <span className="relative inline-flex items-center space-x-2">
          <Inbox className="mr-2 size-6 stroke-1 text-white" />
          <button
            type="button"
            className={cn(
              'inline-flex items-center text-sm font-semibold leading-6 transition duration-150 ease-in-out',
              totalAlerts === 0 ? 'text-gray-500' : 'text-white'
            )}
          >
            {isPending ? '' : totalAlerts}
          </button>
        </span>
      }
      styleType="none"
      menu={{
        width: 450,
        items: [
          {
            label: 'All Alerts',
            labelSuffix: totalAlerts.toLocaleString(),
            className: 'flex items-center',
            to: getRoute(['app', 'alerts']),
          },
          {
            label: 'Divider',
            type: 'divider',
          },
          ...alerts.map(alert => ({
            label: alert.label,
            labelSuffix: alert.count.toLocaleString(),
            className: 'flex items-center',
            to: `/app/alerts?query=${alert.query}`,
          })),
        ],
      }}
    />
  );
};

export default MyInbox;
