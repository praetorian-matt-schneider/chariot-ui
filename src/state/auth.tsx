import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  confirmSignUp,
  fetchAuthSession,
  signIn,
  signOut,
  signUp,
} from 'aws-amplify/auth';

import { Snackbar } from '@/components/Snackbar';
import { queryClient } from '@/queryclient';
import { AuthContextType, AuthState, BackendType } from '@/types';
import { initAmplify } from '@/utils/amplify.util';
import { msToM } from '@/utils/date.util';
import { getRoute } from '@/utils/route.util';
import { StorageKey, useStorage } from '@/utils/storage/useStorage.util';

export const REGION_REGEX = /.*execute-api.(.*).amazonaws/;

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const emptyAuth: AuthState = {
  token: '',
  backend: 'chariot',
  api: 'https://d0qcl2e18h.execute-api.us-east-2.amazonaws.com/chariot',
  region: 'us-east-2',
  clientId: '795dnnr45so7m17cppta0b295o',
  me: '',
  friend: { email: '', displayName: '' },
  isImpersonating: false,
  userPoolId: 'us-east-2_BJ6QHVG2L',
};

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const [error, setError] = useState<string>('');
  const [auth, setAuth] = useStorage<AuthState>(
    { key: StorageKey.AUTH },
    emptyAuth
  );

  const [isLoading, setIsLoading] = useState(false);
  const { expiry } = auth;

  const [, setNewUserSeedModal] = useStorage(
    { key: StorageKey.SHOW_NEW_USER_SEED_MODAL },
    false
  );

  const [isTokenRefreshing, setIsTokenRefreshing] = useState(isExpired(expiry));

  const updateTabVisibility = useCallback(() => {
    const isVisible = document.visibilityState === 'visible';

    if (isVisible && expiry) {
      const buffer = 5 * 60 * 1000; // 5 min as buffer
      const expiresInMs =
        new Date(expiry * 1000).getTime() - getCurrentData().getTime() - buffer;
      if (msToM(expiresInMs) < 0) {
        console.log('The Token has expired', msToM(expiresInMs), 'minutes ago');
      } else {
        console.log('The Token will expire in', msToM(expiresInMs), 'minutes');
      }

      const refreshTimeout = setTimeout(() => {
        console.log('Force refreshing new token.', {
          expiry: new Date(expiry * 1000),
          currentDate: new Date(),
        });
        fetchToken(true);
      }, expiresInMs);

      return () => {
        clearTimeout(refreshTimeout);
      };
    }
  }, [expiry]);

  useEffect(() => {
    document.addEventListener('visibilitychange', updateTabVisibility);
    return () => {
      document.removeEventListener('visibilitychange', updateTabVisibility);
    };
  }, [updateTabVisibility]);

  const startImpersonation = (memberId: string, displayName: string) => {
    setAuth(prevAuth => {
      return {
        ...prevAuth,
        friend: { email: memberId, displayName: displayName },
      };
    });
    window.location.assign('/app/overview');
  };

  const stopImpersonation = () => {
    setAuth(prevAuth => {
      return {
        ...prevAuth,
        friend: { email: '', displayName: '' },
      };
    });
    window.location.assign('/app/account');
  };

  // This function is mainly to handle cases where the user is using their own stack
  const setBackendStack = (backendStack?: BackendType) => {
    const api = backendStack?.api || emptyAuth.api;
    const backend = backendStack?.name || emptyAuth.backend;
    const clientId = backendStack?.client_id || emptyAuth.clientId;
    const userPoolId = backendStack?.userPoolId || emptyAuth.userPoolId;
    const region = REGION_REGEX.exec(api)?.[1] ?? 'us-east-2';

    initAmplify({
      clientId,
      userPoolId,
      backend,
      region,
      api,
    });

    setAuth(prevAuth => ({
      ...prevAuth,
      backend,
      clientId,
      api,
      userPoolId,
    }));
  };

  const login = async (username = '', password = '') => {
    try {
      if (username && password) {
        setNewUserSeedModal(true);
        setIsLoading(true);
        const { isSignedIn } = await signIn({
          username,
          password,
        });
        fetchToken();
        if (isSignedIn) {
          navigate('/');
        }
      }
    } catch (error) {
      error instanceof Error && error.message && setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  async function signup(username = '', password = '', gotoNext = () => {}) {
    try {
      setIsLoading(true);
      if (emptyAuth.backend !== auth.backend) {
        setBackendStack({
          name: auth.backend,
          client_id: auth.clientId,
          api: auth.api,
          userPoolId: auth.userPoolId,
        });
      }
      const { isSignUpComplete, nextStep } = await signUp({
        username,
        password,
      });
      const { signUpStep } = nextStep;
      if (!isSignUpComplete && signUpStep === 'CONFIRM_SIGN_UP') {
        gotoNext && gotoNext();
      }
    } catch (error) {
      error instanceof Error && error.message && setError(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function confirmOTP(username = '', password = '', otp: string = '') {
    try {
      setIsLoading(true);
      const response = await confirmSignUp({
        username,
        confirmationCode: otp,
      });
      if (response.isSignUpComplete) {
        login(username, password);
      }
    } catch (error) {
      if (error instanceof Error && error.message) {
        Snackbar({
          variant: 'error',
          title: 'Failed to confirm OTP',
          description: error.message,
        });
      }
      setIsLoading(false);
    }
  }

  async function fetchToken(forceRefresh = false) {
    setIsTokenRefreshing(true);
    const session = await fetchAuthSession({ forceRefresh });

    const token = session.tokens?.idToken?.toString() ?? '';
    const expiry = session.tokens?.idToken?.payload?.exp ?? 0;
    const me = session.tokens?.idToken?.payload?.email?.toString() ?? '';

    if (forceRefresh) {
      console.log('Token has been refreshed : ', {
        expiry: new Date(expiry * 1000),
        currentDate: new Date(),
      });
    }

    setAuth(auth => ({
      ...auth,
      token,
      expiry,
      me,
    }));
    setIsTokenRefreshing(false);
  }

  async function logout() {
    queryClient.clear();
    setAuth(emptyAuth);
    setNewUserSeedModal(false);

    await signOut();
    navigate(getRoute(['login']));
    setBackendStack();
  }

  const value: AuthContextType = useMemo(
    (): AuthContextType => ({
      ...auth,
      confirmOTP,
      error,
      fetchToken,
      isImpersonating: auth.friend.email !== '',
      isLoading,
      login,
      logout,
      setAuth,
      setBackendStack,
      setError,
      signup,
      startImpersonation,
      stopImpersonation,
    }),
    [login, logout, JSON.stringify(auth)]
  );

  if (isTokenRefreshing) {
    return null;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook to use auth context in any functional component
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

export default AuthProvider;

function getCurrentData() {
  return new Date();
}

function isExpired(expiry?: number) {
  if (!expiry) return false;

  const expiryDate = new Date(expiry * 1000);
  const currentDate = getCurrentData();

  return currentDate > expiryDate;
}
