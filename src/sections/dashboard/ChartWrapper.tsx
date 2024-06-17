import React from 'react';
import { XMarkIcon } from '@heroicons/react/20/solid';
import { AreaChart, BarChart, DonutChart, LineChart } from '@tremor/react';
import { useMy } from '@/hooks';
import { Account, ChartType, MyResourceKey, Risk } from '@/types';
import {
  runAggregate as runAccountAggregate,
  getAggregates as getAccountAggregates,
  CountData as AccountCountData,
  CountData,
} from '@/utils/aggregates/account';
import {
  runAggregate as runRiskAggregate,
  getAggregates as getRiskAggregates,
  CountData as RiskCountData,
} from '@/utils/aggregates/risk';

interface ChartProps {
  type: ChartType;
  data: CountData[];
  xField: string;
  yField: string;
}

const Chart: React.FC<ChartProps> = ({ type, data, xField, yField }) => {
  switch (type) {
    case 'area':
      return (
        <AreaChart
          className="h-96 w-full"
          data={data}
          index={xField}
          categories={[yField]}
          // Other props as needed
        />
      );
    case 'bar':
      return (
        <BarChart
          className="h-96 w-full"
          data={data}
          index={xField}
          categories={[yField]}
          // Other props as needed
        />
      );
    case 'line':
      return (
        <LineChart
          className="h-96 w-full"
          data={data}
          index={xField}
          categories={[yField]}
          // Other props as needed
        />
      );
    case 'donut':
      return (
        <DonutChart
          className="h-96 w-full"
          data={data}
          index={xField}

          // Other props as needed
        />
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
