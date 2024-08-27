import React, { ReactNode, useMemo } from 'react';
import { isToday, parseISO } from 'date-fns';

import { AssetsIcon, RisksIcon } from '@/components/icons';
import { HorseIcon } from '@/components/icons/Horse.icon';
import { Loader } from '@/components/Loader';
import { useMy } from '@/hooks';
import { useGetCollaborators } from '@/hooks/collaborators';
import { useCounts } from '@/hooks/useCounts';
import { RenderHeaderExtraContentSection } from '@/sections/AuthenticatedApp';
import { availableAttackSurfaceIntegrationsKeys } from '@/sections/overview/Integrations';
import { QueryStatus } from '@/utils/api';
import { cn } from '@/utils/classname';
import { abbreviateNumber } from '@/utils/misc.util';

export function PageCounts() {
  const { data: riskCounts = {}, status: riskCountsStatus } = useCounts({
    resource: 'risk',
    query: '',
  });
  const { data: assetCounts = {}, status: assetCountsStaus } = useCounts({
    resource: 'asset',
    query: '',
  });
  const { data: jobs, status: jobsStatus } = useMy({ resource: 'job' });
  const { data: accounts, status: accountsStatus } = useMy({
    resource: 'account',
  });
  const { data: collaborators, status: collaboratorsStatus } =
    useGetCollaborators();

  const todaysJob = useMemo(() => {
    return jobs.filter(job => {
      return isToday(parseISO(job.updated));
    }).length;
  }, [JSON.stringify(jobs)]);
  const attackSurfaceCount = useMemo(() => {
    return accounts.filter(account => {
      return (
        account.value !== 'setup' &&
        account.value !== 'waitlisted' &&
        availableAttackSurfaceIntegrationsKeys.includes(account.member)
      );
    }).length;
  }, [JSON.stringify(accounts)]);
  const parsedRisksCounts = useMemo(() => {
    return Object.entries(riskCounts).reduce(
      (acc, [status, count]) => {
        console.log('status', status);

        if (status[0] === 'O') {
          acc.o += count;
        }

        if (status[1] === 'C') {
          acc.c += count;
        }

        if (status[0] === 'T') {
          acc.t += count;
        }

        if (status[0] === 'C' || status[0] === 'M') {
          acc.r += count;
        }

        return acc;
      },
      {
        o: 0,
        c: 0,
        r: 0,
        t: 0,
      }
    );
  }, [JSON.stringify(riskCounts)]);

  const counts = [
    {
      resources: [
        {
          count: attackSurfaceCount,
          label: 'Attack surfaces',
          status: accountsStatus,
        },
        {
          count: Object.values(assetCounts.status || []).reduce(
            (acc, value) => acc + value,
            0
          ),
          label: 'Assets monitored',
          status: assetCountsStaus,
        },
      ],
      icon: <AssetsIcon />,
      className: 'grow',
    },
    {
      resources: [
        {
          count: parsedRisksCounts.t,
          label: 'Pending triage',
          status: riskCountsStatus,
        },
        {
          count: parsedRisksCounts.c,
          label: 'Critical risks',
          status: riskCountsStatus,
        },
        {
          count: parsedRisksCounts.o,
          label: 'Open risks',
          status: riskCountsStatus,
        },
        {
          count: parsedRisksCounts.r,
          label: 'Remediated',
          status: riskCountsStatus,
        },
      ],
      icon: <RisksIcon />,
      className: 'grow',
    },
    {
      resources: [
        { count: todaysJob, label: 'Jobs today', status: jobsStatus },
        {
          count: collaborators.length,
          label: 'Users',
          status: collaboratorsStatus,
        },
      ],
      icon: <HorseIcon skipHover />,
      className: 'grow-2',
    },
  ];

  return (
    <RenderHeaderExtraContentSection>
      <div className="flex flex-wrap justify-between gap-4">
        {counts.map((count, index) => {
          return <PageCountsSection key={index} {...count} />;
        })}
      </div>
    </RenderHeaderExtraContentSection>
  );
}

interface PageCountSectionProps {
  resources: { label: string; count: number; status: QueryStatus }[];
  icon: ReactNode;
  className?: string;
}

const PageCountsSection = (props: PageCountSectionProps) => {
  return (
    <div
      className={cn(
        'relative flex justify-around gap-4 rounded-sm bg-header-dark px-6 py-3 text-white',
        props.className
      )}
    >
      <div className="absolute right-0 top-0 [&>svg]:size-5">{props.icon}</div>
      {props.resources.map((resource, index) => {
        return (
          <div key={index} className="flex flex-col items-center">
            <div className="text-nowrap text-sm font-semibold">
              {resource.label}
            </div>
            <Loader
              className="my-2 h-5 w-1/2"
              isLoading={resource.status === 'pending'}
            >
              <div className="text-3xl font-bold">
                {abbreviateNumber(resource.count)}
              </div>
            </Loader>
          </div>
        );
      })}
    </div>
  );
};
