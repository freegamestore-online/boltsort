import { describe, expect, it } from "vitest";
import { status } from "./board";
import { getDailyLevel, getDailySeed } from "./daily";
import { replay, solve } from "./solver";

describe("getDailySeed", () => {
  it("returns the UTC date as YYYYMMDD", () => {
    expect(getDailySeed(new Date(Date.UTC(2026, 0, 1)))).toBe(20260101);
    expect(getDailySeed(new Date(Date.UTC(2026, 11, 31, 23, 59)))).toBe(20261231);
  });

  it("uses the UTC date, not the local one, near midnight", () => {
    // 23:30 UTC on Jan 1 is still Jan 1 UTC in every timezone's calendar at that instant.
    expect(getDailySeed(new Date("2026-01-01T23:30:00Z"))).toBe(20260101);
  });
});

describe("getDailyLevel", () => {
  it("returns a valid board with the mid-range difficulty", () => {
    const board = getDailyLevel(new Date("2026-01-01T12:00:00Z"));
    expect(board.plates).toHaveLength(5);
    expect(new Set(board.boxes.map((box) => box.queue[0])).size).toBe(4);
  });

  it("gives the same board for the same UTC date", () => {
    const a = getDailyLevel(new Date("2026-01-01T00:00:00Z"));
    const b = getDailyLevel(new Date("2026-01-01T23:59:59Z"));
    expect(a).toEqual(b);
    expect(a.plates.flatMap((p) => p.screws)).toHaveLength(b.plates.flatMap((p) => p.screws).length);
  });

  it("gives a different board on a different date", () => {
    expect(getDailyLevel(new Date("2026-01-01T12:00:00Z"))).not.toEqual(
      getDailyLevel(new Date("2026-01-02T12:00:00Z")),
    );
  });

  it("is solvable", () => {
    const board = getDailyLevel(new Date("2026-01-01T12:00:00Z"));
    const taps = solve(board);
    expect(taps).not.toBeNull();
    expect(status(replay(board, taps!))).toBe("won");
  });
});
