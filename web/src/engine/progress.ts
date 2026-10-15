// Star ratings and overall progress, kept in localStorage.

const STARS_PREFIX = "boltsort_stars_";
const PROGRESS_KEY = "boltsort_progress";

export interface Progress {
  /** Levels with at least one star. */
  completed: number;
  totalStars: number;
}

const EMPTY: Progress = { completed: 0, totalStars: 0 };

function readProgress(): Progress {
  const raw = localStorage.getItem(PROGRESS_KEY);
  if (!raw) return { ...EMPTY };
  try {
    const parsed = JSON.parse(raw) as Partial<Progress>;
    return {
      completed: Number.isInteger(parsed.completed) ? parsed.completed! : 0,
      totalStars: Number.isInteger(parsed.totalStars) ? parsed.totalStars! : 0,
    };
  } catch {
    return { ...EMPTY };
  }
}

/** Save 1 to 3 stars for a level. Stars never go down, so a replay only ever raises the best. */
export function saveStars(levelIndex: number, stars: number): void {
  if (!Number.isInteger(stars) || stars < 1 || stars > 3) throw new Error("stars must be 1 to 3");
  const previous = getStars(levelIndex);
  if (stars <= previous) return;

  localStorage.setItem(`${STARS_PREFIX}${levelIndex}`, String(stars));
  const progress = readProgress();
  localStorage.setItem(
    PROGRESS_KEY,
    JSON.stringify({
      completed: progress.completed + (previous === 0 ? 1 : 0),
      totalStars: progress.totalStars + stars - previous,
    }),
  );
}

/** Stars saved for a level, or 0 if it has not been completed. */
export function getStars(levelIndex: number): number {
  const stars = Number(localStorage.getItem(`${STARS_PREFIX}${levelIndex}`));
  return Number.isInteger(stars) && stars >= 1 && stars <= 3 ? stars : 0;
}

export function getProgress(): Progress {
  return readProgress();
}
