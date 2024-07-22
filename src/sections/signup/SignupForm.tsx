import { useState } from 'react';

import { Button } from '@/components/Button';
import { Input } from '@/components/form/Input';
import { Inputs } from '@/components/form/Inputs';
import { Disclaimer } from '@/sections/signup/Disclaimer';
import { SSO } from '@/sections/signup/SSO';

export const SignupForm = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  return (
    <form
      className="flex flex-1 flex-col gap-4 space-y-4 p-2"
      id="signup"
      onSubmit={event => {
        event.preventDefault();
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
        onChange={values =>
          setFormData(formData => ({ ...formData, ...values }))
        }
      />
      <Button styleType="primary" className="w-full" type="submit" id="signup">
        Continue
      </Button>
      <Disclaimer />
      <SSO />
    </form>
  );
};
