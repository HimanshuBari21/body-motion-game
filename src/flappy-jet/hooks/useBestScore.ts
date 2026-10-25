import { useState, useCallback } from 'react';
import { BEST_SCORE_KEY } from '../utils/constants';

/**
 * Reads the best score from localStorage on mount.
 * Returns `0` if the key is missing, corrupt, or localStorage is unavailable.
 */
function readBestScore(): number {
  try {
    const raw = localStorage.getItem(BEST_SCORE_KEY);
    if (raw === null) return 0;
    const parsed = parseInt(raw, 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  } catch {
    // localStorage can throw in private browsing / sandboxed iframes
    return 0;
  }
}

/**
 * Persists a score to localStorage. Silently fails if storage is unavailable.
 */
function writeBestScore(score: number): void {
  try {
    localStorage.setItem(BEST_SCORE_KEY, String(score));
  } catch {
    // noop — best score is cosmetic, not critical
  }
}

/**
 * Hook that manages the persisted best-score value.
 *
 * Returns the current best and a callback that accepts a new score
 * and updates only if it's a new high-score.
 */
export function useBestScore() {
  const [bestScore, setBestScore] = useState(readBestScore);

  const submitScore = useCallback(
    (score: number) => {
      if (score > bestScore) {
        setBestScore(score);
        writeBestScore(score);
      }
    },
    [bestScore],
  );

  return { bestScore, submitScore } as const;
}
