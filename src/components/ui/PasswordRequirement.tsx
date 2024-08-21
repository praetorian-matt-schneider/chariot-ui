import { CheckCircleIcon } from '@heroicons/react/24/solid';

import { cn } from '@/utils/classname';
import { Regex } from '@/utils/regex.util';

const PasswordRequirements = [
  {
    label: 'At least 16 characters',
    regex: Regex.PASSWORD.CHARACTERS_LENGTH,
  },
  {
    label: 'At least 1 uppercase letter',
    regex: Regex.PASSWORD.UPPER_CASE,
  },
  {
    label: 'At least 1 lowercase letter',
    regex: Regex.PASSWORD.LOWER_CASE,
  },
  {
    label: 'At least 1 number',
    regex: Regex.PASSWORD.NUMERIC_CHARACTERS,
  },
  {
    label: 'At least 1 special character',
    regex: Regex.PASSWORD.SPECIAL_CHARACTERS,
  },
];

export function PasswordRequirement({ password }: { password: string }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-medium text-default-dark">
        Password Requirements
      </h3>
      <div className="grid grid-cols-1 gap-x-4 lg:grid-cols-2">
        {PasswordRequirements.map(({ label, regex }) => (
          <div className="flex gap-2 text-sm" key={label.split(' ').join('_')}>
            <CheckCircleIcon
              className={cn(
                'size-5',
                regex.exec(password) ? 'text-green-500' : 'text-default-light'
              )}
            />
            <p>{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function isPasswordNotValid({ password }: { password: string }) {
  const isNotValid = PasswordRequirements.find(
    ({ regex }) => !regex.exec(password)
  );

  return Boolean(isNotValid);
}
