import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/Button';
import { Input } from '@/components/form/Input';
import { Inputs } from '@/components/form/Inputs';
import {
  isPasswordNotValid,
  PasswordRequirement,
} from '@/components/ui/PasswordRequirement';
import { Disclaimer } from '@/sections/signup/Disclaimer';
import { SignupError } from '@/sections/signup/SignupError';
import { SSO } from '@/sections/signup/SSO';
import { useAuth } from '@/state/auth';
import { getRoute } from '@/utils/route.util';
import { generatePathWithSearch } from '@/utils/url.util';

const UserLambdaValidationException =
  'PreSignUp failed with error email validation failed.';

export const EmailPasswordForm = ({
  onNext,
  isLogin = false,
}: {
  onNext?: () => void;
  isLogin?: boolean;
}) => {
  const {
    isLoading,
    login,
    signup,
    error,
    setError,
    credentials,
    setCredentials,
  } = useAuth();
  const { username, password } = credentials;
  const navigate = useNavigate();

  return (
    <form
      className="flex flex-1 flex-col gap-4 p-2 md:gap-6"
      id="signup"
      onSubmit={e => {
        e.preventDefault();
        isLogin && login(username, password);
        !isLogin && signup(username, password, onNext ? onNext : () => {});
      }}
    >
      <Inputs
        inputs={[
          {
            label: 'Business Email Address',
            value: credentials.username,
            placeholder: 'janelongestname@praetorian.com',
            name: 'username',
            required: true,
          },
          {
            label: 'Password',
            value: credentials.password || '',
            placeholder: '**************',
            name: 'password',
            type: Input.Type.PASSWORD,
            required: true,
          },
        ]}
        onChange={values => {
          setError('');
          setCredentials(auth => ({ ...auth, ...values }));
        }}
      />
      {/* Regex satisfactions */}
      {!isLogin && <PasswordRequirement password={password} />}
      {/* Disable continue on Signup till all regex are satisfied */}
      <Button
        disabled={
          isLogin ? isLoading : isLoading || isPasswordNotValid({ password })
        }
        styleType="primary"
        className="w-full"
        type="submit"
        id="signup"
      >
        Continue
      </Button>
      <SignupError
        error={
          error && error === UserLambdaValidationException
            ? "Sign up failed. Please ensure you're using a business email address."
            : error
        }
      />
      {isLogin && (
        <div className="flex justify-between">
          <Button
            onClick={() => {
              setCredentials({ username: '', password: '' });
              navigate(
                generatePathWithSearch({ pathname: getRoute(['signup']) })
              );
            }}
            className="text-md p-0"
            styleType="textPrimary"
          >
            Sign Up
          </Button>
          <Button
            onClick={() =>
              navigate(
                generatePathWithSearch({
                  pathname: getRoute(['forgot-password']),
                })
              )
            }
            className="text-md p-0"
            styleType="textPrimary"
          >
            Forgot Password?
          </Button>
        </div>
      )}
      <SSO />
      <Disclaimer />
    </form>
  );
};
