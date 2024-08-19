import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import 'aws-amplify/auth/enable-oauth-listener';

import { useAuth } from '@/state/auth';
import { useGlobalState } from '@/state/global.state';
import { getRoute } from '@/utils/route.util';
import { useSearchParams } from '@/utils/url.util';

const AWSMarketplace: React.FC = () => {
  const { isSignedIn } = useAuth();
  const navigate = useNavigate();

  const { searchParams } = useSearchParams();

  const { awsMarketplaceConfig } = useGlobalState();

  useEffect(() => {
    if (searchParams && searchParams.toString()) {
      awsMarketplaceConfig.onChange(Object.fromEntries(searchParams));

      if (isSignedIn) {
        awsMarketplaceConfig.onVerifyLinkingChange(true);
      }
    }
    navigate(isSignedIn ? getRoute(['app']) : getRoute(['signup']));
  }, []);

  return null;
};

export default AWSMarketplace;
