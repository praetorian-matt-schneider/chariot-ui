import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLongRightIcon,
  ArrowPathIcon,
  PauseCircleIcon,
  PlayCircleIcon,
} from '@heroicons/react/24/outline';
import { useDebounce } from 'use-debounce';

import { HorseIcon } from '@/components/icons/Horse.icon';
import { Modal } from '@/components/Modal';
import { Table } from '@/components/table/Table';
import { Columns } from '@/components/table/types';
import { Tooltip } from '@/components/Tooltip';
import { useModifyAccount, useMy } from '@/hooks';
import { useCounts } from '@/hooks/useCounts';
import { useReRunJob } from '@/hooks/useJobs';
import { CategoryFilter, FancyTable } from '@/sections/Assets';
import { getJobStatusIcon } from '@/sections/overview/Overview';
import {
  FROZEN_ACCOUNT,
  Job,
  JobFilters,
  JobLabels,
  JOBS_CRON,
  JobStatus,
  JobStatusLabel,
} from '@/types';
import { cn } from '@/utils/classname';
import { getCronRelativeTime, mToMs } from '@/utils/date.util';
import { useQueryFilters } from '@/utils/storage/useQueryParams.util';

export const getStatusColor = (status: JobStatus) => {
  switch (status) {
    case JobStatus.Pass:
      return 'bg-emerald-100 text-emerald-800 inline';
    case JobStatus.Fail:
      return 'bg-red-100 text-red-800 inline';
    case JobStatus.Queued:
      return 'bg-gray-200 text-gray-800 inline';
    case JobStatus.Running:
    default:
      return 'bg-indigo-100 text-indigo-800 inline';
  }
};

export const getStatusText = (status: JobStatus) => {
  const classes = 'px-1 text-xs leading-5 font-medium rounded-full text-center';
  switch (status) {
    case JobStatus.Pass:
      return <span className={classes}>Completed</span>;
    case JobStatus.Fail:
      return <span className={classes}>Failed</span>;
    case JobStatus.Queued:
      return <span className={classes}>Queued</span>;
    case JobStatus.Running:
    default:
      return <span className={classes}>Running</span>;
  }
};

const getFailedComment = (job: Job) => {
  if (job.comment) {
    const jobCommentSplit = job.comment.split(':');
    return `${jobCommentSplit[0]}: ${jobCommentSplit[1]}`;
  }
  return '';
};

