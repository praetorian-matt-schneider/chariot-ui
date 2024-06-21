import { capitalize } from '@/utils/lodash.util';

interface Props {
  count: number;
  type: string;
  total?: number;
}

export const FilterCounts: React.FC<Props> = ({ count, type }: Props) => {
  return (
    <span className="ml-auto text-2xl font-bold">{`${count.toLocaleString()} ${capitalize(type)} Shown`}</span>
  );
};
