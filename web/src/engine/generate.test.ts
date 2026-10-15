import { describe, expect, it } from "vitest";
import { BOX_SIZE, status } from "./board";
import { generateLevel } from "./generate";
import { replay, solve } from "./solver";

describe("generateLevel", () => {
  it("is deterministic for a seed", () => {
    expect(generateLevel(7)).toEqual(generateLevel(7));
    expect(generateLevel(7)).not.toEqual(generateLevel(8));
  });

  it("has screws that match the boxes exactly", () => {
    const level = generateLevel(3, { colours: 2, fills: 2 });
    const screws = level.plates.flatMap((plate) => plate.screws).sort();
    // Each queue entry is one full box, so it stands for BOX_SIZE screws.
    const expected = level.boxes.flatMap((box) => box.queue.flatMap((colour) => Array(BOX_SIZE).fill(colour))).sort();
    expect(screws).toEqual(expected);
  });

  it("deals screws into the requested number of layers", () => {
    expect(generateLevel(5, { layers: 4 }).plates).toHaveLength(4);
  });

  it.each(Array.from({ length: 25 }, (_, i) => i + 1))("seed %i is solvable", (seed) => {
    const level = generateLevel(seed, { colours: 2 + (seed % 3), fills: 1 + (seed % 3), layers: 2 + (seed % 4) });
    const taps = solve(level);
    expect(taps).not.toBeNull();
    expect(status(replay(level, taps!))).toBe("won");
  });
});
