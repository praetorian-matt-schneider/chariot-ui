import { AssetDrawer } from '@/sections/detailsDrawer/AssetDrawer';
import { MaterialRiskDrawer } from '@/sections/detailsDrawer/MaterialRiskDrawer';
import { RiskDrawer } from '@/sections/detailsDrawer/RiskDrawer';
import { Regex } from '@/utils/regex.util';
import { StorageKey } from '@/utils/storage/useStorage.util';
import { useSearchParams } from '@/utils/url.util';

export const DRAWER_WIDTH = 700;

export const DetailsDrawer = () => {
  const { searchParams } = useSearchParams();
  const key = searchParams.get(StorageKey.DRAWER_COMPOSITE_KEY) ?? '';
  const [, drawerType, ...rest] = key.split('#');
  const compositeKey = `#${rest.join('#')}`;
  const materialRisk = key.match(Regex.MATERIAL_RISK) || [];

  return (
    <div id="details-id">
      <AssetDrawer open={drawerType === 'asset'} compositeKey={compositeKey} />
      <RiskDrawer
        open={drawerType === 'risk' && materialRisk.length === 0}
        compositeKey={compositeKey}
      />
      <MaterialRiskDrawer
        open={drawerType === 'risk' && materialRisk.length > 0}
        compositeKey={compositeKey}
      />
    </div>
  );
};
