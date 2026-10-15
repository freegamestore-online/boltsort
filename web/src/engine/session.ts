import { type Board, status, tap } from "./board";
import { solve } from "./solver";

/** Helper uses allowed per level. */
export const UNDO_LIMIT = 3;
export const HINT_LIMIT = 3;
export const EXTRA_SLOT_LIMIT = 1;
/** Tray slots added by the extra-slot helper. */
export const EXTRA_SLOT_BONUS = 1;

/** One level in progress. Board snapshots are immutable, so history can hold them directly. */
export interface Session {
  board: Board;
  /** Board before each tap, oldest first. */
  history: Board[];
  undosLeft: number;
  hintsLeft: number;
  extraSlotsLeft: number;
}

export function createSession(board: Board): Session {
  return {
    board,
    history: [],
    undosLeft: UNDO_LIMIT,
    hintsLeft: HINT_LIMIT,
    extraSlotsLeft: EXTRA_SLOT_LIMIT,
  };
}

export function tapScrew(session: Session, screwIndex: number): Session {
  return {
    ...session,
    board: tap(session.board, screwIndex),
    history: [...session.history, session.board],
  };
}

/**
 * Restore the board from before the last tap. Keeps the current tray capacity,
 * so an extra slot is not lost by undoing.
 */
export function undo(session: Session): Session {
  if (session.undosLeft <= 0) throw new Error("no undos left");
  const previous = session.history[session.history.length - 1];
  if (!previous) throw new Error("nothing to undo");
  return {
    ...session,
    board: { ...previous, trayCapacity: session.board.trayCapacity },
    history: session.history.slice(0, -1),
    undosLeft: session.undosLeft - 1,
  };
}

/** Add one tray slot for this level. Not allowed once the level is won. */
export function useExtraSlot(session: Session): Session {
  if (session.extraSlotsLeft <= 0) throw new Error("no extra slots left");
  if (status(session.board) === "won") throw new Error("game is already won");
  return {
    ...session,
    board: { ...session.board, trayCapacity: session.board.trayCapacity + EXTRA_SLOT_BONUS },
    extraSlotsLeft: session.extraSlotsLeft - 1,
  };
}

/**
 * Index of a screw on the active plate that keeps the level winnable, or null
 * when no hint is needed (already won) or none exists. A hint is only spent
 * when it returns an index.
 */
export function hint(session: Session): { session: Session; screwIndex: number | null } {
  if (session.hintsLeft <= 0) throw new Error("no hints left");
  const taps = solve(session.board);
  const next = taps?.[0];
  if (next === undefined) return { session, screwIndex: null };
  return { session: { ...session, hintsLeft: session.hintsLeft - 1 }, screwIndex: next };
}
