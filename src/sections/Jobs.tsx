import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { useDebounce } from 'use-debounce';

import { Dropdown } from '@/components/Dropdown';
import SourceDropdown from '@/components/SourceDropdown';
import { Table } from '@/components/table/Table';
import { Columns } from '@/components/table/types';
import { Tooltip } from '@/components/Tooltip';
import { useMy } from '@/hooks';
import { useCounts } from '@/hooks/useCounts';
import { useReRunJob } from '@/hooks/useJobs';
import { Job, JobFilters, JobLabels, JobStatus } from '@/types';
import { cn } from '@/utils/classname';
import { useStorage } from '@/utils/storage/useStorage.util';

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
  });
  const { mutateAsync: reRunJob } = useReRunJob();

  const [isFilteredDataFetching, setIsFilteredDataFetching] = useState(false);

  const [filters, setFilters] = useStorage<JobFilters>(
    { queryKey: 'jobsFilters' },
    { status: '', sources: [], search: '' }
  );
  const [debouncedSearch] = useDebounce(filters.search, 500);

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

    return filteredJobs;
  }, [filters, debouncedSearch, JSON.stringify(jobs)]);

  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 15_000);
    return () => clearInterval(interval);
  }, []);

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
        filters={
          <div className="flex gap-4">
            <Dropdown
              styleType="header"
              label={
                filters.status
                  ? `${JobLabels[filters.status]} Jobs`
                  : 'All Jobs'
              }
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
                  setFilters(prev => ({ ...prev, status: value || '' }));
                },
                value: filters.status,
              }}
            />
            <SourceDropdown
              type="job"
              value={filters.sources}
              onChange={sources => {
                setFilters(prev => ({ ...prev, sources }));
              }}
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
          value: filters.search,
          onChange: search => {
            setFilters(prev => ({ ...prev, search }));
          },
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
