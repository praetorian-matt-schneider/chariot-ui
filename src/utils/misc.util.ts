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
    function setIsSmallScreenFn() {
      setScreenSize(window.innerWidth);
    }
    window.addEventListener('resize', setIsSmallScreenFn);
    setIsSmallScreenFn();
  }, []);

  return screenSize;
}
