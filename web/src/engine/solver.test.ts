import { describe, expect, it } from "vitest";
import { type Board, status, tap } from "./board";
import { replay, solve } from "./solver";

// The first box accepts reds, then blues. Tapping index 0 (blue) first would
// push it into the tray and lose, so the solver has to start with a red.
const orderSensitive: Board = {
  plates: [{ screws: ["blue", "red", "red", "red", "blue", "blue"] }],
  boxes: [{ queue: ["red", "blue"], filled: 0 }],
  tray: [],
  trayCapacity: 1,
};

// One loose blue screw, but no box and no room in the tray for two.
const unsolvable: Board = {
  plates: [{ screws: ["red", "blue"] }],
  boxes: [{ queue: ["red"], filled: 0 }],
  tray: [],
  trayCapacity: 1,
};

describe("solve", () => {
  it("finds a winning order when the naive order loses", () => {
    expect(status(tap(orderSensitive, 0))).toBe("lost");

    const taps = solve(orderSensitive);
    expect(taps).not.toBeNull();
    expect(status(replay(orderSensitive, taps!))).toBe("won");
    expect(orderSensitive.plates[0]!.screws[taps![0]!]).toBe("red");
  });

  it("returns null for a board that cannot be won", () => {
    expect(solve(unsolvable)).toBeNull();
  });

  it("returns an empty path for a board already cleared", () => {
    expect(solve({ plates: [], boxes: [], tray: [], trayCapacity: 1 })).toEqual([]);
  });

  it("is deterministic", () => {
    expect(solve(orderSensitive)).toEqual(solve(orderSensitive));
  });
});

describe("replay", () => {
  it("applies taps in order", () => {
    // Taking index 1 three times removes the three reds (the list shifts each time).
    const after = replay(orderSensitive, [1, 1, 1]);
    expect(after.boxes[0]).toEqual({ queue: ["blue"], filled: 0 });
    expect(after.plates[0]!.screws).toEqual(["blue", "blue", "blue"]);
  });
});
