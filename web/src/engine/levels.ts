import type { Board } from "./board";
import { generateLevel } from "./generate";

export const LEVEL_COUNT = 60;

export interface LevelSpec {
  colours: number;
  layers: number;
}

/**
 * Difficulty ladder for levels 1 to 60. Colours step up in bands; layers climb
 * within each band.
 */
export function levelSpec(levelIndex: number): LevelSpec {
  if (!Number.isInteger(levelIndex) || levelIndex < 1 || levelIndex > LEVEL_COUNT) {
    throw new Error(`level must be 1 to ${LEVEL_COUNT}`);
  }
  if (levelIndex <= 10) return { colours: 2, layers: levelIndex <= 5 ? 2 : 3 };
  if (levelIndex <= 25) return { colours: 3, layers: levelIndex <= 18 ? 3 : 4 };
  if (levelIndex <= 40) return { colours: 4, layers: levelIndex <= 33 ? 4 : 5 };
  if (levelIndex <= 52) return { colours: 5, layers: levelIndex <= 47 ? 5 : 6 };
  return { colours: 6, layers: 6 };
}

/** Fixed seed per level, so every client gets the same board. */
export function levelSeed(levelIndex: number): number {
  return levelIndex * 1000 + 42;
}

export function levelBoard(levelIndex: number): Board {
  const { colours, layers } = levelSpec(levelIndex);
  return generateLevel(levelSeed(levelIndex), { colours, layers });
}

/** Levels in order. `LEVELS[0]` is level 1. Each one is solver-checked in levels.test.ts. */
export const LEVELS: Board[] = Array.from({ length: LEVEL_COUNT }, (_, i) => levelBoard(i + 1));
