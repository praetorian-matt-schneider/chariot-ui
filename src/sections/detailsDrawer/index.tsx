import { useSearchParams } from '@/hooks/useSearchParams';
import { StorageKey } from '@/utils/storage/useStorage.util';

import { AssetDrawer } from './AssetDrawer';
import { KEVDrawer } from './KevDrawer';
import { RiskDrawer } from './RiskDrawer';
import { SeedDrawer } from './SeedDrawer';

export const DRAWER_WIDTH = 'w-[864px]';

export const DetailsDrawer = () => {
  const { searchParams } = useSearchParams();
  const key = searchParams.get(StorageKey.DRAWER_COMPOSITE_KEY) ?? '';
  const [, drawerType, ...rest] = key.split('#');
  const compositeKey = `#${rest.join('#')}`;

  return (
    <div id="details-id">
      <KEVDrawer open={drawerType === 'threat'} compositeKey={compositeKey} />
      <SeedDrawer open={drawerType === 'seed'} compositeKey={compositeKey} />
      <AssetDrawer open={drawerType === 'asset'} compositeKey={compositeKey} />
      <RiskDrawer open={drawerType === 'risk'} compositeKey={compositeKey} />
    </div>
  );
};
