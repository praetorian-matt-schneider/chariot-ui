interface TransitionSettingsProps {
  type: 'fade' | 'scale' | 'slideRight' | 'slideLeft';
}

export const getTransitionSettings = ({
  type,
}: TransitionSettingsProps): {
  enter: string;
  enterFrom: string;
  enterTo: string;
  leave: string;
  leaveFrom: string;
  leaveTo: string;
} => {
  switch (type) {
    case 'scale':
      return {
        enter: 'ease-out duration-300',
        enterFrom: 'opacity-0 scale-95',
        enterTo: 'opacity-100 scale-100',
        leave: 'ease-in duration-200',
        leaveFrom: 'opacity-100 scale-100',
        leaveTo: 'opacity-0 scale-95',
      };
    case 'slideRight':
      return {
        enter: 'ease-in-out duration-300 sm:duration-500',
        enterFrom: 'translate-x-full',
        enterTo: 'translate-x-0',
        leave: 'ease-in-out duration-300 sm:duration-500',
        leaveFrom: 'translate-x-0',
        leaveTo: 'translate-x-full',
      };
    case 'slideLeft':
      return {
        enter: 'ease-in-out duration-300 sm:duration-500',
        enterFrom: '-translate-x-full',
        enterTo: 'translate-x-0',
        leave: 'ease-in-out duration-300 sm:duration-500',
        leaveFrom: 'translate-x-0',
        leaveTo: '-translate-x-full',
      };
    default:
      return {
        enter: 'ease-out duration-300',
        enterFrom: 'opacity-0',
        enterTo: 'opacity-100',
        leave: 'ease-in duration-200',
        leaveFrom: 'opacity-100',
        leaveTo: 'opacity-0',
      };
  }
};
