import React from 'react';
import { Link } from 'react-router-dom';

import { useGetAccountAlerts } from '@/hooks/useGetAccountAlerts';
import { cn } from '@/utils/classname';
import { sToMs } from '@/utils/date.util';
import { getRoute } from '@/utils/route.util';

const MyInbox: React.FC<{ className?: string }> = ({ className }) => {
  const { data: alertsWithAttribute = [], status } = useGetAccountAlerts({
    refetchInterval: sToMs(30),
  });
  const alerts = alertsWithAttribute.filter(
    ({ value }) => !value.startsWith('#attribute')
  );

  return (
    <Link to={getRoute(['app', 'risks'])} className={cn('relative', className)}>
      Risks
      {status !== 'pending' && alerts.length > 0 && (
        <span
          role="label"
          className={cn(
            'text-white bg-red-500 rounded-full absolute flex justify-center items-center text-xs text-center font-semibold transition duration-150 ease-in-out size-4 -top-2 -right-2'
          )}
        >
          {'!'}
        </span>
      )}
    </Link>
  );
};

export default MyInbox;
