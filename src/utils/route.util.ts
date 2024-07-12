import { generatePath, useLocation } from 'react-router-dom';

import { TAppRoutes } from '@/app/AppRoute';
import { IRouteObj } from '@/components/route/RenderRoutes';

type TData = TAppRoutes;

type ExcludeFallback<TData> = Exclude<
  keyof TData,
  '*' | 'default' | 'element' | 'enabled' | 'title'
>;

export function getRoute<
  TKey1 extends ExcludeFallback<TData>,
  TKey2 extends ExcludeFallback<TData[TKey1]>,
  TKey3 extends ExcludeFallback<TData[TKey1][TKey2]>,
  TKey4 extends ExcludeFallback<TData[TKey1][TKey2][TKey3]>,
>(
  path: [TKey1, TKey2, TKey3, TKey4]
): `${TKey1}/${TKey2 extends string ? TKey2 : never}/${TKey3 extends string
  ? TKey3
  : never}/${TKey4 extends string ? TKey4 : never}`;

export function getRoute<
  TKey1 extends ExcludeFallback<TData>,
  TKey2 extends ExcludeFallback<TData[TKey1]>,
  TKey3 extends ExcludeFallback<TData[TKey1][TKey2]>,
>(
  path: [TKey1, TKey2, TKey3]
): `${TKey1}/${TKey2 extends string ? TKey2 : never}/${TKey3 extends string
  ? TKey3
  : never}`;

export function getRoute<
  TKey1 extends ExcludeFallback<TData>,
  TKey2 extends ExcludeFallback<TData[TKey1]>,
>(path: [TKey1, TKey2]): `${TKey1}/${TKey2 extends string ? TKey2 : never}`;

export function getRoute<TKey1 extends ExcludeFallback<TData>>(
  path: [TKey1]
): TKey1;

export function getRoute(path: string[]): string {
  return `/${path.join('/')}`;
}

export function validateRoutes<EnabledProps>(routes: IRouteObj<EnabledProps>) {
  return routes;
}

type TUserData = TAppRoutes['app/:userId'];

export function getAppRoute<
  TKey1 extends ExcludeFallback<TUserData>,
  TKey2 extends ExcludeFallback<TUserData[TKey1]>,
  TKey3 extends ExcludeFallback<TUserData[TKey1][TKey2]>,
  TKey4 extends ExcludeFallback<TUserData[TKey1][TKey2][TKey3]>,
>(
  path: [TKey1, TKey2, TKey3, TKey4],
  location?: Location
): `${TKey1}/${TKey2 extends string ? TKey2 : never}/${TKey3 extends string
  ? TKey3
  : never}/${TKey4 extends string ? TKey4 : never}`;

export function getAppRoute<
  TKey1 extends ExcludeFallback<TUserData>,
  TKey2 extends ExcludeFallback<TUserData[TKey1]>,
  TKey3 extends ExcludeFallback<TUserData[TKey1][TKey2]>,
>(
  path: [TKey1, TKey2, TKey3],
  location?: Location
): `${TKey1}/${TKey2 extends string ? TKey2 : never}/${TKey3 extends string
  ? TKey3
  : never}`;

export function getAppRoute<
  TKey1 extends ExcludeFallback<TUserData>,
  TKey2 extends ExcludeFallback<TUserData[TKey1]>,
>(
  path: [TKey1, TKey2],
  location?: Location
): `${TKey1}/${TKey2 extends string ? TKey2 : never}`;

export function getAppRoute<TKey1 extends ExcludeFallback<TUserData>>(
  path: [TKey1],
  location?: Location
): TKey1;

export function getAppRoute(
  path: string[],
  location = window.location
): string {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-expect-error
  return generatePath(getRoute(['app/:userId', ...path]), {
    userId: location.pathname.match(/(?<=\/app\/).*(?=\/)/)?.[0] || '',
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useGetAppRoute: typeof getAppRoute = (path: any) => {
  const location = useLocation();
  return getAppRoute(path, location as unknown as Location);
};
