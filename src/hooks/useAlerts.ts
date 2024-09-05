import { toast } from 'sonner';

import { useAxios } from '@/hooks/useAxios';
import { useGetAccountAlerts } from '@/hooks/useGetAccountAlerts';
import { useMy } from '@/hooks/useMy';
import { Condition } from '@/types';
import { useMutation } from '@/utils/api';

export function useAddAlert() {
  const axios = useAxios();

  const { invalidate } = useMy({ resource: 'condition' });
  const { invalidate: invalidateAlerts } = useGetAccountAlerts();

  return useMutation({
    defaultErrorMessage: 'Failed to add alert',
    mutationFn: async (alert: Pick<Condition, 'name' | 'value'>) => {
      const promise = axios.post(`/account/alert`, {
        name: alert.name,
        value: alert.value,
      });

      toast.promise(promise, {
        loading: `Adding alert`,
        success: `Alert added successfully`,
        error: `Failed to add alert`,
      });

      await promise;
    },
    onSuccess: () => {
      invalidate();
      invalidateAlerts();
    },
  });
}

export function useRemoveAlert() {
  const axios = useAxios();

  const { invalidate } = useMy({ resource: 'condition' });
  const { invalidate: invalidateAlerts } = useGetAccountAlerts();

  return useMutation({
    defaultErrorMessage: 'Failed to add alert',
    mutationFn: async (alert: Pick<Condition, 'key'>) => {
      const promise = axios.delete(`/account/alert`, {
        data: {
          key: alert.key,
        },
      });

      toast.promise(promise, {
        loading: `Removing alert`,
        success: `Alert removed successfully`,
        error: `Failed to remove alert`,
      });

      await promise;
    },
    onSuccess: () => {
      invalidate();
      invalidateAlerts();
    },
  });
}
