import { describe, expect, it } from "vitest";
import { status } from "./board";
import { LEVELS, LEVEL_COUNT, levelSeed, levelSpec } from "./levels";
import { replay, solve } from "./solver";

describe("level ladder", () => {
  it("has 60 levels", () => {
    expect(LEVELS).toHaveLength(LEVEL_COUNT);
    expect(LEVEL_COUNT).toBe(60);
  });

  it("rises in colour count and layers as specified", () => {
    const expectedColours = (i: number) =>
      i <= 10 ? 2 : i <= 25 ? 3 : i <= 40 ? 4 : i <= 52 ? 5 : 6;
    const expectedLayers = (i: number) => {
      if (i <= 10) return i <= 5 ? 2 : 3;
      if (i <= 25) return i <= 18 ? 3 : 4;
      if (i <= 40) return i <= 33 ? 4 : 5;
      if (i <= 52) return i <= 47 ? 5 : 6;
      return 6;
    };
    for (let i = 1; i <= LEVEL_COUNT; i++) {
      const spec = levelSpec(i);
      expect(spec).toEqual({ colours: expectedColours(i), layers: expectedLayers(i) });
      const board = LEVELS[i - 1]!;
      expect(board.plates).toHaveLength(spec.layers);
      expect(new Set(board.boxes.map((box) => box.queue[0])).size).toBe(spec.colours);
    }
  });

  it("uses a distinct fixed seed per level", () => {
    const seeds = Array.from({ length: LEVEL_COUNT }, (_, i) => levelSeed(i + 1));
    expect(new Set(seeds).size).toBe(LEVEL_COUNT);
    expect(levelSeed(1)).toBe(1042);
  });

  it("rejects out-of-range level numbers", () => {
    expect(() => levelSpec(0)).toThrow();
    expect(() => levelSpec(61)).toThrow();
  });

  // CI smoke test: every level must be solvable, and the solution must win when replayed.
  it.each(Array.from({ length: LEVEL_COUNT }, (_, i) => i + 1))("level %i is solvable", (index) => {
    const board = LEVELS[index - 1]!;
    const taps = solve(board);
    expect(taps, `level ${index} has no solution`).not.toBeNull();
    expect(status(replay(board, taps!))).toBe("won");
  });
});
