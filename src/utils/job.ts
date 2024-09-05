import { Job, JobStatus } from '@/types';

export const getJobStatus = (job: Job): JobStatus => {
  return (job?.status || '').split('#')[0] as JobStatus;
};
