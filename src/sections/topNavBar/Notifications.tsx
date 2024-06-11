import { BellIcon } from '@heroicons/react/24/solid';

import { Dropdown } from '@/components/Dropdown';
import { useMy } from '@/hooks/useMy';
import { formatDate, sortByDate, sToMs } from '@/utils/date.util';
import { getRoute } from '@/utils/route.util';

import { Job } from '../../types';

export const Notifications: React.FC = () => {
  const { data: jobs = [] } = useMy(
    {
      resource: 'job',
    },
    {
      refetchInterval: sToMs(10),
    }
  );
  const sortedAndLimitedJobs = sortByDate(jobs)?.slice(0, 5) || [];

  return (
    <Dropdown
      className="p-2"
      startIcon={<BellIcon className="size-5 text-header-dark" />}
      styleType="none"
      menu={{
        width: 300,
        items: [
          ...(sortedAndLimitedJobs ?? []).map(job => ({
            className: 'flex items-center hover:bg-layer0 cursor-default',
            label: getDns(job) ?? '',
            description: formatDate(job.updated) ?? '',
            helpText: job.source,
          })),
          {
            label: 'View All',
            styleType: 'primary',
            className: 'm-0 w-full justify-center rounded-none align-center',
            to: getRoute(['app', 'jobs']),
          },
        ],
      }}
    />
  );
};

const getDns = (job: Job) => {
  if (job.asset && job.asset.dns.length > 0) {
    return job.asset.dns;
  } else {
    const key = job.key.split('#');
    return key[3];
  }
};
