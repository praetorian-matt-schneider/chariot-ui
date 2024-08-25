import { useEffect, useRef, useState } from 'react';

export function isArrayBufferEmpty(arrayBuffer: ArrayBuffer) {
  // Convert the ArrayBuffer to a Uint8Array
  const uint8Array = new Uint8Array(arrayBuffer);

  // Convert the Uint8Array to a string
  const string = new TextDecoder().decode(uint8Array);

  // Check if the string is empty
  return string === '' || string === `""`;
}

export const abbreviateNumber = (value: number) => {
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

export function useGetStickyHeight(offset: number = 0) {
  const containerRef = useRef<HTMLDivElement>(null);

  const [stickyTopHeight, setstickyTopHeight] = useState(0);

  function getStickyElements() {
    const allElements = Array.prototype.slice.call(
      document.querySelectorAll('.sticky')
    ) as Element[];
    const topElemets = allElements.filter(function (element) {
      return !containerRef.current?.contains(element);
    });

    return topElemets;
  }

  function getStickyElementsHeight() {
    const stickyElements = getStickyElements();

    const topHeight = stickyElements.reduce((acc, element) => {
      return acc + element.clientHeight;
    }, 0);

    setstickyTopHeight(topHeight + offset);
  }

  useEffect(() => {
    const stickElements = getStickyElements();

    stickElements.forEach(element => {
      const observer = new MutationObserver(getStickyElementsHeight);

      observer.observe(element, {
        attributes: true,
        childList: true,
        subtree: true,
      });

      window.addEventListener('resize', getStickyElementsHeight);
    });
  }, []);

  return {
    ref: containerRef,
    stickyTopHeight,
  };
}
