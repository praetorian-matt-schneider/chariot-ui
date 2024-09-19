export const Toggle = ({
  onClick,
  label,
  checked,
}: {
  onClick: () => void;
  label: string;
  checked: boolean;
}) => {
  return (
    <div className="flex w-fit items-center gap-4">
      <span>{label}</span>
      <label
        className="relative flex h-8 w-16"
        onClick={e => {
          e.preventDefault();
          onClick();
        }}
      >
        <input
          type="checkbox"
          className="peer size-0 opacity-0"
          checked={checked}
        />
        <span className="before:content:'' absolute inset-0 h-8 w-16 cursor-pointer rounded-full bg-gray-400 transition-all before:absolute before:left-1 before:top-1 before:size-6 before:rounded-full before:bg-white before:transition-all peer-checked:bg-brand peer-checked:before:translate-x-8"></span>
      </label>
    </div>
  );
};
