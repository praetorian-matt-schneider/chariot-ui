import { To, useLocation } from 'react-router-dom';

import { useSearchParams } from '@/hooks/useSearchParams';
import { StorageKey } from '@/utils/storage/useStorage.util';

import { Asset, Risk, Seed, Threat } from '../../types';

export function useOpenDrawer() {
  const location = useLocation();
  const { searchParams } = useSearchParams();

  return {
    getAssetDrawerLink: (asset: Pick<Asset, 'dns' | 'name'>): To => {
      searchParams.set(
        StorageKey.DRAWER_COMPOSITE_KEY,
        `#asset#${asset.dns}#${asset.name}`
      );

      return {
        pathname: location.pathname,
        search: searchParams.toString(),
      };
    },
    getThreatDrawerLink: (threat: Pick<Threat, 'name'>): To => {
      searchParams.set(
        StorageKey.DRAWER_COMPOSITE_KEY,
        `#threat#KEV#${threat.name}`
      );

      return {
        pathname: location.pathname,
        search: searchParams.toString(),
      };
    },
    getRiskDrawerLink: (risk: Pick<Risk, 'dns' | 'name'>): To => {
      searchParams.set(
        StorageKey.DRAWER_COMPOSITE_KEY,
        `#risk#${risk.dns}#${risk.name}`
      );

      return {
        pathname: location.pathname,
        search: searchParams.toString(),
      };
    },
    getSeedDrawerLink: (seed: Pick<Seed, 'name'>): To => {
      searchParams.set(StorageKey.DRAWER_COMPOSITE_KEY, `#seed#${seed.name}`);

      return {
        pathname: location.pathname,
        search: searchParams.toString(),
      };
    },
  };
}
