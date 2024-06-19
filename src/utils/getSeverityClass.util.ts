export const getSeverityClass = (key: string) => {
  switch (key) {
    case 'I':
      return `border-gray-200`;
    case 'L':
      return `bg-indigo-100 border-indigo-200 text-indigo-800`;
    case 'M':
      return `bg-amber-100 border-amber-200 text-amber-800`;
    case 'H':
      return `bg-pink-100 border-pink-200 text-pink-800`;
    case 'C':
      return `bg-red-100 border-red-200 text-red-800`;
    default:
      return ``;
  }
};
