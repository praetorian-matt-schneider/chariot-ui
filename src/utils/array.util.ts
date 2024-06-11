export const partition = <T>(
  arr: T[] = [],
  partitionFn: (current: T) => boolean
): [T[], T[]] => {
  return arr.reduce<[T[], T[]]>(
    ([pass, fail], elem) => {
      return partitionFn(elem)
        ? [[...pass, elem], fail]
        : [pass, [...fail, elem]];
    },
    [[], []]
  );
};
