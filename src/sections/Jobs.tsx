import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { useDebounce } from 'use-debounce';

import { Dropdown } from '@/components/Dropdown';
import { Table } from '@/components/table/Table';
import { Columns } from '@/components/table/types';
import { Tooltip } from '@/components/Tooltip';
import { useMy } from '@/hooks';
import { useCounts } from '@/hooks/useCounts';
import { useFilter } from '@/hooks/useFilter';
import { useReRunJob } from '@/hooks/useJobs';
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
  });
  const { mutateAsync: reRunJob } = useReRunJob();

  const [search, setSearch] = useState('');
  const [isFilteredDataFetching, setIsFilteredDataFetching] = useState(false);
  const [filter, setFilter] = useFilter('', 'job-status');
  const [sources] = useFilter<string[]>([], 'job-sources');
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
      <Table
        resize={true}
        bodyHeader={
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
                    labelSuffix: Object.values(jobStats).reduce(
                      (acc, stat) => acc + stat,
                      0
                    ),
                    value: '',
                  },
                  {
                    label: 'Divider',
                    type: 'divider',
                  },
                  ...Object.values(JobStatus).map(key => {
                    return {
                      label: JobLabels[key],
                      labelSuffix: jobStats[key]?.toLocaleString() || 0,
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
          </div>
        }
        columns={columns}
        data={filteredJobs.slice(0, 5)}
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
