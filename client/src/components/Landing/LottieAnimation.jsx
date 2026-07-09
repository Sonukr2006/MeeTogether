import { useEffect, useRef } from 'react';
import lottie from 'lottie-web';

/**
 * LottieAnimation - Renders Lottie animation using lottie-web directly.
 * This avoids the lottie-react ESM interop issues with Vite.
 */
const LottieAnimation = ({ animationData, fallback, ariaLabel, className, loop = true }) => {
  const containerRef = useRef(null);
  const animInstanceRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !animationData) return;

    animInstanceRef.current = lottie.loadAnimation({
      container: containerRef.current,
      renderer: 'svg',
      loop,
      autoplay: true,
      animationData,
    });

    return () => {
      if (animInstanceRef.current) {
        animInstanceRef.current.destroy();
        animInstanceRef.current = null;
      }
    };
  }, [animationData, loop]);

  if (!animationData) {
    return (
      <div aria-label={ariaLabel} role="img" className={className}>
        {fallback}
      </div>
    );
  }

  return (
    <div aria-label={ariaLabel} role="img" className={className}>
      <div ref={containerRef} />
    </div>
  );
};

export default LottieAnimation;
