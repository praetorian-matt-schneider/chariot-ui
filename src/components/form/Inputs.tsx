import React, { ReactNode, useEffect, useState } from 'react';

import { Input, InputEvent, InputProps } from '@/components/form/Input';
import { Option } from '@/components/form/Select';

export type Values = Record<string, InputProps['value']>;
type InputType = Omit<InputProps, 'onChange'>;
export type InputsT = (InputType & { children?: ReactNode })[];

interface Props {
  className?: string;
  inputs: InputsT;
  onChange: (values: Values) => void;
  values?: Values;
  defaultValues?: Values;
}

export const getFormValues = (inputs: InputsT): Values => {
  if (!Array.isArray(inputs)) {
    return {};
  }

  return inputs.reduce((acc, current) => {
    if (current.children) {
      return {
        ...acc,
        ...getFormValues(current.children as InputsT),
      };
    }
    return {
      ...acc,
      [current.name]: current.value,
    };
  }, {} as Values);
};

export const Inputs: React.FC<Props> = (props: Props) => {
  const { className, inputs } = props;

  const [values, setValues] = useState<Values>(
    props.defaultValues || getFormValues(inputs)
  );

  useEffect(() => {
    props.onChange(values);
  }, [values]);

  function handleChange(input: InputType) {
    return function (event: InputEvent) {
      const options: Option[] =
        input.type === Input.Type.SELECT && input.options ? input.options : [];
      const number = options.some(({ value }) => typeof value === 'number');
      const { name, value } = event.target;
      setValues(prevValues => {
        const newValues = {
          ...prevValues,
          [name]: number ? parseInt(value, 10) : value,
        };
        return newValues;
      });
    };
  }

  return (
    <>
      {inputs.map(input => {
        if (input.children) {
          return (
            <React.Fragment key={input.name}>{input.children}</React.Fragment>
          );
        }

        return (
          <Input
            {...input}
            className={className}
            key={input.name}
            value={values[input.name] || ''}
            onChange={handleChange(input)}
          />
        );
      })}
    </>
  );
};
