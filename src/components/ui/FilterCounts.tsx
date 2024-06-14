import { capitalize } from '@/utils/lodash.util';

export const FilterCounts = ({
  count,
  type,
}: {
  count: number;
  type: string;
}) => (
  <span className="ml-auto text-2xl font-bold">{`${count.toLocaleString()} ${capitalize(type)} Shown`}</span>
);
