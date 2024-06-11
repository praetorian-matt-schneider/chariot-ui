import { useState } from 'react';

export const useInterval = (interval = 2000) => {
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout>();

  function start(fn: () => void) {
    stop();
    const newIntervalId = setInterval(() => {
      typeof fn === 'function' && fn();
    }, interval);
    setIntervalId(newIntervalId);
  }

  function stop() {
    intervalId && clearInterval(intervalId);
  }

  return { start, stop };
};
