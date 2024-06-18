import React from 'react';
import { XMarkIcon } from '@heroicons/react/20/solid';
import {
  AreaChart,
  BarChart,
  DonutChart,
  Legend,
  LineChart,
} from '@tremor/react';

import { useMy } from '@/hooks';
import { Account, ChartType, MyResourceKey, Risk } from '@/types';
import {
  CountData,
  getAggregates as getAccountAggregates,
  runAggregate as runAccountAggregate,
} from '@/utils/aggregates/account';
import {
  getAggregates as getRiskAggregates,
  runAggregate as runRiskAggregate,
} from '@/utils/aggregates/risk';

interface ChartProps {
  type: ChartType;
  data: CountData[];
  xField: string;
  yField: string;
}

const Chart: React.FC<ChartProps> = ({ type, data, xField, yField }) => {
  console.log('data', data, 'xField', xField, 'yField', yField);
  switch (type) {
    case 'area':
      return (
        <AreaChart
          className="h-96 w-full"
          data={data}
          index={xField}
          categories={[yField]}
        />
      );
    case 'bar':
      return (
        <BarChart
          className="h-96 w-full"
          data={data}
          index={xField}
          categories={[yField]}
          colors={['blue']}
        />
      );
    case 'line':
      return (
        <LineChart
          className="h-96 w-full"
          data={data}
          index={xField}
          categories={[yField]}
          colors={['indigo', 'rose']}
        />
      );
    case 'donut':
      return (
        <div className="flex items-center justify-center space-x-6 text-default">
          <DonutChart
            className="h-96 w-full"
            variant="donut"
            data={data}
            index={xField}
            category={yField}
          />
          <Legend categories={data.map(d => d[xField].toString())} />
        </div>
      );
    default:
      return null;
  }
};

interface ChartWrapperProps {
  id: number;
  type: ChartType;
  width: string;
  endpoint: MyResourceKey;
  aggregate: string;
  removeChart: (chartId: number) => void;
}

const ChartWrapper: React.FC<ChartWrapperProps> = ({
  id,
  type,
  width,
  endpoint,
  aggregate,
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
        default:
          return {};
      }
    };
    const runAggregate = (aggregate: string, data: Account[] | Risk[]) => {
      switch (endpoint) {
        case 'account':
          return runAccountAggregate(aggregate, data as Account[]);
        case 'risk':
          return runRiskAggregate(aggregate, data as Risk[]);
        default:
          return [];
      }
    };
    const aggregateFunction = getAggregates()[aggregate];
    const chartData = runAggregate(aggregate, data as Account[]);

    return (
      <div
        className={`relative rounded border border-gray-300 p-2 shadow ${width}`}
      >
        <Chart
          type={type}
          data={chartData}
          xField={aggregateFunction.xField}
          yField={aggregateFunction.yField}
        />
        <button
          onClick={() => removeChart(id)}
          className="absolute -right-5 -top-5 m-2 size-7 rounded-full border border-gray-300 bg-white text-gray-500"
        >
          <XMarkIcon />
        </button>
      </div>
    );
  } else {
    return <div>Loading...</div>; // Handle loading state
  }
};

export default ChartWrapper;
