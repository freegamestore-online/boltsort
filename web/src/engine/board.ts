/** Screws per colour box. A full box clears and advances to its next colour. */
export const BOX_SIZE = 3;

export type Colour = string;

/** Screws on one plate. Only the top (active) plate is playable. */
export interface Plate {
  screws: Colour[];
}

/** A 3-slot colour box. `queue[0]` is the colour it currently accepts. */
export interface ColourBox {
  queue: Colour[];
  filled: number;
}

export interface Board {
  /** Top-to-bottom. `plates[0]` is the active plate. */
  plates: Plate[];
  boxes: ColourBox[];
  tray: Colour[];
  trayCapacity: number;
}

export type Status = "playing" | "won" | "lost";

export function status(board: Board): Status {
  if (board.tray.length >= board.trayCapacity) return "lost";
  if (board.plates.length === 0) return "won";
  return "playing";
}

/**
 * Remove the screw at `screwIndex` on the active plate. Returns a new board;
 * the input is not mutated. The screw goes into the first box whose current
 * colour matches and has a free slot, otherwise into the tray. A plate with no
 * screws left falls away, and the next plate becomes active.
 */
export function tap(board: Board, screwIndex: number): Board {
  if (status(board) !== "playing") throw new Error("game is over");
  const active = board.plates[0];
  if (!active || screwIndex < 0 || screwIndex >= active.screws.length) {
    throw new Error(`no screw at index ${screwIndex} on the active plate`);
  }

  const colour = active.screws[screwIndex]!;
  const remaining = active.screws.filter((_, i) => i !== screwIndex);
  const plates = board.plates.slice(1);
  if (remaining.length > 0) plates.unshift({ screws: remaining });

  const boxes = board.boxes.map((box) => ({ ...box, queue: [...box.queue] }));
  const tray = [...board.tray];
  const target = boxes.find((box) => box.queue[0] === colour && box.filled < BOX_SIZE);
  if (target) {
    target.filled += 1;
    if (target.filled === BOX_SIZE) {
      target.queue.shift();
      target.filled = 0;
    }
  } else {
    tray.push(colour);
  }

  return { plates, boxes, tray, trayCapacity: board.trayCapacity };
}
