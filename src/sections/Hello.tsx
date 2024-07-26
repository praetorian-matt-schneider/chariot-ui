import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/state/auth';
import { getRoute } from '@/utils/route.util';

const Hello: React.FC = () => {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');

  const { fetchToken } = useAuth();

  useEffect(() => {
    if (code) {
      fetchTokenAndRedirect();
    }
  }, [code]);

  async function fetchTokenAndRedirect() {
    await fetchToken();
    navigate(getRoute(['app']));
  }

  return null;
};

export default Hello;
