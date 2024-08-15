import { GetFilesProps } from '@/hooks/useFiles';
import { MyResourceKey, UniqueQueryKeys } from '@/types';

export const getQueryKey = {
  getMy: (key: MyResourceKey | '', filter?: string[][]) => {
    return [UniqueQueryKeys.MY, key, { filter }];
  },
  getAccountAlerts: (account: string) => [
    UniqueQueryKeys.ACCOUNT_ALERTS,
    account,
  ],
  getBackend: () => [UniqueQueryKeys.Backends],
  getFile: (props: GetFilesProps) => [UniqueQueryKeys.GET_FILE, props.name],
  genericSearch: (filter: string[][]) => [
    UniqueQueryKeys.GENERIC_MY_SEARCH,
    { filter },
  ],
  getCounts: (resource: MyResourceKey, filter?: string[][]) => [
    UniqueQueryKeys.COUNTS,
    resource,
    { filter },
  ],
  getGavatarProfilePicture: (email: string) => [
    UniqueQueryKeys.GAVATAR_PROFILE_PICTURE,
    email,
  ],
  getKev: () => [UniqueQueryKeys.KEV],
};
