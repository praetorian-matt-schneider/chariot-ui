// eslint-disable-next-line no-restricted-imports
import { useQueries } from '@tanstack/react-query';
import { toast } from 'sonner';

import { useAxios } from '@/hooks/useAxios';
import { useMy } from '@/hooks/useMy';
import { getQueryKey } from '@/hooks/useQueryKeys';
import { Job, JobStatus } from '@/types';
import { mergeStatus, UseExtendQueryOptions, useMutation } from '@/utils/api';
import { formatDate } from '@/utils/date.util';

export function useReRunJob() {
  const axios = useAxios();

  const { invalidate: invalidateJobs } = useMy(
    { resource: 'job' },
    { enabled: false }
  );

  return useMutation({
    defaultErrorMessage: 'Failed to re run job',
    mutationFn: ({
      capability,
      jobKey,
    }: {
      capability: string;
      jobKey?: string;
    }) => {
      return axios.post(`/job/`, {
        name: capability,
        key: jobKey,
      });
    },
    onSuccess: () => {
      // Note: Need to be updated to show the correct message
      toast.success(`Processing Scan Request`);

      invalidateJobs();
    },
  });
}

export function useBulkReRunJob() {
  const axios = useAxios();

  const { invalidate: invalidateJobs } = useMy(
    { resource: 'job' },
    { enabled: false }
  );

  return useMutation({
    defaultErrorMessage: 'Failed to re run job',
    mutationFn: async (
      jobs: {
        capability: string;
        dns?: string;
        jobKey?: string;
        config?: { test: string };
      }[]
    ) => {
      const promises = jobs
        .map(async ({ capability, dns, jobKey, config }) => {
          const { data } = await axios.post(`/job/`, {
            name: capability,
            key: jobKey || `#asset#${dns}`,
            config,
          });

          return data;
        })
        .map(promise => promise.catch(error => error));

      const response = await Promise.all(promises);

      const validResults = response.filter(
        result => !(result instanceof Error)
      );

      if (validResults.length > 0) {
        toast.success(`Processing Scan Request`);

        invalidateJobs();
      }

      return response;
    },
  });
}

export type JobWithFailedCount = Job & { failedJobsCount: number };

export const useJobsStatus = (
  attributeJobMap: Record<string, string>,
  options?: UseExtendQueryOptions<JobWithFailedCount>
) => {
  const axios = useAxios();

  return useQueries({
    // defaultErrorMessage: 'Failed to fetch job status',
    queries: Object.values(attributeJobMap).map(jobKey => {
      return {
        ...options,
        queryKey: getQueryKey.getMy('job', jobKey),
        queryFn: async () => {
          const res = await axios.get(`/my`, {
            params: {
              key: jobKey,
            },
          });

          const allSuccessfulJobs = res.data.jobs.every(
            (job: Job) => job.status === JobStatus.Pass
          );
          const failedJobs = res.data.jobs.filter(
            (job: Job) => job.status === JobStatus.Fail
          );

          return allSuccessfulJobs
            ? res.data.jobs[0]
            : {
                ...res.data.jobs[0],
                failedJobsCount: failedJobs.length,
              };
        },
      };
    }),
    combine: results => {
      return {
        data: Object.keys(attributeJobMap).reduce(
          (acc, current, index) => ({
            ...acc,
            [current]: results[index].data,
          }),
          {}
        ) as Record<string, JobWithFailedCount>,
        status: mergeStatus(...results.map(result => result.status)),
      };
    },
  });
};

export const getJobTimeline = ({
  status,
  updated = '',
}: {
  status?: JobStatus;
  updated?: string;
}) => {
  const description = `Last Checked: ${formatDate(updated)}`;
  return [
    {
      title: 'Idle',
      status: '',
    },
    {
      title: 'Queued',
      status: JobStatus.Queued,
    },
    {
      title: 'Scanning',
      status: JobStatus.Running,
    },
    ...(status === JobStatus.Fail
      ? [
          {
            title: 'Failed',
            status: JobStatus.Fail,
            className: 'bg-error',
          },
        ]
      : [
          {
            title: 'Completed',
            status: JobStatus.Pass,
          },
        ]),
  ].map(current => ({
    ...current,
    description: current.status === status ? description : '',
  }));
};
