import { GetFilesProps } from '@/hooks/useFiles';
import { useAuth } from '@/state/auth';
import { MyResourceKey, UniqueQueryKeys } from '@/types';

export const getQueryKey = {
  getMy: (key: MyResourceKey, compositeKey?: string) => {
    return [UniqueQueryKeys.MY, key, ...(compositeKey ? [compositeKey] : [])];
  },
  getAccountAlerts: (account: string) => [
    UniqueQueryKeys.ACCOUNT_ALERTS,
    account,
  ],
  getBackend: () => [UniqueQueryKeys.Backends],
  getFile: (props: GetFilesProps) => [UniqueQueryKeys.GET_FILE, props.name],
  genericSearch: (search: string) => [
    UniqueQueryKeys.GENERIC_MY_SEARCH,
    ...(search ? [search] : []),
  ],
  getCounts: (resource: MyResourceKey, compositeKey?: string) => [
    UniqueQueryKeys.COUNTS,
    resource,
    ...(compositeKey ? [compositeKey] : []),
  ],
  getGavatarProfilePicture: (email: string) => [
    UniqueQueryKeys.GAVATAR_PROFILE_PICTURE,
    email,
  ],
  getKev: () => [UniqueQueryKeys.KEV],
  userAttributes: () => [UniqueQueryKeys.USER_ATTRIBUTES],
};

export function useGetUserKey(
  key: ReadonlyArray<unknown> = [],
  doNotImpersonate?: boolean
) {
  const { friend } = useAuth();

  if (!doNotImpersonate && friend) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return [...key, friend] as any;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return [...key] as any;
}
