import { useNavigate } from 'react-router-dom';

import { Drawer } from '@/components/Drawer';
import { useSearchParams } from '@/hooks/useSearchParams';
import { StorageKey } from '@/utils/storage/useStorage.util';

import { AssetDrawer } from './AssetDrawer';
import { KEVDrawer } from './KevDrawer';
import { RiskDrawer } from './RiskDrawer';
import { SeedDrawer } from './SeedDrawer';

export const DetailsDrawer = () => {
  const navigate = useNavigate();
  const { searchParams, removeSearchParams } = useSearchParams();
  const key = searchParams.get(StorageKey.DRAWER_COMPOSITE_KEY) ?? '';
  const [, drawerType, ...rest] = key.split('#');
  const compositeKey = `#${rest.join('#')}`;

  const seed = drawerType === 'seed';
  const asset = drawerType === 'asset';
  const risk = drawerType === 'risk';
  const kev = drawerType === 'threat';

  return (
    <div id="details-id">
      <Drawer
        open={
          Boolean(drawerType) && drawerType !== 'risk' && drawerType !== 'asset'
        }
        onClose={() => removeSearchParams(StorageKey.DRAWER_COMPOSITE_KEY)}
        onBack={() => navigate(-1)}
      >
        {kev && <KEVDrawer compositeKey={compositeKey} />}
      </Drawer>
      <SeedDrawer open={seed} compositeKey={compositeKey} />
      <AssetDrawer open={asset} compositeKey={compositeKey} />
      <RiskDrawer open={risk} compositeKey={compositeKey} />
    </div>
  );
};
