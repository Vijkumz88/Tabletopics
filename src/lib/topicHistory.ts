import { allTopics } from '@/lib/topics';

type Difficulty = keyof typeof allTopics;

const STORAGE_KEYS: Record<Difficulty, string> = {
  easy:   'speechninja_seen_easy',
  medium: 'speechninja_seen_medium',
  hard:   'speechninja_seen_hard',
};

/**
 * Returns the array of topic strings already seen for a given difficulty.
 * Falls back to an empty array if localStorage is unavailable (e.g. private browsing).
 */
export function getSeenTopics(difficulty: Difficulty): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS[difficulty]);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

/**
 * Adds a topic to the persisted seen list for a given difficulty.
 * Silently no-ops if localStorage is unavailable.
 */
export function markTopicAsSeen(difficulty: Difficulty, topic: string): void {
  try {
    const seen = getSeenTopics(difficulty);
    if (!seen.includes(topic)) {
      seen.push(topic);
      localStorage.setItem(STORAGE_KEYS[difficulty], JSON.stringify(seen));
    }
  } catch {
    // localStorage unavailable — graceful no-op
  }
}

/**
 * Clears the seen list for a given difficulty.
 * Called automatically when all topics have been exhausted (auto-reset).
 */
export function clearSeenTopics(difficulty: Difficulty): void {
  try {
    localStorage.removeItem(STORAGE_KEYS[difficulty]);
  } catch {
    // localStorage unavailable — graceful no-op
  }
}
