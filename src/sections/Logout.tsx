import React, { useEffect } from 'react';

import { useAuth } from '@/state/auth';

function Logout() {
  const { logout } = useAuth();

  useEffect(() => {
    logout();
  }, []);

  return <div className="fixed left-0 top-0 z-10 size-full bg-white"></div>;
}

export default Logout;
