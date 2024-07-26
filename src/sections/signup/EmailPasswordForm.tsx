import { useLocation, useNavigate } from 'react-router-dom';

import { Button } from '@/components/Button';
import { Input } from '@/components/form/Input';
import { Inputs } from '@/components/form/Inputs';
import { Disclaimer } from '@/sections/signup/Disclaimer';
import { SignupError } from '@/sections/signup/SignupError';
import { SSO } from '@/sections/signup/SSO';
import { useAuth } from '@/state/auth';
import { getRoute } from '@/utils/route.util';

export const EmailPasswordForm = ({ onNext }: { onNext?: () => void }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isLogin = location.pathname.includes('login');
  const {
    isLoading,
    loginNew,
    signupNew,
    error,
    setError,
    credentials,
    setCredentials,
  } = useAuth();
  const { username, password } = credentials;

  return (
    <form
      className="flex flex-1 flex-col gap-4 space-y-4 p-2"
      id="signup"
      onSubmit={e => {
        e.preventDefault();
        isLogin && loginNew();
        !isLogin && signupNew(onNext);
      }}
    >
      <Inputs
        inputs={[
          {
            label: 'Business Email Address',
            value: username,
            placeholder: 'janelongestname@acmerocketcompany.com',
            name: 'username',
            required: true,
          },
          {
            label: 'Password',
            value: password,
            placeholder: '**************',
            name: 'password',
            type: Input.Type.PASSWORD,
            required: true,
          },
        ]}
        onChange={values => {
          setError('');
          setCredentials(credentials => ({ ...credentials, ...values }));
        }}
      />
      <div className="text-xs">
        <Button
          onClick={() => navigate(getRoute(['forgot-password']))}
          className="p-0 text-xs"
          styleType="textPrimary"
        >
          Forgot Password ?
        </Button>
      </div>
      <Button
        disabled={isLoading}
        styleType="primary"
        className="w-full"
        type="submit"
        id="signup"
      >
        Continue
      </Button>
      <SignupError error={error} />
      {isLogin && (
        <p className="text-xs">
          {`Need an account ? `}
          <Button
            onClick={() => navigate(getRoute(['signup']))}
            className="text-xs"
            styleType="textPrimary"
          >
            Sign Up
          </Button>
        </p>
      )}
      {!isLogin && (
        <p className="text-xs">
          {`Already have an account ? `}
          <Button
            onClick={() => navigate(getRoute(['login']))}
            className="text-xs"
            styleType="textPrimary"
          >
            Sign In
          </Button>
        </p>
      )}
      <Disclaimer />
      <SSO />
    </form>
  );
};
