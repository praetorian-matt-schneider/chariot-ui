import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { signUp } from 'aws-amplify/auth';

import { Button } from '@/components/Button';
import { Input } from '@/components/form/Input';
import { Inputs } from '@/components/form/Inputs';
import { Disclaimer } from '@/sections/signup/Disclaimer';
import { SSO } from '@/sections/signup/SSO';
import { useAuth } from '@/state/auth';
import { getRoute } from '@/utils/route.util';

export const EmailPasswordForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginNew, error, setError } = useAuth();
  const isLogin = location.pathname.includes('login');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  async function onSignup() {
    try {
      const { isSignUpComplete, userId, nextStep } = await signUp({
        username: formData.email,
        password: formData.password,
      });
      const { signUpStep } = nextStep;
      if (!isSignUpComplete && signUpStep === 'CONFIRM_SIGN_UP') {
        // navigate(getRoute(['signup', 'confirm'], { userId }));
        // Goto next step
        console.log(isSignUpComplete, userId);
      }
    } catch (error) {
      error instanceof Error && error.message && setError(error.message);
    }
  }

  return (
    <form
      className="flex flex-1 flex-col gap-4 space-y-4 p-2"
      id="signup"
      onSubmit={e => {
        e.preventDefault();
        isLogin && loginNew(formData.email, formData.password);
        !isLogin && onSignup();
      }}
    >
      <Inputs
        inputs={[
          {
            label: 'Business Email Address',
            value: formData.email,
            placeholder: 'janelongestname@acmerocketcompany.com',
            name: 'email',
            required: true,
          },
          {
            label: 'Password',
            value: formData.password,
            placeholder: '**************',
            name: 'password',
            type: Input.Type.PASSWORD,
            required: true,
          },
        ]}
        onChange={values => {
          setError('');
          setFormData(formData => ({ ...formData, ...values }));
        }}
      />
      <Button styleType="primary" className="w-full" type="submit" id="signup">
        Continue
      </Button>
      {error && (
        <div className="flex items-center gap-2 rounded bg-yellow-100 p-2 text-xs text-yellow-600">
          <ExclamationCircleIcon className="inline size-4 text-yellow-700" />
          <span>{error}</span>
        </div>
      )}
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
