import { type Board, type Colour, status, tap } from "./board";

/**
 * Depth-first search over which screw to tap next. Returns the sequence of
 * screw indices (into the active plate at each step) that wins, or `null` if
 * the board cannot be won. Deterministic: candidates are tried in index order.
 */
export function solve(board: Board): number[] | null {
  const failed = new Set<string>();

  function search(current: Board, path: number[]): number[] | null {
    const s = status(current);
    if (s === "won") return path;
    if (s === "lost") return null;

    const key = stateKey(current);
    if (failed.has(key)) return null;

    const screws = current.plates[0]!.screws;
    // Screws of the same colour on the same plate are interchangeable.
    const tried = new Set<Colour>();
    for (let i = 0; i < screws.length; i++) {
      const colour = screws[i]!;
      if (tried.has(colour)) continue;
      tried.add(colour);
      const found = search(tap(current, i), [...path, i]);
      if (found) return found;
    }

    failed.add(key);
    return null;
  }

  return search(board, []);
}

/** Apply a list of tap indices to a board. Throws if any tap is illegal. */
export function replay(board: Board, taps: number[]): Board {
  return taps.reduce((current, index) => tap(current, index), board);
}

/** Canonical key: screw order on a plate and tray order do not change the game. */
function stateKey(board: Board): string {
  return JSON.stringify({
    plates: board.plates.map((plate) => [...plate.screws].sort()),
    boxes: board.boxes.map((box) => [box.queue, box.filled]),
    tray: [...board.tray].sort(),
  });
}
