import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { CognitoIdentityProvider } from '@aws-sdk/client-cognito-identity-provider';
import { Amplify } from 'aws-amplify';
import {
  confirmSignUp,
  fetchAuthSession,
  signIn,
  signOut,
  signUp,
} from 'aws-amplify/auth';
import { jwtDecode } from 'jwt-decode';

import { Snackbar } from '@/components/Snackbar';
import { queryClient } from '@/queryclient';
import {
  AuthContextType,
  AuthState,
  BackendType,
  CognitoAuthStates,
} from '@/types';
import { sToM } from '@/utils/date.util';
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
  const [credentials, setCredentials] = useState<{
    username: string;
    password: string;
  }>({ username: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const { backend, expiry, region, clientId } = auth;

  const [, setIsTabVisible] = useState(true);
  const [, setNewUserSeedModal] = useStorage(
    { key: StorageKey.SHOW_NEW_USER_SEED_MODAL },
    false
  );

  const [isTokenRefreshing, setIsTokenRefreshing] = useState(isExpired(expiry));

  const updateTabVisibility = useCallback(() => {
    const isVisible = document.visibilityState === 'visible';

    if (isVisible) {
      if (isExpired(expiry)) {
        console.log(
          'The token has expired while tab is unfocused. So masking UI while refreshing the token',
          {
            expiry: expiry && new Date(expiry),
            currentDate: new Date(),
          }
        );
        setIsTokenRefreshing(true);
      }
    }

    setIsTabVisible(isVisible);
  }, [expiry]);

  const startImpersonation = (memberId: string, displayName: string) => {
    setAuth(prevAuth => {
      return {
        ...prevAuth,
        friend: { email: memberId, displayName: displayName },
      };
    });
    window.location.assign('/app/risks');
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

  async function login(backend: BackendType) {
    const extracted_region = REGION_REGEX.exec(backend.api)?.[1] ?? 'us-east-2';

    setAuth(prevAuth => ({
      ...prevAuth,
      backend: backend.name,
      api: backend.api,
      clientId: backend.client_id,
      region: extracted_region,
    }));

    setNewUserSeedModal(true);

    if (backend.username && backend.password) {
      const cognito = new CognitoIdentityProvider({
        region: extracted_region,
      });
      const response = await cognito.initiateAuth({
        AuthFlow: 'USER_PASSWORD_AUTH',
        AuthParameters: {
          USERNAME: backend.username,
          PASSWORD: backend.password,
        },
        ClientId: backend.client_id,
      });
      if (response?.AuthenticationResult?.IdToken) {
        setCognitoAuthStates({
          idToken: response?.AuthenticationResult?.IdToken,
          expiresIn: response?.AuthenticationResult?.ExpiresIn,
          refreshToken: response?.AuthenticationResult?.RefreshToken,
        });
      }
      navigate('/');
    } else {
      // Redirect to hosted UI
      const fqdn = `praetorian-${backend.name}.auth.${extracted_region}.amazoncognito.com`;
      const redirect = `${window.location.host}${getRoute(['hello'])}`;
      const hostedUI = `https://${fqdn}/oauth2/authorize?client_id=${backend.client_id}&response_type=code&scope=openid+email&redirect_uri=https%3A%2F%2F${redirect}`;
      window.location.href = '/';
      window.location.assign(hostedUI); // external navigation
    }
  }

  // This function is mainly to handle cases where the user is using their own stack
  const setBackendStack = (backendStack?: BackendType) => {
    const api = backendStack?.api || emptyAuth.api;
    const backend = backendStack?.name || emptyAuth.backend;
    const clientId = backendStack?.client_id || emptyAuth.clientId;
    const userPoolId = backendStack?.userPoolId || emptyAuth.userPoolId;
    const region = REGION_REGEX.exec(api)?.[1] ?? 'us-east-2';

    Amplify.configure({
      Auth: {
        Cognito: {
          userPoolClientId: clientId,
          userPoolId,

          loginWith: {
            oauth: {
              domain: `praetorian-${backend}.auth.${region}.amazoncognito.com`,
              scopes: ['email', 'openid'],
              redirectSignIn: [
                'https://localhost:3000/hello',
                'https://preview.chariot.praetorian.com/hello',
              ],
              redirectSignOut: [
                'https://localhost:3000/goodbye',
                'https://preview.chariot.praetorian.com/goodbye',
              ],
              responseType: 'code',
            },
          },
        },
      },
      API: {
        REST: {
          [backend]: {
            endpoint: api,
            region,
          },
        },
      },
    });

    setAuth(prevAuth => ({
      ...prevAuth,
      backend,
      clientId,
      api,
      userPoolId,
    }));
  };

  const loginNew = async (backendStack?: BackendType) => {
    try {
      backendStack && setBackendStack(backendStack);
      const username = backendStack?.username || credentials.username || '';
      const password = backendStack?.password || credentials.password || '';
      if (username && password) {
        setNewUserSeedModal(true);
        setIsLoading(true);
        const { isSignedIn } = await signIn({
          username,
          password,
        });
        fetchToken();
        if (isSignedIn) {
          setAuth(auth => ({ ...auth, me: username }));
          navigate('/');
        }
      }
    } catch (error) {
      error instanceof Error && error.message && setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  async function signupNew(gotoNext = () => {}) {
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
        username: credentials.username,
        password: credentials.password,
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

  async function confirmOTP(otp: string = '') {
    try {
      setIsLoading(true);
      const response = await confirmSignUp({
        username: credentials.username,
        confirmationCode: otp,
      });
      if (response.isSignUpComplete) {
        loginNew();
      }
    } catch (error) {
      if (error instanceof Error && error.message) {
        Snackbar({
          variant: 'error',
          title: 'Failed to confirm OTP',
          description: error.message,
        });
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchToken() {
    setIsLoading(true);
    const session = await fetchAuthSession();
    setIsLoading(false);
    setAuth(auth => ({
      ...auth,
      token: session.tokens?.idToken?.toString() ?? '',
    }));
  }

  function logout() {
    queryClient.clear();
    setAuth(emptyAuth);

    setNewUserSeedModal(false);

    if (backend && region && clientId) {
      // Redirect to hosted UI
      const fqdn = `praetorian-${backend}.auth.${region}.amazoncognito.com`;
      const redirect = `${window.location.host}/goodbye`;
      const hostedUI = `https://${fqdn}/logout?client_id=${clientId}&response_type=code&logout_uri=https%3A%2F%2F${redirect}`;

      setTimeout(() => {
        window.location.assign(hostedUI);
      }, 200);
    }
  }

  async function logoutNew() {
    queryClient.clear();
    setAuth(emptyAuth);
    setNewUserSeedModal(false);

    await signOut();
    navigate(getRoute(['login']));
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
      loginNew,
      logout,
      logoutNew,
      setAuth,
      setBackendStack,
      setCognitoAuthStates,
      setError,
      signupNew,
      startImpersonation,
      stopImpersonation,
      credentials,
      setCredentials,
    }),
    [login, logout, JSON.stringify(auth)]
  );

  function setCognitoAuthStates(props: CognitoAuthStates) {
    // Note: Below is for testing expiry. Setting it to 10.59secs for testing purposes
    // _.set(props, 'expiresIn', 659);
    const parsedToken = jwtDecode(props.idToken);
    const userEmail = (parsedToken as { email?: string })?.email;

    const authData: {
      token: string;
      expiry?: Date;
      rToken?: string;
      me?: string;
    } = {
      token: props.idToken,
    };

    if (userEmail) {
      authData.me = userEmail;
    }

    if (props?.expiresIn) {
      if (props?.refreshToken) {
        authData.rToken = props.refreshToken;
      }
      // Note: expiresInMinutes should be minimum of 1 minutes, setting it to 0 will cause infinity loop.
      const expiresInMinutes = Math.max(sToM(props.expiresIn) - 10, 1);
      const expiryDate = getExpiryDate(expiresInMinutes);

      console.log(
        'Fetched new Token, Token will expires in',
        expiresInMinutes,
        'minutes',
        { expiry: new Date(expiryDate), currentDate: new Date() }
      );
      authData.expiry = expiryDate;
    }

    setAuth(prevAuth => ({
      ...prevAuth,
      ...authData,
    }));
  }

  useEffect(() => {
    document.addEventListener('visibilitychange', updateTabVisibility);

    return () => {
      document.removeEventListener('visibilitychange', updateTabVisibility);
    };
  }, [updateTabVisibility]);

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

function getExpiryDate(expiresInMinutes: number): Date {
  return new Date(
    new Date().setMinutes(new Date().getMinutes() + expiresInMinutes)
  );
}

function getCurrentData() {
  return new Date();
}

function isExpired(expiry?: Date) {
  if (!expiry) return false;

  const expiryDate = new Date(expiry);
  const currentDate = getCurrentData();

  return currentDate > expiryDate;
}
