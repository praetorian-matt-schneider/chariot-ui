import { useCounts } from '@/hooks/useCounts';
import { JobStatus } from '@/types';
import { useMemo } from 'react';

export const useAggregateCounts = (): {
  isPending: boolean;
  counts: {
    seeds: number;
    assets: number;
    risks: number;
    jobs: number;
    jobsRunning: number;
  };
} => {
  const { data: seedStats = {}, status: seedStatus } = useCounts({
    resource: 'seed',
    filterByGlobalSearch: true,
  });

  const { data: assetStats = {}, status: assetStatus } = useCounts({
    resource: 'asset',
    filterByGlobalSearch: true,
  });

  const { data: riskStats = {}, status: riskStatus } = useCounts({
    resource: 'risk',
    filterByGlobalSearch: true,
  });

  const { data: jobStats = {}, status: jobStatus } = useCounts({
    resource: 'job',
    filterByGlobalSearch: true,
  });

  const isPending = [seedStatus, assetStatus, riskStatus, jobStatus].some(
    status => status === 'pending'
  );

  const getTotal = (stats: Record<string, number>) =>
    Object.values(stats).reduce((acc, val) => acc + val, 0);

  // Only count open risks
  const openRiskStats = useMemo(() => {
    const allStats = { ...riskStats };
    for (const key in allStats) {
      if (!key.startsWith('O')) {
        delete allStats[key];
      }
    }
    return allStats;
  }, [riskStats]);

  const counts = {
    seeds: getTotal(seedStats),
    assets: getTotal(assetStats),
    risks: getTotal(openRiskStats),
    jobs: getTotal(jobStats),
    jobsRunning: jobStats[JobStatus.Running] || 0,
  };

  return {
    isPending,
    counts,
  };
};
