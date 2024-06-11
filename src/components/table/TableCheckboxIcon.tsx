import { StopIcon as UncheckedIcon } from '@heroicons/react/24/outline';
import { StopIcon as CheckedIcon } from '@heroicons/react/24/solid';

export function TableCheckBoxIcon(props: { isChecked: boolean }) {
  return (
    <>
      {props.isChecked ? (
        <CheckedIcon
          className="box-border size-6 rounded-[2px] border-brand text-brand hover:border-brand/100 hover:bg-brand/10"
          aria-hidden="true"
        />
      ) : (
        <UncheckedIcon
          className="box-border size-6 rounded-[2px] border-default text-checkbox hover:border hover:border-default hover:bg-brand/10"
          aria-hidden="true"
        />
      )}
    </>
  );
}
