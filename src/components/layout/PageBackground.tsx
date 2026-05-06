import { useEffect, useState } from 'react';

const BG_URL = '/page-bg.jpeg';

// Module-level cache: once loaded in this session, subsequent navigations show instantly.
let bgLoaded = false;
const listeners = new Set<() => void>();

function preloadBg() {
  if (bgLoaded) return;
  const img = new Image();
  img.decoding = 'async';
  img.src = BG_URL;
  const done = () => {
    bgLoaded = true;
    listeners.forEach((fn) => fn());
    listeners.clear();
  };
  if (img.complete && img.naturalWidth > 0) {
    done();
  } else {
    img.onload = done;
    img.onerror = done;
  }
}

// Kick off preload as soon as this module is imported.
if (typeof window !== 'undefined') {
  preloadBg();
}

/**
 * Page-scoped background image with dark overlay.
 * - Preloads the image and caches load state across navigations.
 * - Shows a low-quality blurred placeholder until full image is ready.
 * - Fades in smoothly with no layout shift.
 */
export function PageBackground() {
  const [loaded, setLoaded] = useState(bgLoaded);

  useEffect(() => {
    if (bgLoaded) {
      setLoaded(true);
      return;
    }
    const onReady = () => setLoaded(true);
    listeners.add(onReady);
    preloadBg();
    return () => {
      listeners.delete(onReady);
    };
  }, []);

  return (
    <>
      {/* Solid base color to prevent flash */}
      <div
        aria-hidden
        className="fixed inset-0 -z-30 pointer-events-none bg-[#0A0A0A]"
      />
      {/* Blurred low-quality placeholder (CSS gradient approximation) */}
      <div
        aria-hidden
        className="fixed inset-0 -z-25 pointer-events-none transition-opacity duration-500"
        style={{
          opacity: loaded ? 0 : 1,
          background:
            'radial-gradient(circle at 30% 20%, #2C2C2E 0%, #1A1A1A 40%, #121212 70%, #0A0A0A 100%)',
          filter: 'blur(20px)',
          transform: 'scale(1.05)',
        }}
      />
      {/* Full background image, fades in once loaded */}
      <div
        aria-hidden
        className="fixed inset-0 -z-20 pointer-events-none bg-cover bg-center bg-no-repeat transition-opacity duration-500 ease-out"
        style={{
          backgroundImage: `url('${BG_URL}')`,
          opacity: loaded ? 1 : 0,
        }}
      />
      {/* Dark overlay for readability */}
      <div
        aria-hidden
        className="fixed inset-0 -z-10 pointer-events-none"
        style={{ background: 'rgba(0,0,0,0.5)' }}
      />
    </>
  );
}
