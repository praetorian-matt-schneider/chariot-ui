import { useSearchParams } from '@/hooks/useSearchParams';
import { StorageKey } from '@/utils/storage/useStorage.util';

import { Asset, Risk, Seed, Threat } from '../../types';

export function useOpenDrawer() {
  const { addSearchParams } = useSearchParams();

  return {
    openSeed: (seed: Pick<Seed, 'name'>) => {
      addSearchParams(StorageKey.DRAWER_COMPOSITE_KEY, '#seed#' + seed.name);
    },
    openRisk: (risk: Pick<Risk, 'key'>) => {
      addSearchParams(StorageKey.DRAWER_COMPOSITE_KEY, risk.key);
    },
    openAsset: (asset: Partial<Pick<Asset, 'key'>>) => {
      addSearchParams(StorageKey.DRAWER_COMPOSITE_KEY, asset.key);
    },
    openThreat: (threat: Pick<Threat, 'key'>) => {
      addSearchParams(StorageKey.DRAWER_COMPOSITE_KEY, threat.key);
    },
  };
}
