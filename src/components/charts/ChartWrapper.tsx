import React from 'react';
import { XMarkIcon } from '@heroicons/react/20/solid';

import Chart from '@/components/charts/Chart';
import { useMy } from '@/hooks';
import { Account, Asset, ChartType, MyResourceKey, Risk, Seed } from '@/types';
import {
  getAggregates as getAccountAggregates,
  runAggregate as runAccountAggregate,
} from '@/utils/aggregates/account';
import {
  getAggregates as getAssetAggregates,
  runAggregate as runAssetAggregate,
} from '@/utils/aggregates/asset';
import {
  getAggregates as getRiskAggregates,
  runAggregate as runRiskAggregate,
} from '@/utils/aggregates/risk';
import {
  getAggregates as getSeedAggregates,
  runAggregate as runSeedAggregate,
} from '@/utils/aggregates/seed';

interface ChartWrapperProps {
  id: string;
  type: ChartType;
  endpoint: MyResourceKey;
  aggregate: string;
  label: string;
  removeChart: (chartId: string) => void;
}

const ChartWrapper: React.FC<ChartWrapperProps> = ({
  id,
  type,
  endpoint,
  aggregate,
  label,
  removeChart,
}) => {
  const { data, isLoading } = useMy({
    resource: endpoint,
    query: '',
  });

  if (!isLoading && data) {
    const getAggregates = () => {
      switch (endpoint) {
        case 'account':
          return getAccountAggregates();
        case 'risk':
          return getRiskAggregates();
        case 'seed':
          return getSeedAggregates();
        case 'asset':
          return getAssetAggregates();
        default:
          return {};
      }
    };
    const runAggregate = (
      aggregate: string,
      data: Account[] | Risk[] | Seed[] | Asset[]
    ) => {
      switch (endpoint) {
        case 'account':
          return runAccountAggregate(aggregate, data as Account[]);
        case 'risk':
          return runRiskAggregate(aggregate, data as Risk[]);
        case 'seed':
          return runSeedAggregate(aggregate, data as Seed[]);
        case 'asset':
          return runAssetAggregate(aggregate, data as Asset[]);
        default:
          return [];
      }
    };
    const aggregateFunction = getAggregates()[aggregate];
    const chartData = runAggregate(aggregate, data as Account[]);

    return (
      <div className="relative flex size-full flex-col gap-4 border border-gray-200 bg-white p-6">
        <div className="flex items-center">
          <h3 className="dark:text-dark-tremor-content-strong flex-1 text-lg font-medium text-tremor-content-strong">
            {label}
          </h3>
          <button
            onMouseDown={e => e.stopPropagation()}
            onClick={() => removeChart(id)}
            className="absolute right-[-6px] top-[-6px] size-6 rounded-full border border-gray-200 bg-layer0 text-gray-500"
          >
            <XMarkIcon className="p-0.5" />
          </button>
        </div>
        <Chart
          type={type}
          data={chartData}
          xField={aggregateFunction.xField}
          yField={aggregateFunction.yField}
        />
      </div>
    );
  } else {
    return <></>;
  }
};

export default ChartWrapper;
