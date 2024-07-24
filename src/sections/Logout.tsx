import React, { useEffect } from 'react';

import { useAuth } from '@/state/auth';

function Logout() {
  const { logoutNew } = useAuth();

  useEffect(() => {
    logoutNew();
  }, []);

  return <div></div>;
}

export default Logout;
