import { useMemo } from 'react';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

import { Snackbar } from '@/components/Snackbar';
import { useAuth } from '@/state/auth';

const axiosInstance = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
});

const uuid = uuidv4();

export const useAxios = () => {
  return axiosInstance;
};

export function useInitAxiosInterceptors() {
  const { api, token, friend } = useAuth();

  useMemo(() => {
    axiosInstance.defaults.baseURL = api ?? '';
    axiosInstance.defaults.headers.common['Authorization'] = token
      ? `Bearer ${token}`
      : '';
    axiosInstance.defaults.headers.common['account'] =
      friend.email && friend.email !== '' ? friend.email : undefined;
  }, [api, token, friend]);

  useMemo(() => {
    // Adding a response interceptor
    const responseInterceptor = axiosInstance.interceptors.response.use(
      response => {
        return response;
      },
      error => {
        if (error.code === 'ERR_NETWORK') {
          Snackbar({
            title: 'Network Error',
            description: `Status: ${error.response}`,
            variant: 'error',
            toastId: uuid,
          });
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axiosInstance.interceptors.response.eject(responseInterceptor);
    };
  }, []);
}
