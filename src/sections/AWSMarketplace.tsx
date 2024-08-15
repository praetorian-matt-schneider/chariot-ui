import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import 'aws-amplify/auth/enable-oauth-listener';

import { useAuth } from '@/state/auth';
import { getRoute } from '@/utils/route.util';
import { StorageKey, useStorage } from '@/utils/storage/useStorage.util';
import { useSearchParams } from '@/utils/url.util';

const AWSMarketplace: React.FC = () => {
  const { isSignedIn } = useAuth();
  const { searchParams } = useSearchParams();
  const [, setAwsMarketplaceConfig] = useStorage(
    {
      key: StorageKey.AWS_MARKETPLACE_CONFIG,
    },
    {}
  );
  const [, setConfirmLinkAWS] = useStorage(
    {
      key: StorageKey.CONFIRM_LINK_AWS,
    },
    false
  );

  useEffect(() => {
    if (searchParams && searchParams.toString()) {
      setAwsMarketplaceConfig(Object.fromEntries(searchParams));
    }
  }, [searchParams]);

  useEffect(() => {
    if (isSignedIn) {
      setConfirmLinkAWS(true);
    }
  }, [isSignedIn]);

  return (
    <Navigate to={isSignedIn ? getRoute(['app']) : getRoute(['signup'])} />
  );
};

export default AWSMarketplace;
