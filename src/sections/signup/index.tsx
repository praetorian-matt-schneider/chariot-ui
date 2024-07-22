import { CustomerQuote } from '@/sections/signup/CustomerQuote';
import { EmailConfirmation } from '@/sections/signup/EmailConfirmation';
import { SignupForm } from '@/sections/signup/SignupForm';
import { Steps } from '@/sections/signup/Steps';

interface Props {
  title?: string;
}

export const Signup = (props: Props) => {
  const { title = 'Sign Up for a Free Account' } = props;

  return (
    <div className="flex size-full bg-layer0">
      <div className="basis-2/5 space-y-8 overflow-auto p-24">
        <img
          className="w-32"
          src="/icons/praetorian.png"
          alt="Praetorian Logo"
        />
        <h1 className="text-3xl font-bold">{title}</h1>
        <Steps
          steps={[
            {
              title: 'Step One',
              description: 'Input Your Information',
              Content: SignupForm,
            },
            {
              title: 'Step Two',
              description: 'Confirm Your Email',
              Content: EmailConfirmation,
            },
          ]}
        />
      </div>
      <CustomerQuote />
    </div>
  );
};
