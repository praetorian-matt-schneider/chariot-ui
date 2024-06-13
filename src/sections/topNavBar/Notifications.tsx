import React, { useEffect, useState } from 'react';

import { Dropdown } from '@/components/Dropdown';
import { useMy } from '@/hooks/useMy';
import { JobStatus } from '@/types';
import { sToMs } from '@/utils/date.util';
import { getRoute } from '@/utils/route.util';

interface Props {
  onNotify?: (showNotification: boolean) => void;
}

export const Notifications: React.FC<Props> = ({ onNotify }) => {
  const { data: jobs = [] } = useMy(
    {
      resource: 'job',
    },
    {
      refetchInterval: sToMs(10),
    }
  );

  const [prevRunningJobs, setPrevRunningJobs] = useState<number>(0);

  const runningJobs = jobs.filter(
    job => job.status === JobStatus.Running
  ).length;
  const queuedJobs = jobs.filter(job => job.status === JobStatus.Queued).length;
  const failedJobs = jobs.filter(job => job.status === JobStatus.Fail).length;
  const completedJobs = jobs.filter(
    job => job.status === JobStatus.Pass
  ).length;

  useEffect(() => {
    if (runningJobs !== prevRunningJobs) {
      setPrevRunningJobs(runningJobs);
      onNotify && onNotify(true);
    }
  }, [runningJobs, prevRunningJobs]);

  return (
    <Dropdown
      className="p-2"
      startIcon={
        <span className="relative inline-flex">
          <button
            type="button"
            className="inline-flex items-center  text-sm font-semibold leading-6 text-white transition duration-150 ease-in-out"
          >
            {runningJobs}
          </button>
        </span>
      }
      styleType="none"
      menu={{
        width: 300,
        items: [
          {
            label: `Recent Activity (Last 24 hours)`,
            className: 'cursor-default',
            type: 'label',
          },
          {
            label: `Running Jobs: ${runningJobs}`,
            className: 'flex items-center cursor-default',
          },
          {
            label: `Queued Jobs: ${queuedJobs}`,
            className: 'flex items-center cursor-default',
          },
          {
            label: `Failed Jobs: ${failedJobs}`,
            className: 'flex items-center cursor-default',
          },
          {
            label: `Completed Jobs: ${completedJobs}`,
            className: 'flex items-center cursor-default',
          },
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

export default Notifications;
