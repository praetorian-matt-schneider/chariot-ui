import {
  MagnifyingGlassCircleIcon,
  MagnifyingGlassIcon,
  NoSymbolIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

import { AssetStatus } from '@/types';

export const getAssetStatusIcon = (status: AssetStatus) => {
  switch (status) {
    case AssetStatus.ActiveHigh:
      return <ShieldCheckIcon className="size-5" />;
    case AssetStatus.Active:
      return <MagnifyingGlassCircleIcon className="size-5" />;
    case AssetStatus.ActiveLow:
      return <MagnifyingGlassIcon className="size-5" />;
    case AssetStatus.Frozen:
    default:
      return <NoSymbolIcon className="size-5" />;
  }
};
