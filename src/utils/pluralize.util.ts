export const pluralize = (count: number, singularForm: string) => {
  return count === 1 ? singularForm : `${singularForm}s`;
};
