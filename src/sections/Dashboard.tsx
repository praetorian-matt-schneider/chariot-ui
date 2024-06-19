import React, { useEffect, useState } from 'react';
import GridLayout from 'react-grid-layout';
import { PlusIcon } from '@heroicons/react/20/solid';
import {
  ArrowTrendingUpIcon,
  Bars3CenterLeftIcon,
} from '@heroicons/react/24/outline';
import { ChartBarIcon, ChartPieIcon } from '@heroicons/react/24/solid';

import { Button } from '@/components/Button';
import { Input, Type } from '@/components/form/Input';
import { Popover } from '@/components/Popover';
import ChartWrapper from '@/sections/dashboard/ChartWrapper';
import { ChartType, MyResourceKey } from '@/types';
import { getAggregates as getAccountAggregates } from '@/utils/aggregates/account';
import { getAggregates as getRiskAggregates } from '@/utils/aggregates/risk';

interface ChartConfig {
  [i: string]: {
    type: ChartType;
    endpoint: MyResourceKey;
    aggregate: string;
  };
}

const Dashboard: React.FC = () => {
  const [charts, setCharts] = useState<ChartConfig>({});
  const [layout, setLayout] = useState<GridLayout.Layout[]>([]);
  const [newChartType, setNewChartType] = useState<ChartType>('area');
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [newEndpoint, setNewEndpoint] = useState<MyResourceKey>();
  const [aggregates, setAggregates] = useState<
    { value: string; label: string }[]
  >([]);
  const [aggregate, setAggregate] = useState<string>();

  useEffect(() => {
    if (newEndpoint) {
      switch (newEndpoint.toLowerCase()) {
        case 'account':
          setAggregates(
            Object.keys(getAccountAggregates()).map(i => ({
              value: i,
              label: getAccountAggregates()[i].label,
            }))
          );
          break;
        case 'risk':
          setAggregates(
            Object.keys(getRiskAggregates()).map(i => ({
              value: i,
              label: getRiskAggregates()[i].label,
            }))
          );
          break;
        default:
          setAggregates([]);
      }
    } else {
      setAggregates([]);
    }
  }, [newEndpoint]);

  const addChart = () => {
    if (newEndpoint && aggregate) {
      const i = Date.now().toString();
      setCharts(charts => ({
        ...charts,
        [i]: {
          type: newChartType,
          endpoint: newEndpoint,
          aggregate,
        },
      }));
      setLayout(layout => [
        ...layout,
        {
          i,
          x: 0,
          y: 0,
          w: 4,
          h: 4,
          minH: 2,
          minW: 2,
        },
      ]);
      setIsFormVisible(false);
    }
  };

  const removeChart = (chartId: string) => {
    setCharts(charts => {
      delete charts[Number(chartId)];
      return charts;
    });
    setLayout(layout => layout.filter(({ i }) => i !== chartId));
  };

  return (
    <div className="w-full px-4 py-2">
      <div className="relative inline-block">
        <Popover
          open={isFormVisible}
          setOpen={setIsFormVisible}
          type="button"
          styleType="primary"
          startIcon={<PlusIcon className="size-4" />}
          label="Add Chart"
        >
          <div className="flex flex-col space-y-4">
            <div className="grid grid-cols-[30%_1fr] items-center">
              <label className="block font-semibold text-gray-700">
                Chart Type
              </label>
              <div className="flex items-center justify-between space-x-4">
                <button
                  className={`w-12 rounded-[4px] p-2 ${newChartType === 'area' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                  onClick={() => setNewChartType('area')}
                >
                  <ChartBarIcon className="m-auto size-6" />
                </button>
                <button
                  className={`w-12 rounded-[4px] p-2 ${newChartType === 'line' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                  onClick={() => setNewChartType('line')}
                >
                  <ArrowTrendingUpIcon className="m-auto size-6 stroke-[3px]" />
                </button>
                <button
                  className={`w-12 rounded-[4px] p-2 ${newChartType === 'bar' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                  onClick={() => setNewChartType('bar')}
                >
                  <Bars3CenterLeftIcon className="m-auto size-6 -rotate-90 stroke-[4px]" />
                </button>
                <button
                  className={`w-12 rounded-[4px] p-2 ${newChartType === 'donut' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                  onClick={() => setNewChartType('donut')}
                >
                  <ChartPieIcon className="m-auto size-6" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-[30%_1fr] items-center">
              <label className="block font-semibold text-gray-700">
                Resource
              </label>
              <Input
                type={Type.SELECT}
                name="endpoint"
                value={newEndpoint ?? ''}
                onChange={e => {
                  setNewEndpoint(e.target.value as MyResourceKey);
                  setAggregates([]);
                  setAggregate(undefined);
                }}
                options={[
                  { value: '', label: 'Select a resource', disabled: true },
                  { value: 'divider', label: '', divider: true },
                  { value: 'account', label: 'Account' },
                  { value: 'risk', label: 'Risk' },
                  { value: 'asset', label: 'Asset', disabled: true },
                  { value: 'ref', label: 'Reference', disabled: true },
                  { value: 'job', label: 'Job', disabled: true },
                  { value: 'seed', label: 'Seed', disabled: true },
                  { value: 'attribute', label: 'Attribute', disabled: true },
                  { value: 'file', label: 'File', disabled: true },
                  { value: 'threat', label: 'Threat', disabled: true },
                ]}
              />
            </div>
            {aggregates.length > 0 && (
              <div className="grid grid-cols-[30%_1fr] items-center">
                <label className="block font-semibold text-gray-700">
                  Metric
                </label>
                <Input
                  disabled={!newEndpoint}
                  type={Type.SELECT}
                  name="aggregate"
                  value={aggregate ?? ''}
                  onChange={e => setAggregate(e.target.value)}
                  options={[
                    {
                      value: '',
                      label: 'Select a metric',
                      disabled: true,
                    },
                    { value: 'divider', label: '', divider: true },
                    ...(aggregates ?? []),
                  ]}
                />
              </div>
            )}
            <Button
              onClick={addChart}
              type="button"
              styleType="secondary"
              className="ml-auto mt-4"
            >
              Add Chart
            </Button>
          </div>
        </Popover>
      </div>

      <div className="mt-4 grid h-full grid-cols-4 gap-4">
        <GridLayout
          className="layout"
          layout={layout}
          cols={12}
          rowHeight={87}
          width={1248}
          onLayoutChange={setLayout}
        >
          {layout.map(({ i }) => {
            const chart = charts[i];
            return (
              <div key={i}>
                <ChartWrapper
                  i={i}
                  type={chart.type}
                  endpoint={chart.endpoint}
                  aggregate={chart.aggregate}
                  removeChart={removeChart}
                />
              </div>
            );
          })}
        </GridLayout>
      </div>
    </div>
  );
};

export default Dashboard;
