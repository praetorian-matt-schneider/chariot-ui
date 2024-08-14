import React, { useEffect, useRef, useState } from 'react';
import * as flubber from 'flubber';

const MorphingButton: React.FC = () => {
  const [stage, setStage] = useState(0); // Track the current stage
  const [isAnimating, setIsAnimating] = useState(false);
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const originalPaths = [
    ['M5 12h14', 'M12 5v14'], // Plus icon
    [
      'M12 22v-9',
      'M15.17 2.21a1.67 1.67 0 0 1 1.63 0L21 4.57a1.93 1.93 0 0 1 0 3.36L8.82 14.79a1.655 1.655 0 0 1-1.64 0L3 12.43a1.93 1.93 0 0 1 0-3.36z',
      'M20 13v3.87a2.06 2.06 0 0 1-1.11 1.83l-6 3.08a1.93 1.93 0 0 1-1.78 0l-6-3.08A2.06 2.06 0 0 1 4 16.87V13',
      'M21 12.43a1.93 1.93 0 0 0 0-3.36L8.83 2.2a1.64 1.64 0 0 0-1.63 0L3 4.57a1.93 1.93 0 0 0 0 3.36l12.18 6.86a1.636 1.636 0 0 0 1.63 0z',
    ], // Package Open icon
    [
      'm7.5 4.27 9 5.15',
      'M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z',
      'm3.3 7 8.7 5 8.7-5',
      'M12 22V12',
    ], // Package icon
  ];

  const maxLength = Math.max(...originalPaths.map(paths => paths.length));

  // Normalize the path count for each icon
  const paths = originalPaths.map(pathGroup => {
    const adjustedPaths = [...pathGroup];
    while (adjustedPaths.length < maxLength) {
      adjustedPaths.push(pathGroup[pathGroup.length - 1]);
    }
    return adjustedPaths;
  });

  const animateStage = (
    fromStage: number,
    toStage: number,
    onComplete: () => void
  ) => {
    const fromPaths = paths[fromStage];
    const toPaths = paths[toStage];

    const interpolators = fromPaths.map((fromPath, i) =>
      flubber.interpolate(fromPath, toPaths[i])
    );
    const duration = 300; // Slower transition
    const start = performance.now();

    const animate = (timestamp: number) => {
      const progress = Math.min((timestamp - start) / duration, 1);

      interpolators.forEach((interpolator, i) => {
        if (pathRefs.current[i]) {
          pathRefs.current[i]!.setAttribute('d', interpolator(progress));
        }
      });

      // Subtle motion blur during the transition
      if (svgRef.current) {
        const blurAmount = 1 - progress; // Very subtle blur
        svgRef.current.style.filter =
          progress < 1 ? `blur(${blurAmount}px)` : 'none';
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        onComplete();
      }
    };

    requestAnimationFrame(animate);
  };

  const handleClick = () => {
    if (isAnimating) return;
    setIsAnimating(true);

    if (stage === 0) {
      // Transition from plus to package-open
      animateStage(0, 1, () => {
        setStage(1);
        setIsAnimating(false);
      });
    } else if (stage === 1) {
      // Transition from package-open to package and then shoot out
      animateStage(1, 2, () => {
        setStage(2);
        setTimeout(() => {
          triggerShootOut();
        }, 500);
      });
    }
  };

  const triggerShootOut = () => {
    if (svgRef.current) {
      const start = performance.now();
      const duration = 800;
      const initialX = 0;
      const initialY = 0;
      const finalX = -50;
      const finalY = 150;
      const peakHeight = -100; // Height of the arc

      const animate = (timestamp: number) => {
        const progress = Math.min((timestamp - start) / duration, 1);

        // Calculate the position along the parabolic curve
        const x = initialX + progress * finalX;
        const y =
          initialY + progress * (finalY + peakHeight * (1 - progress) * 2);

        const rotation = progress * -45; // Rotate as it moves

        svgRef.current!.style.transform = `translate(${x}px, ${y}px) rotate(${rotation}deg) scale(${1 - progress * 0.5})`;

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          // Reset to the initial stage
          setStage(0);
          reset();
          setIsAnimating(false);
          svgRef.current!.style.transition = '';
          svgRef.current!.style.transform = '';
        }
      };

      requestAnimationFrame(animate);
    }
  };

  const reset = () => {
    // Initialize with the first icon's paths
    paths[0].forEach((d, index) => {
      if (pathRefs.current[index]) {
        pathRefs.current[index]!.setAttribute('d', d);
      }
    });
  };

  useEffect(() => {
    reset();
  }, []);

  return (
    <div>
      <button onClick={handleClick} className="rounded bg-brand p-2 text-white">
        <svg
          ref={svgRef}
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {Array(maxLength)
            .fill(null)
            .map((_, index) => (
              <path key={index} ref={el => (pathRefs.current[index] = el)} />
            ))}
        </svg>
      </button>
    </div>
  );
};

export default MorphingButton;
