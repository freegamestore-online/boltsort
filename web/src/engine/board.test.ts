import { describe, expect, it } from "vitest";
import { type Board, status, tap } from "./board";

function board(overrides: Partial<Board> = {}): Board {
  return {
    plates: [{ screws: ["red", "blue"] }],
    boxes: [{ queue: ["red"], filled: 0 }],
    tray: [],
    trayCapacity: 3,
    ...overrides,
  };
}

describe("screw rules", () => {
  it("drops a screw into the matching box slot", () => {
    const next = tap(board(), 0);
    expect(next.boxes[0]).toEqual({ queue: ["red"], filled: 1 });
    expect(next.tray).toEqual([]);
  });

  it("sends a screw to the tray when no box matches", () => {
    const next = tap(board(), 1);
    expect(next.tray).toEqual(["blue"]);
    expect(next.boxes[0]).toEqual({ queue: ["red"], filled: 0 });
  });

  it("sends a screw to the tray when the matching box is past its colours", () => {
    const next = tap(board({ boxes: [{ queue: [], filled: 0 }] }), 0);
    expect(next.tray).toEqual(["red"]);
  });

  it("does not mutate the input board", () => {
    const start = board();
    const snapshot = structuredClone(start);
    tap(start, 0);
    expect(start).toEqual(snapshot);
  });

  it("rejects an index that is not on the active plate", () => {
    expect(() => tap(board(), 2)).toThrow();
    expect(() => tap(board(), -1)).toThrow();
  });
});

describe("box rules", () => {
  it("clears a full box and advances to the next colour in its queue", () => {
    let current = board({
      plates: [{ screws: ["red", "red", "red", "blue", "blue", "blue"] }],
      boxes: [{ queue: ["red", "blue"], filled: 0 }],
    });
    for (let i = 0; i < 3; i++) current = tap(current, 0);
    expect(current.boxes[0]).toEqual({ queue: ["blue"], filled: 0 });
    expect(current.tray).toEqual([]);
  });

  it("fills the first box that accepts the colour", () => {
    const next = tap(
      board({
        boxes: [
          { queue: ["blue"], filled: 0 },
          { queue: ["red"], filled: 2 },
        ],
      }),
      0,
    );
    // The second box was one screw short, so this red completes it and it advances past red.
    expect(next.boxes).toEqual([
      { queue: ["blue"], filled: 0 },
      { queue: [], filled: 0 },
    ]);
  });
});

describe("plate rules", () => {
  it("drops a plate once its last screw is removed and activates the next one", () => {
    const start = board({
      plates: [{ screws: ["blue"] }, { screws: ["red"] }],
    });
    const next = tap(start, 0);
    expect(next.plates).toEqual([{ screws: ["red"] }]);
  });

  it("keeps the plate while it still has screws", () => {
    const next = tap(board({ plates: [{ screws: ["red", "blue"] }, { screws: ["blue"] }] }), 0);
    expect(next.plates).toEqual([{ screws: ["blue"] }, { screws: ["blue"] }]);
  });
});

describe("win and lose", () => {
  it("is won when every plate is cleared", () => {
    const next = tap(board({ plates: [{ screws: ["red"] }] }), 0);
    expect(status(next)).toBe("won");
  });

  it("is lost when the tray reaches capacity", () => {
    const start = board({ tray: ["blue", "blue"], trayCapacity: 3 });
    const next = tap(start, 1);
    expect(next.tray).toHaveLength(3);
    expect(status(next)).toBe("lost");
  });

  it("is lost even if the last screw also empties the board", () => {
    const start = board({
      plates: [{ screws: ["blue"] }],
      boxes: [],
      tray: ["red", "red"],
      trayCapacity: 3,
    });
    expect(status(tap(start, 0))).toBe("lost");
  });

  it("refuses moves after the game is over", () => {
    expect(() => tap(board({ tray: ["blue", "blue", "blue"], trayCapacity: 3 }), 0)).toThrow();
  });
});