const Jobs: React.FC = () => {
  const [filters, setFilters] = useQueryFilters<JobFilters>({
    key: 'jobsFilters',
    defaultFilters: { status: '', sources: [], search: '', failedReason: [] },
  });
  const query = filters.search.startsWith('#') ? filters.search : undefined;
  const { data: stats = {} } = useCounts({
    resource: 'job',
    query,
  });
  const {
    data: jobs = [],
    refetch,
    error,
    status,
    isFetchingNextPage,
    fetchNextPage,
    isFetching,
    hasNextPage,
  } = useMy({
    resource: 'job',
    query,
  });

  const { data: accounts, status: accountStatus } = useMy({
    resource: 'account',
  });
  const { mutateAsync: reRunJob } = useReRunJob();
  const { mutate: resume, status: resumeStatus } = useModifyAccount('link');
  const { mutate: pause, status: pauseStatus } = useModifyAccount('unlink');

  const [nextRun, setNextRun] = useState<{ hours: number; minutes: number }>(
    getCronRelativeTime(JOBS_CRON)
  );
  const [isFilteredDataFetching, setIsFilteredDataFetching] = useState(false);
  const [showUpdateJobStatus, setShowUpdateJobStatus] = useState(false);

  // Update the next run time every 1 minute
  useEffect(() => {
    const interval = setInterval(() => {
      setNextRun(getCronRelativeTime(JOBS_CRON));
    }, mToMs(1));

    return () => clearInterval(interval);
  }, []);

  const isFrozen = Boolean(
    accounts.find(account => account.member === FROZEN_ACCOUNT)
  );

  const [debouncedSearch] = useDebounce(filters.search, 500);

  const failedJobStats = useMemo(() => {
    const failedJobs = jobs.filter(job => job.status === JobStatus.Fail);
    const failedJobStats = failedJobs.reduce(
      (acc, job) => {
        const comment = getFailedComment(job);
        if (comment) {
          if (acc[comment]) {
            acc[comment] = acc[comment] + 1;
            return acc;
          }
          return {
            ...acc,
            [comment]: 1,
          };
        }
        return acc;
      },
      {} as Record<string, number>
    );

    return failedJobStats;
  }, [JSON.stringify(jobs)]);

  const filteredJobs: Job[] = useMemo(() => {
    let filteredJobs = jobs;
    const { status, sources } = filters;

    if (status) {
      filteredJobs = filteredJobs.filter(job => job.status === status);
    }

    if (sources.filter(Boolean).length > 0) {
      filteredJobs = filteredJobs.filter(job => sources.includes(job.source));
    }

    if (debouncedSearch && debouncedSearch.length > 0) {
      filteredJobs = filteredJobs.filter(item => {
        const found = Object.values(item).find(value =>
          String(value).toLowerCase().includes(debouncedSearch.toLowerCase())
        );

        return found;
      });
    }

    if (filters.failedReason?.length > 0 && !query) {
      filteredJobs = filteredJobs.filter(job => {
        const comment = getFailedComment(job);
        return comment ? filters.failedReason.includes(comment) : false;
      });
    }

    return filteredJobs;
  }, [debouncedSearch, query, JSON.stringify({ jobs, filters })]);

  const jobStats = useMemo(() => {
    return Object.entries(stats).reduce(
      (acc, [key, value]) => {
        Object.values(JobStatus).forEach(jobKey => {
          if (key.endsWith(jobKey)) {
            acc[jobKey] = (acc[jobKey] || 0) + value;
          }
        });

        return acc;
      },
      {
        JF: 0,
        JP: 0,
        JQ: 0,
        JR: 0,
      } as Record<JobStatus, number>
    );
  }, [JSON.stringify(stats)]);

  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 15_000);
    return () => clearInterval(interval);
  }, []);

  const columns: Columns<Job> = [
    {
      label: '',
      id: 'status',
      cell: (job: Job) => {
        return (
          <Tooltip title={job.comment || ''}>
            <div
              className={cn(
                'flex items-center gap-2',
                job.comment && 'cursor-pointer'
              )}
            >
              {getJobStatusIcon(job.status, 'size-6')}
              {job.source} <span className="text-gray-500">(job)</span>
              <span>
                {job.name} <span className="text-gray-500">(source)</span>
              </span>
              <ArrowLongRightIcon className="size-4 text-default-light" />
              <span>
                {job.dns} <span className="text-gray-500">(target)</span>
              </span>
            </div>
          </Tooltip>
        );
      },
    },
    {
      label: '',
      id: 'updated',
      className: 'text-default-light',
      cell: 'date',
    },
    {
      label: 'Rerun',
      id: '',
      fixedWidth: 75,
      align: 'center',
      cell: (job: Job) => {
        const isRunning =
          job.status === JobStatus.Running || job.status === JobStatus.Queued;

        return (
          <ArrowPathIcon
            className={cn(
              'size-4 cursor-pointer',
              isRunning && 'text-gray-300 cursor-not-allowed'
            )}
            onClick={() => {
              if (!isRunning) {
                reRunJob({ capability: job.source, jobKey: job.key });
              }
            }}
          />
        );
      },
    },
  ];

  useEffect(() => {
    if (!isFetching) {
      if (hasNextPage && filteredJobs.length < 50) {
        setIsFilteredDataFetching(true);
        fetchNextPage();
      } else {
        setIsFilteredDataFetching(false);
      }
    }
  }, [JSON.stringify({ filteredJobs }), isFetching, hasNextPage]);

  const JobIcon = isFrozen ? PlayCircleIcon : PauseCircleIcon;
  const dataStatus = isFilteredDataFetching ? 'pending' : status;

  return (
    <div className="flex w-full flex-col">
      <Modal
        title={isFrozen ? 'Resume Jobs' : 'Pause Jobs'}
        open={showUpdateJobStatus}
        onClose={() => setShowUpdateJobStatus(false)}
        style="dialog"
        icon={<JobIcon className="size-5 text-brand" />}
        footer={{
          text: isFrozen ? 'Resume Jobs' : 'Pause Jobs',
          className: 'w-full text-nowrap',
          onClick: async () => {
            setShowUpdateJobStatus(false);
            if (isFrozen) {
              await pause({ username: 'frozen', config: {} });
            } else {
              await resume({ username: 'frozen', config: {} });
            }
            refetch();
          },
        }}
      >
        <p className="space-y-2 text-sm text-default-light">
          {`Are you sure want to ${isFrozen ? 'resume' : 'pause'} the automated jobs ?`}
        </p>
      </Modal>
      <FancyTable
        addNew={{
          isLoading: [resumeStatus, pauseStatus, accountStatus].includes(
            'pending'
          ),
          label: (
            <div className="flex justify-between gap-2">
              <JobIcon className="size-5 text-white" />
              <span className="ml-2">
                {isFrozen ? 'Resume Jobs' : 'Pause Jobs'}
              </span>
            </div>
          ),
          onClick: () => setShowUpdateJobStatus(true),
        }}
        search={{
          value: filters.search,
          onChange: search => {
            setFilters({
              search,
              sources: [],
              status: '',
              failedReason: [],
            });
          },
        }}
        tableHeader={
          <div className="m-2 flex w-full items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-lg font-bold">Search:</p>
                <p className="text-base font-semibold text-gray-500">
                  {filters.search ? filters.search : `All Jobs`}
                </p>
              </div>
              {filters.status?.length > 0 && (
                <div className="flex items-center gap-2">
                  <p className="text-lg font-bold">Status:</p>
                  <p className="text-base font-semibold text-gray-500">
                    {JobStatusLabel[filters.status as JobStatus]}
                  </p>
                </div>
              )}
              {filters.failedReason?.length > 0 && (
                <div className="flex items-center gap-2">
                  <p className="text-lg font-bold">Failed Reason:</p>
                  <p className="text-base font-semibold text-gray-500">
                    {filters.failedReason[0]}
                  </p>
                </div>
              )}
            </div>
            {nextRun && (
              <h1 className="text-lg font-bold">{`Next run in ${nextRun.hours} hours ${nextRun.minutes ? `and ${nextRun.minutes} minutes` : ''}`}</h1>
            )}
          </div>
        }
        otherFilters={
          <>
            <CategoryFilter
              hideHeader={true}
              value={filters.status ? [filters.status] : []}
              status={dataStatus}
              onChange={statuses => {
                setFilters({
                  status: statuses[0],
                  search: '',
                  sources: [],
                  failedReason: [],
                });
              }}
              category={[
                {
                  label: 'Status',
                  showCount: true,
                  options: Object.values(JobStatus)
                    .reverse()
                    .map(status => ({
                      label: JobLabels[status],
                      value: status,
                      count: (jobStats[status] || 0).toLocaleString(),
                    })),
                },
              ]}
            />
            {Object.keys(failedJobStats).length > 0 ? (
              <CategoryFilter
                hideHeader={true}
                value={filters.failedReason}
                status={dataStatus}
                onChange={failedReason => {
                  setFilters({
                    failedReason,
                    search: '',
                    sources: [],
                    status: '',
                  });
                }}
                category={[
                  {
                    label: 'Failed Reasons',
                    showCount: true,
                    options: Object.entries(failedJobStats).map(
                      ([reason, count]) => ({
                        label: reason,
                        value: reason,
                        count: count.toLocaleString(),
                      })
                    ),
                  },
                ]}
              />
            ) : null}
          </>
        }
        name="jobs"
      >
        <Table
          name="jobs"
          tableClassName="border-none"
          columns={columns}
          data={filteredJobs}
          error={error}
          status={dataStatus}
          fetchNextPage={fetchNextPage}
          isFetchingNextPage={isFetchingNextPage}
          noData={{
            icon: <HorseIcon />,
            title: 'No Jobs found',
            description:
              'There are no job found with this search, update the search',
          }}
        />
      </FancyTable>
    </div>
  );
};

export default Jobs;
