export const capitalize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export function appendPeriodIfMissing(error: string) {
  const endsWithDot = error.endsWith('.');

  return error + (endsWithDot ? '' : '.');
}
