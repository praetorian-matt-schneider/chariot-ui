import { Asset } from '@/types';
import {
  AggregateCollection,
  defineAggregate,
  getDateFromISO,
} from '@/utils/aggregates/aggregate';

export const aggregates: AggregateCollection<Asset> = {
  countAssetsByClass: defineAggregate<Asset>(
    'Count assets by class',
    asset => asset.class,
    'class',
    'count'
  ),
  assetsCreatedOverTime: defineAggregate<Asset>(
    'Assets created over time',
    asset => getDateFromISO(asset.created),
    'date',
    'cumulativeAssets'
  ),
};
