import React from 'react';

import { useAuth } from '@/state/auth';

function Logout() {
  const { logout } = useAuth();

  React.useEffect(() => {
    logout();
  }, []);

  return <div></div>;
}

export default Logout;
