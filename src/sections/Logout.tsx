import React, { useEffect } from 'react';

import { useAuth } from '@/state/auth';

function Logout() {
  const { logout } = useAuth();

  useEffect(() => {
    logout();
  }, []);

  return <div></div>;
}

export default Logout;
