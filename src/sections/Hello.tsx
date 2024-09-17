import React from 'react';
import { Navigate } from 'react-router-dom';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import 'aws-amplify/auth/enable-oauth-listener';

import { getRoute } from '@/utils/route.util';

const Hello: React.FC = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');

  if (!code) {
    const err = urlParams.get('error_description');

    return err ? (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow">
          <div className="flex items-center space-x-3">
            <ExclamationTriangleIcon className="size-6 text-yellow-500" />
            <h2 className="text-xl font-semibold text-gray-800">
              Something went wrong
            </h2>
          </div>
          <p className="mt-4 text-gray-600">{err}</p>
        </div>
      </div>
    ) : null;
  }

  return <Navigate to={getRoute(['app'])} />;
};

export default Hello;
