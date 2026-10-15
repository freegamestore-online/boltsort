import { describe, expect, it } from "vitest";
import { type Board, status } from "./board";
import { LEVELS } from "./levels";
import { EXTRA_SLOT_BONUS, HINT_LIMIT, UNDO_LIMIT, createSession, hint, tapScrew, undo, useExtraSlot } from "./session";
import { solve } from "./solver";

// Two screws, tray of one: the second screw loses the level.
const tight: Board = {
  plates: [{ screws: ["red", "blue"] }],
  boxes: [{ queue: ["red"], filled: 0 }],
  tray: [],
  trayCapacity: 1,
};

describe("undo", () => {
  it("restores the board from before the last tap", () => {
    const start = createSession(tight);
    const after = tapScrew(start, 1);
    expect(after.board.tray).toEqual(["blue"]);

    const back = undo(after);
    expect(back.board).toEqual(tight);
    expect(back.history).toEqual([]);
    expect(back.undosLeft).toBe(UNDO_LIMIT - 1);
  });

  it("brings a lost level back to playing", () => {
    const lost = tapScrew(createSession(tight), 1);
    expect(status(lost.board)).toBe("lost");
    expect(status(undo(lost).board)).toBe("playing");
  });

  it("is limited per level", () => {
    let session = createSession(LEVELS[0]!);
    for (let i = 0; i < UNDO_LIMIT; i++) session = undo(tapScrew(session, 0));
    expect(() => undo(tapScrew(session, 0))).toThrow("no undos left");
  });

  it("throws with nothing to undo", () => {
    expect(() => undo(createSession(tight))).toThrow("nothing to undo");
  });

  it("keeps an extra slot when undoing", () => {
    const boosted = useExtraSlot(tapScrew(createSession(tight), 0));
    const back = undo(boosted);
    expect(back.board.trayCapacity).toBe(tight.trayCapacity + EXTRA_SLOT_BONUS);
  });
});

describe("extra tray slot", () => {
  it("adds one tray slot, once per level", () => {
    const boosted = useExtraSlot(createSession(tight));
    expect(boosted.board.trayCapacity).toBe(tight.trayCapacity + 1);
    expect(boosted.extraSlotsLeft).toBe(0);
    expect(() => useExtraSlot(boosted)).toThrow("no extra slots left");
  });

  it("rescues a level that would otherwise be lost", () => {
    const lost = tapScrew(createSession(tight), 1);
    expect(status(lost.board)).toBe("lost");
    expect(status(useExtraSlot(lost).board)).toBe("playing");
  });

  it("cannot be used once the level is won", () => {
    const won = tapScrew(createSession({ ...tight, plates: [{ screws: ["red"] }] }), 0);
    expect(status(won.board)).toBe("won");
    expect(() => useExtraSlot(won)).toThrow("already won");
  });
});

describe("hint", () => {
  it("points at a screw that keeps the level winnable", () => {
    const start = createSession(LEVELS[0]!);
    const { session, screwIndex } = hint(start);
    expect(screwIndex).not.toBeNull();
    expect(session.hintsLeft).toBe(HINT_LIMIT - 1);
    expect(solve(tapScrew(start, screwIndex!).board)).not.toBeNull();
  });

  it("does not change the board", () => {
    const start = createSession(LEVELS[0]!);
    const { session } = hint(start);
    expect(session.board).toEqual(start.board);
  });

  it("is limited per level", () => {
    let session = createSession(LEVELS[0]!);
    for (let i = 0; i < HINT_LIMIT; i++) session = hint(session).session;
    expect(() => hint(session)).toThrow("no hints left");
  });

  it("is not spent when the level is already won", () => {
    const won = tapScrew(createSession({ ...tight, plates: [{ screws: ["red"] }] }), 0);
    const result = hint(won);
    expect(result.screwIndex).toBeNull();
    expect(result.session.hintsLeft).toBe(HINT_LIMIT);
  });
});

describe("helpers keep levels solvable", () => {
  it.each(LEVELS.map((_, i) => i + 1))("level %i: following hints wins", (index) => {
    // Raise the cap: this checks solvability, not the per-level limit.
    let session = { ...createSession(LEVELS[index - 1]!), hintsLeft: 1000 };
    for (let step = 0; step < 200 && status(session.board) === "playing"; step++) {
      const result = hint(session);
      if (result.screwIndex === null) break;
      session = tapScrew(result.session, result.screwIndex);
    }
    expect(status(session.board)).toBe("won");
  });

  it.each(LEVELS.map((_, i) => i + 1))("level %i: an extra slot never makes it unsolvable", (index) => {
    const boosted = useExtraSlot(createSession(LEVELS[index - 1]!)).board;
    expect(solve(boosted)).not.toBeNull();
  });

  it.each(LEVELS.map((_, i) => i + 1))("level %i: undo returns to a solvable board", (index) => {
    const board = LEVELS[index - 1]!;
    const first = solve(board)![0]!;
    const back = undo(tapScrew(createSession(board), first));
    expect(solve(back.board)).not.toBeNull();
  });
});
