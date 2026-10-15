import { BOX_SIZE, type Board, type Colour, type Plate } from "./board";

const COLOURS: Colour[] = ["red", "blue", "green", "amber", "violet", "teal"];

/** Small seeded PRNG (mulberry32). Same seed, same sequence. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface LevelOptions {
  /** Number of colours, 1 to 6. */
  colours?: number;
  /** Full box fills per colour. Each colour has `fills * BOX_SIZE` screws. */
  fills?: number;
  /** Screws per plate. */
  plateSize?: number;
  trayCapacity?: number;
}

/**
 * Deterministic level from a seed. Each colour gets one box that accepts
 * exactly its screws, so every level is winnable by construction. The solver
 * tests check that independently.
 */
export function generateLevel(seed: number, options: LevelOptions = {}): Board {
  const colourCount = options.colours ?? 3;
  const fills = options.fills ?? 2;
  const plateSize = options.plateSize ?? 4;
  const trayCapacity = options.trayCapacity ?? 5;
  if (colourCount < 1 || colourCount > COLOURS.length) throw new Error("colours out of range");

  const rand = mulberry32(seed);
  const colours = COLOURS.slice(0, colourCount);
  const screws: Colour[] = colours.flatMap((colour) => Array<Colour>(fills * BOX_SIZE).fill(colour));

  // Fisher-Yates shuffle with the seeded PRNG.
  for (let i = screws.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [screws[i], screws[j]] = [screws[j]!, screws[i]!];
  }

  const plates: Plate[] = [];
  for (let i = 0; i < screws.length; i += plateSize) {
    plates.push({ screws: screws.slice(i, i + plateSize) });
  }

  const boxes = colours.map((colour) => ({ queue: Array<Colour>(fills).fill(colour), filled: 0 }));

  return { plates, boxes, tray: [], trayCapacity };
}
