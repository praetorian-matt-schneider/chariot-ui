import { To } from 'react-router-dom';

import { Asset, Attribute, Risk } from '@/types';
import { StorageKey } from '@/utils/storage/useStorage.util';
import { generatePathWithSearch } from '@/utils/url.util';

export function getDrawerLink() {
  return {
    getAssetDrawerLink: (asset: Pick<Asset, 'dns' | 'name'>): To => {
      return generatePathWithSearch({
        appendSearch: [
          [
            StorageKey.DRAWER_COMPOSITE_KEY,
            `#asset#${asset.dns}#${asset.name}`,
          ],
        ],
      });
    },
    getAttributeDrawerLink: (attribute: Pick<Attribute, 'source'>): To => {
      return generatePathWithSearch({
        appendSearch: [[StorageKey.DRAWER_COMPOSITE_KEY, attribute.source]],
      });
    },
    getRiskDrawerLink: (risk: Pick<Risk, 'dns' | 'name'>): To => {
      return generatePathWithSearch({
        appendSearch: [
          [StorageKey.DRAWER_COMPOSITE_KEY, `#risk#${risk.dns}#${risk.name}`],
        ],
      });
    },
    getProofOfExploitLink: (risk: Pick<Risk, 'dns' | 'name'>): To => {
      return generatePathWithSearch({
        appendSearch: [[StorageKey.POE, `${risk.dns}/${risk.name}`]],
      });
    },
  };
}
