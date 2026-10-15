import type { Board } from "./board";
import { generateLevel } from "./generate";

/** Mid-range difficulty for the daily board. */
export const DAILY_OPTIONS = { colours: 4, layers: 5 } as const;

/** UTC date as a number, YYYYMMDD. Same date, same seed, on every device. */
export function getDailySeed(date: Date = new Date()): number {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  return year * 10000 + month * 100 + day;
}

/** Today's board, using the UTC date as the seed. */
export function getDailyLevel(date: Date = new Date()): Board {
  return generateLevel(getDailySeed(date), DAILY_OPTIONS);
}
