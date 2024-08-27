import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import {
  ArrowPathIcon,
  ChevronDownIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
  PauseCircleIcon,
  PlayCircleIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { useDebounce } from 'use-debounce';

import { Button } from '@/components/Button';
import { Dropdown } from '@/components/Dropdown';
import { Modal } from '@/components/Modal';
import SourceDropdown from '@/components/SourceDropdown';
import { Table } from '@/components/table/Table';
import { Columns } from '@/components/table/types';
import { Tooltip } from '@/components/Tooltip';
import { useMy } from '@/hooks';
import { useCounts } from '@/hooks/useCounts';
import { useFilter } from '@/hooks/useFilter';
import { useReRunJob } from '@/hooks/useJobs';
import {
  HeaderPortalSections,
  RenderHeaderExtraContentSection,
} from '@/sections/AuthenticatedApp';
import { Job, JobLabels, JobStatus } from '@/types';
import { cn } from '@/utils/classname';

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return format(date, "MMM d, yyyy '@' h:mm a");
};

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

const Jobs: React.FC = () => {
  const location = useLocation();

  const { data: stats = {} } = useCounts({
    resource: 'job',
    filterByGlobalSearch: true,
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
    filterByGlobalSearch: true,
  });
  const { mutateAsync: reRunJob } = useReRunJob();
  const [jobRunning, setJobRunning] = useState(false);
  const JobIcon = jobRunning ? PauseCircleIcon : PlayCircleIcon;
  const [showJobsConfirmModal, setShowJobsConfirmModal] = useState(false);

  const failedReasons = useMemo(() => {
    const failed = jobs.filter(job => job.status === JobStatus.Fail);
    console.log({ failed });
    const reasons = failed.reduce(
      (acc, current) => {
        if (current.comment) {
          const splitComment = current.comment.split(':');
          const comment = `${splitComment[0]}: ${splitComment[1]}`;
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
    return reasons;
  }, [jobs]);

  const failedReasonHeight = useMemo(
    () => document.getElementById('failed-reasons')?.clientHeight ?? 0,
    [failedReasons]
  );
  const failedReasonTop =
    document.getElementById(HeaderPortalSections.EXTRA_CONTENT)?.offsetHeight ??
    0;

  console.log({
    failedReasonHeight,
    headerTop: failedReasonHeight + failedReasonTop,
  });

  console.log({
    failedReasons,
  });

  const [search, setSearch] = useState('');
  const [isFilteredDataFetching, setIsFilteredDataFetching] = useState(false);
  const [filter, setFilter] = useFilter('', 'job-status');
  const [sources, setSources] = useFilter<string[]>([], 'job-sources');
  const [searchParams, setSearchParams] = useSearchParams();

  const [debouncedSearch] = useDebounce(search, 500);

  const filteredJobs: Job[] = useMemo(() => {
    let filteredJobs = jobs;

    if (filter?.length > 0) {
      filteredJobs = filteredJobs.filter(job => job.status === filter);
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

    return filteredJobs;
  }, [filter, sources, debouncedSearch, JSON.stringify(jobs)]);

  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 15_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const newFilter = searchParams.get('status') || '';
    setFilter(newFilter);
  }, [location.search]);

  const designedDate = (date: string) => {
    const parts = date.split('@');
    return (
      <p className="inline">
        <span>{parts[0]}</span>
        <span>@</span>
        <span>{parts[1]}</span>
      </p>
    );
  };

  const columns: Columns<Job> = [
    {
      label: 'Status',
      id: 'status',
      cell: (job: Job) => {
        return (
          <Tooltip title={job.comment}>
            <div
              className={`flex w-[100px] justify-center rounded-l-[2px] px-4 py-1.5 ${getStatusColor(job.status)}`}
            >
              {getStatusText(job.status)}
            </div>
          </Tooltip>
        );
      },
      fixedWidth: 120,
    },
    {
      label: 'Job',
      id: 'source',
      fixedWidth: 160,
    },
    {
      label: 'Source IP',
      id: 'name',
      cell: (job: Job) => {
        if (job.status === 'JQ') {
          return <span className="italic text-gray-500">Not started</span>;
        } else return job.name;
      },
    },
    {
      label: 'DNS',
      id: 'dns',
    },
    {
      label: 'Updated',
      id: 'updated',
      fixedWidth: 220,
      cell: (job: Job) => {
        return designedDate(formatDate(job.updated));
      },
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

  return (
    <div className="flex w-full flex-col">
      <RenderHeaderExtraContentSection>
        <div className={'relative mb-4 flex justify-between gap-4  text-white'}>
          <div className="flex items-center gap-2 rounded-sm bg-header-dark px-8 py-3">
            <Tooltip
              placement="left"
              title={jobRunning ? 'Pause Jobs' : 'Run Jobs'}
            >
              <JobIcon
                className="size-6 cursor-pointer text-white"
                onClick={() => setShowJobsConfirmModal(true)}
              />
            </Tooltip>
            <div className="text-xl">6 hours</div>
          </div>
          <div className="flex flex-1 justify-between bg-header-dark px-6 py-3">
            {/* Todo Reuse PageCounts from Asset table here */}
          </div>
          <div className="flex items-center gap-2 bg-header-dark px-8 py-3">
            <LockClosedIcon className="size-6 text-white" />
            <div className="">
              <div className="text-xl">Self Hosted</div>
              <Button
                className="p-0 text-xs text-white underline"
                styleType="text"
              >
                Unlock
              </Button>
            </div>
          </div>
        </div>
        <Modal
          icon={<ExclamationTriangleIcon className="size-7 text-yellow-600" />}
          title={jobRunning ? 'Pause Jobs' : 'Run Jobs'}
          onClose={() => setShowJobsConfirmModal(false)}
          className="px-8"
          open={showJobsConfirmModal}
          footer={{
            text: 'Confirm',
            disabled: status === 'pending',
            onClick: () => {
              setJobRunning(!jobRunning);
              setShowJobsConfirmModal(false);
            },
          }}
        >
          Are you sure you want to {jobRunning ? 'pause' : 'run'} jobs now ?
        </Modal>
      </RenderHeaderExtraContentSection>
      <Table
        tablePrefix={
          failedReasons && Object.keys(failedReasons).length > 0 ? (
            <div
              id="failed-reasons"
              className="sticky z-10"
              style={{ top: failedReasonTop }}
            >
              <div className="relative flex w-full gap-4 rounded-sm border-2 border-dashed border-default bg-layer0 px-6 py-4">
                <ExclamationTriangleIcon className="size-8 shrink-0 text-red-500" />
                <div>
                  <h2 className="text-lg font-semibold">Failed Reasons</h2>
                  <div className="mt-4 space-y-2">
                    {Object.entries(failedReasons).map(([reason, count]) => (
                      <div key={reason} className="flex items-center gap-2">
                        <span className="flex min-h-8 min-w-8 items-center justify-center rounded-full bg-red-500 px-2 py-1 text-sm text-white">
                          {count}
                        </span>
                        <span className="text-default-light">{reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="h-4 w-full bg-layer1" />
            </div>
          ) : undefined
        }
        tableTop={failedReasonHeight + failedReasonTop}
        resize={true}
        filters={
          <div className="flex gap-4">
            <Dropdown
              styleType="header"
              label={filter ? `${JobLabels[filter]} Jobs` : 'All Jobs'}
              endIcon={
                <ChevronDownIcon className="size-3 stroke-[4px] text-header-dark" />
              }
              menu={{
                items: [
                  {
                    label: 'All Jobs',
                    labelSuffix: jobs.length?.toLocaleString(),
                    value: '',
                  },
                  {
                    label: 'Divider',
                    type: 'divider',
                  },
                  ...Object.entries(JobLabels).map(([key, label]) => {
                    return {
                      label,
                      labelSuffix: stats.status?.[key]?.toLocaleString() || 0,
                      value: key,
                    };
                  }),
                ],
                onClick: value => {
                  if (value === '' || !value) {
                    searchParams.delete('status');
                  } else {
                    searchParams.set('status', value ?? '');
                  }
                  setSearchParams(searchParams);
                  setFilter(value || '');
                },
                value: filter,
              }}
            />
            <SourceDropdown
              type="job"
              value={sources}
              onChange={selectedRows => setSources(selectedRows)}
            />
          </div>
        }
        columns={columns}
        data={filteredJobs}
        error={error}
        status={isFilteredDataFetching ? 'pending' : status}
        name="jobs"
        isFetchingNextPage={isFetchingNextPage}
        fetchNextPage={fetchNextPage}
        search={{
          value: search,
          onChange: setSearch,
        }}
        noData={{
          title: 'No Jobs Found',
          description: (
            <p>
              There are no current jobs running. Click on Scan now button under
              Risk drawer to trigger new jobs
            </p>
          ),
        }}
      />
    </div>
  );
};

export default Jobs;
