import { useEffect, useState } from 'react';

export function isArrayBufferEmpty(arrayBuffer: ArrayBuffer) {
  // Convert the ArrayBuffer to a Uint8Array
  const uint8Array = new Uint8Array(arrayBuffer);

  // Convert the Uint8Array to a string
  const string = new TextDecoder().decode(uint8Array);

  // Check if the string is empty
  return string === '' || string === `""`;
}

export const abbreviateNumber = (value: number) => {
  if (value < 1000) return value;

  const suffixes = ['', 'k', 'm', 'b', 't'];
  const suffixNum = Math.floor(('' + value).length / 3);
  let shortValue = parseFloat(
    (suffixNum != 0 ? value / Math.pow(1000, suffixNum) : value).toPrecision(2)
  );
  if (shortValue % 1 != 0) {
    shortValue = Number(shortValue.toFixed(1));
  }
  return shortValue + suffixes[suffixNum];
};

export function useGetScreenSize() {
  const [screenSize, setScreenSize] = useState(window.innerWidth);

  useEffect(() => {
    function setScreenSizeFn() {
      setScreenSize(window.innerWidth);
    }
    window.addEventListener('resize', setScreenSizeFn);
    setScreenSizeFn();
  }, []);

  const size =
    screenSize < BREAKPOINTS.sm
      ? 'sm'
      : screenSize < BREAKPOINTS.md
        ? 'md'
        : screenSize < BREAKPOINTS.lg
          ? 'lg'
          : screenSize < BREAKPOINTS.xl
            ? 'xl'
            : '2xl';

  return {
    maxSm: screenSize < BREAKPOINTS.sm,
    maxMd: screenSize < BREAKPOINTS.md,
    maxLg: screenSize < BREAKPOINTS.lg,
    maxXl: screenSize < BREAKPOINTS.xl,
    max2xl: screenSize >= BREAKPOINTS['2xl'],
    size,
  };
}

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};
