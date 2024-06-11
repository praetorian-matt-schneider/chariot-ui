import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { useAuth } from '@/state/auth';
import { getRoute } from '@/utils/route.util';

export function CheckAuth(props: { children: ReactNode }) {
  const { token } = useAuth();
  const location = useLocation();

  if (token) {
    return props.children;
  } else {
    return (
      <Navigate to={getRoute(['login'])} state={{ from: location }} replace />
    );
  }
}
