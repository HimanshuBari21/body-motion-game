import { useEffect } from 'react';

/**
 * Binds keyboard (Space / ArrowUp) and touch/click input to the given `onFlap` callback.
 * Cleans up listeners on unmount.
 */
export function useGameInput(onFlap: () => void) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        onFlap();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onFlap]);
}
