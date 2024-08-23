import { useMemo } from 'react';
import axios, { InternalAxiosRequestConfig } from 'axios';

import { useAuth } from '@/state/auth';

const axiosInstance = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

const axiosInstanceNotImpersonated = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

export const useAxios = (doNotImpersonate?: boolean) => {
  return doNotImpersonate ? axiosInstanceNotImpersonated : axiosInstance;
};

export function useInitAxiosInterceptors() {
  const { friend, api, getToken } = useAuth();

  useMemo(() => {
    axiosInstanceNotImpersonated.defaults.baseURL = api ?? '';
    axiosInstance.defaults.baseURL = api ?? '';

    axiosInstance.defaults.headers.common['account'] =
      friend !== '' ? friend : undefined;
  }, [friend, api]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async function interceptor(config: InternalAxiosRequestConfig<any>) {
    try {
      // Get the current session from Auth
      const token = await getToken();

      // Add the token to the request headers
      config.headers.Authorization = token ? `Bearer ${token}` : '';
    } catch (error) {
      console.error('Error getting token', error);
    }
    return config;
  }

  useMemo(() => {
    const axiosInstanceInterceptor = axiosInstance.interceptors.request.use(
      interceptor,
      error => {
        return Promise.reject(error);
      }
    );

    const axiosInstanceNotImpersonatedInterceptor =
      axiosInstanceNotImpersonated.interceptors.request.use(
        interceptor,
        error => {
          return Promise.reject(error);
        }
      );

    return () => {
      axiosInstance.interceptors.request.eject(axiosInstanceInterceptor);
      axiosInstance.interceptors.request.eject(
        axiosInstanceNotImpersonatedInterceptor
      );
    };
  }, []);
}
