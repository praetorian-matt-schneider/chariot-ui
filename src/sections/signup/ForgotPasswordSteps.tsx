import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { confirmResetPassword, resetPassword } from 'aws-amplify/auth';

import { Button } from '@/components/Button';
import { Input } from '@/components/form/Input';
import { Inputs } from '@/components/form/Inputs';
import { Disclaimer } from '@/sections/signup/Disclaimer';
import { SignupError } from '@/sections/signup/SignupError';
import { cn } from '@/utils/classname';
import { getRoute } from '@/utils/route.util';

export const ForgotPasswordSteps = () => {
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [username, setUsername] = useState<string>('');
  const [forgotPasswordForm, setForgotPasswordForm] = useState<{
    code: string;
    password: string;
    passwordAgain: string;
  }>({
    code: '',
    password: '',
    passwordAgain: '',
  });
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (forgotPasswordForm.password !== forgotPasswordForm.passwordAgain) {
      setError('Passwords do not match');
      setIsLoading(true);
    } else {
      setIsLoading(false);
    }
  }, [forgotPasswordForm.password, forgotPasswordForm.passwordAgain]);

  async function handleResetPassword() {
    try {
      setIsLoading(true);
      const output = await resetPassword({ username });
      if (
        output.nextStep.resetPasswordStep === 'CONFIRM_RESET_PASSWORD_WITH_CODE'
      ) {
        setStepIndex(stepIndex => stepIndex + 1);
      }
    } catch (error) {
      error instanceof Error
        ? setError(error.message)
        : setError('An error occurred');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleConfirmResetPassword() {
    try {
      setIsLoading(true);
      await confirmResetPassword({
        username: username,
        confirmationCode: forgotPasswordForm.code,
        newPassword: forgotPasswordForm.password,
      });
      navigate(getRoute(['login']));
    } catch (error) {
      error instanceof Error
        ? setError(error.message)
        : setError('An error occurred');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex border-2 border-default">
        {[
          {
            title: 'Step One',
            description: 'Input Your Email',
          },
          {
            title: 'Step Two',
            description: 'Reset Password',
          },
        ].map((step, currentIndex) => (
          <div
            className={cn(
              'grow px-4 py-2 cursor-pointer',
              currentIndex > 0 && 'border-0 border-l-2 border-default',
              currentIndex > stepIndex &&
                'bg-layer1 text-default-light cursor-not-allowed'
            )}
            key={step.title}
            onClick={() =>
              currentIndex <= stepIndex ? setStepIndex(currentIndex) : null
            }
          >
            <h6
              className={cn(
                'text-xs font-semibold text-brand',
                stepIndex < currentIndex && 'text-default-light'
              )}
            >
              {step.title}
            </h6>
            <p className="text-sm font-bold text-current">{step.description}</p>
          </div>
        ))}
      </div>
      <hr className="border-t-2 border-default" />
      {stepIndex === 0 ? (
        <form
          className="flex flex-1 flex-col gap-4 space-y-4 p-2"
          id="signup"
          onSubmit={e => {
            e.preventDefault();
            handleResetPassword();
          }}
        >
          <Input
            label={'Email Address'}
            value={username}
            placeholder={'janelongestname@acmerocketcompany.com'}
            name={'username'}
            required={true}
            onChange={e => {
              setError('');
              setUsername(e.target.value);
            }}
          />
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
          <Disclaimer />
        </form>
      ) : (
        <div className="text-sm text-default-light">
          <p className="mb-4">
            We have sent a password reset code by email to {username}. Enter it
            below to reset your password.
          </p>
          <form
            id="forgot-password"
            className="flex flex-1 flex-col gap-4 space-y-4"
          >
            <Inputs
              inputs={[
                {
                  label: 'Code',
                  value: forgotPasswordForm.code,
                  placeholder: '',
                  name: 'code',
                  required: true,
                },
                {
                  label: 'New Password',
                  value: forgotPasswordForm.password,
                  placeholder: '**************',
                  name: 'password',
                  type: Input.Type.PASSWORD,
                  required: true,
                },
                {
                  label: 'Enter New Password Again',
                  value: forgotPasswordForm.passwordAgain,
                  placeholder: '**************',
                  name: 'passwordAgain',
                  type: Input.Type.PASSWORD,
                  required: true,
                },
              ]}
              onChange={values => {
                setError('');
                setForgotPasswordForm(credentials => ({
                  ...credentials,
                  ...values,
                }));
              }}
            />
            <SignupError error={error} />
            <Button
              disabled={isLoading}
              styleType="primary"
              className="w-full"
              type="submit"
              id="forgot-password"
              onClick={handleConfirmResetPassword}
            >
              Change Password
            </Button>
          </form>
        </div>
      )}
    </div>
  );
};
