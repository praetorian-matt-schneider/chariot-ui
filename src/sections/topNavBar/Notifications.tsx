import React, { useEffect } from 'react';

import { Dropdown } from '@/components/Dropdown';
import { useMy } from '@/hooks/useMy';
import { getStatusColor } from '@/sections/JobsTable';
import { JobStatus } from '@/types';
import { sToMs } from '@/utils/date.util';
import { getRoute } from '@/utils/route.util';
import { StorageKey, useStorage } from '@/utils/storage/useStorage.util';

interface Props {
  onNotify?: (showNotification: boolean) => void;
  onClick?: () => void;
}

export const Notifications: React.FC<Props> = ({ onNotify, onClick }) => {
  const { data: jobs = [], isPending } = useMy(
    {
      resource: 'job',
    },
    {
      refetchInterval: sToMs(10),
    }
  );

  const [prevRunningJobs, setPrevRunningJobs] = useStorage<undefined | number>(
    { key: StorageKey.RUNNING_JOBS },
    undefined
  );

  const runningJobs = jobs.filter(
    job => job.status === JobStatus.Running
  ).length;
  const queuedJobs = jobs.filter(job => job.status === JobStatus.Queued).length;
  const failedJobs = jobs.filter(job => job.status === JobStatus.Fail).length;
  const completedJobs = jobs.filter(
    job => job.status === JobStatus.Pass
  ).length;

  useEffect(() => {
    if (
      runningJobs !== prevRunningJobs &&
      !isPending &&
      prevRunningJobs !== undefined
    ) {
      setPrevRunningJobs(runningJobs);
      onNotify && onNotify(true);
    }
  }, [isPending, runningJobs, prevRunningJobs]);

  return (
    <Dropdown
      className="p-2"
      startIcon={
        <span className="relative inline-flex">
          <button
            type="button"
            className="inline-flex items-center  text-sm font-semibold leading-6 text-white transition duration-150 ease-in-out"
            onClick={onClick}
          >
            {isPending ? '' : runningJobs}
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
            label: (
              <div className="flex cursor-default items-center">
                Failed Jobs
                <span
                  className={`ml-2 inline-flex items-center rounded-full  px-2.5 py-0.5 text-xs font-medium  ${getStatusColor(JobStatus.Fail)}`}
                >
                  {failedJobs}
                </span>
              </div>
            ),
            className: 'flex items-center cursor-default',
            to: `/app/jobs?status=${JobStatus.Fail}`,
          },
          {
            className: 'flex items-center cursor-default',
            label: (
              <div className="flex cursor-default items-center">
                Completed Jobs
                <span
                  className={`ml-2 inline-flex items-center rounded-full  px-2.5 py-0.5 text-xs font-medium  ${getStatusColor(JobStatus.Pass)}`}
                >
                  {completedJobs}
                </span>
              </div>
            ),
            to: `/app/jobs?status=${JobStatus.Pass}`,
          },
          {
            className: 'flex items-center cursor-default',
            label: (
              <div className="flex cursor-default items-center">
                Queued Jobs
                <span
                  className={`ml-2 inline-flex items-center rounded-full  px-2.5 py-0.5 text-xs font-medium  ${getStatusColor(JobStatus.Queued)}`}
                >
                  {queuedJobs}
                </span>
              </div>
            ),
            to: `/app/jobs?status=${JobStatus.Queued}`,
          },
          {
            label: (
              <div className="flex cursor-default items-center">
                Running Jobs
                <span
                  className={`ml-2 inline-flex items-center rounded-full  px-2.5 py-0.5 text-xs font-medium  ${getStatusColor(JobStatus.Running)}`}
                >
                  {runningJobs}
                </span>
              </div>
            ),
            className: 'flex items-center cursor-default',
            to: `/app/jobs?status=${JobStatus.Running}`,
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
