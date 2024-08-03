import { useState } from 'react';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

import { Button } from '@/components/Button';
import { Inputs } from '@/components/form/Inputs';
import { Popover } from '@/components/Popover';
import { useCreateAttribute } from '@/hooks/useAttribute';

interface Props {
  resourceKey: string;
  className?: string; // Optional prop for custom class names
}

export const AddAttribute = (props: Props) => {
  const { resourceKey, className } = props;
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    value: '',
  });
  const { mutateAsync: createAttribute, status: creatingAttribute } =
    useCreateAttribute(resourceKey);

  function reset() {
    setFormData({
      name: '',
      value: '',
    });
    setOpen(false);
  }

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <Popover
        onClick={() => setOpen(!open)}
        type="button"
        open={open}
        setOpen={setOpen}
        styleType="none"
        className="relative flex min-w-52 items-center  rounded-[2px] border-2 border-default bg-default-light px-4 py-3 pr-2 text-sm font-medium text-default ring-inset focus:z-10 focus:outline-0 disabled:cursor-not-allowed disabled:bg-default-light disabled:text-default-light"
        endIcon={
          open ? (
            <ChevronUpIcon className="ml-auto size-4 text-gray-500" />
          ) : (
            <ChevronDownIcon className="ml-auto size-4 text-gray-500" />
          )
        }
        startIcon={<PlusIcon className="size-4 text-gray-500" />}
        label="Add Attribute"
        style={{ zIndex: 1 }}
      >
        <div className="w-[260px]">
          <form
            className="space-y-4"
            onSubmit={event => {
              event.preventDefault();
              createAttribute(
                {
                  key: resourceKey,
                  name: formData.name,
                  value: formData.value,
                },
                {
                  onSuccess: reset,
                }
              );
            }}
          >
            <Inputs
              inputs={[
                {
                  label: 'Name',
                  value: formData.name,
                  placeholder: 'technology',
                  name: 'name',
                  required: true,
                  className: 'text-sm p-2 border border-gray-300 rounded-md',
                },
                {
                  label: 'Value',
                  value: formData.value,
                  placeholder: 'Apache Web Server',
                  name: 'value',
                  required: true,
                  className: 'text-sm p-2 border border-gray-300 rounded-md',
                },
              ]}
              onChange={values =>
                setFormData(formData => ({ ...formData, ...values }))
              }
            />
            <div className="flex justify-end gap-2">
              <Button
                styleType="primary"
                type="submit"
                className="text-xs"
                startIcon={<PlusIcon className="size-4" />}
                disabled={creatingAttribute === 'pending'}
              >
                Add
              </Button>
              <Button
                styleType="textPrimary"
                className="text-xs"
                disabled={creatingAttribute === 'pending'}
                onClick={reset}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </Popover>
    </div>
  );
};
