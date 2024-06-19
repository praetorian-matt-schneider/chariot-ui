import { Asset } from '@/types';
import {
  AggregateCollection,
  defineAggregate,
  getDateFromISO,
} from '@/utils/aggregates/aggregate';

/* 
  See the following link for more information on how to add new charts:
  https://github.com/praetorian-inc/chariot-ui?tab=readme-ov-file#adding-new-charts
*/
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
