import { useEffect, useRef, useState } from "react";
import { GameButton, useSound } from "@freegamestore/games";
import { status as boardStatus, type Board, type Plate } from "../engine/board";
import {
  EXTRA_SLOT_LIMIT,
  HINT_LIMIT,
  UNDO_LIMIT,
  createSession,
  hint,
  tapScrew,
  undo,
  addExtraSlot,
  type Session,
} from "../engine/session";
import { ParticleLayer, type ParticleLayerHandle } from "../feel/ParticleLayer";
import { HAPTICS, useHaptics } from "../feel";
import { prefersReducedMotion } from "../motion/reducedMotion";
import { Screw } from "./art";
import { playCue } from "./sound";

/** Time the unscrew spin takes before the screw leaves the plate, in ms. */
const UNSCREW_MS = 320;
/** Time the falling plate stays on screen, in ms. Matches the plate-drop animation. */
const DROP_MS = 700;

export interface PlayResult {
  won: boolean;
  /** 1 to 3. Zero when lost. */
  stars: number;
  /** Time from the first screen show until the win, in ms. */
  timeMs: number;
}

export interface PlayScreenProps {
  board: Board;
  onExit: () => void;
  onRetry?: () => void;
  onNext?: () => void;
  onFinish?: (result: PlayResult) => void;
}

/** 3 stars with no helpers used, 2 with one or two, 1 with more. */
export function starsFor(helpersUsed: number): number {
  if (helpersUsed === 0) return 3;
  return helpersUsed <= 2 ? 2 : 1;
}

function helperUses(session: Session): number {
  return (UNDO_LIMIT - session.undosLeft) + (HINT_LIMIT - session.hintsLeft) + (EXTRA_SLOT_LIMIT - session.extraSlotsLeft);
}

function formatTime(ms: number): string {
  const total = Math.floor(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

export function PlayScreen({ board, onExit, onRetry, onNext, onFinish }: PlayScreenProps) {
  const [session, setSession] = useState<Session>(() => createSession(board));
  const sessionRef = useRef(session);
  const [busy, setBusy] = useState(false);
  const [leaving, setLeaving] = useState<number | null>(null);
  const [hintIndex, setHintIndex] = useState<number | null>(null);
  const [falling, setFalling] = useState<Plate | null>(null);
  const [pops, setPops] = useState<number[]>(() => board.boxes.map(() => 0));
  const [result, setResult] = useState<PlayResult | null>(null);

  const [startedAt] = useState(() => Date.now());
  const [now, setNow] = useState(startedAt);
  const layerRef = useRef<ParticleLayerHandle>(null);
  const boxRefs = useRef<(HTMLDivElement | null)[]>([]);
  const timers = useRef<number[]>([]);

  const { muted } = useSound();
  const mutedRef = useRef(muted);
  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);
  const haptics = useHaptics(true);

  const current = boardStatus(session.board);
  const active = session.board.plates[0];

  // Clock for the topbar and the win time. Stops once the level ends.
  useEffect(() => {
    if (current !== "playing") return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [current]);

  // Cancel pending animation timers on unmount.
  useEffect(() => () => timers.current.forEach((id) => window.clearTimeout(id)), []);

  function later(ms: number, fn: () => void) {
    timers.current.push(window.setTimeout(fn, ms));
  }

  /** Report the end of the level. Only a tap can end it, so this runs from commit. */
  function finish(s: Session, outcome: "won" | "lost", timeMs: number) {
    const finished: PlayResult =
      outcome === "won" ? { won: true, stars: starsFor(helperUses(s)), timeMs } : { won: false, stars: 0, timeMs };
    setResult(finished);
    if (outcome === "won") {
      playCue("win", !mutedRef.current);
    } else {
      playCue("lose", !mutedRef.current);
      haptics.pulse(HAPTICS.gameOver);
    }
    onFinish?.(finished);
  }

  function commit(index: number, tappedAt: number) {
    const before = sessionRef.current;
    const next = tapScrew(before, index);
    sessionRef.current = next;
    setSession(next);
    setLeaving(null);
    setBusy(false);

    const outcome = boardStatus(next.board);
    if (outcome !== "playing") finish(next, outcome, tappedAt - startedAt);

    const oldBoard = before.board;
    const newBoard = next.board;

    if (newBoard.plates.length < oldBoard.plates.length) {
      setFalling(oldBoard.plates[0]!);
      playCue("drop", !mutedRef.current);
      later(DROP_MS, () => setFalling(null));
    }

    const changed = newBoard.boxes.map((box, j) => {
      const old = oldBoard.boxes[j]!;
      return box.filled !== old.filled || box.queue.length !== old.queue.length;
    });
    if (changed.some(Boolean)) {
      setPops((prev) => prev.map((n, j) => (changed[j] ? n + 1 : n)));
      playCue("fill", !mutedRef.current);
      haptics.pulse(HAPTICS.clear);
      changed.forEach((didChange, j) => {
        const el = boxRefs.current[j];
        if (!didChange || !el) return;
        burstAt(el);
      });
    }
  }

  /** Burst particles from the centre of a box, coloured by the box's CSS colour. */
  function burstAt(el: HTMLElement) {
    const play = el.closest<HTMLElement>(".play");
    if (!play) return;
    const box = el.getBoundingClientRect();
    const origin = play.getBoundingClientRect();
    const colour = getComputedStyle(el).getPropertyValue("--c").trim() || "currentColor";
    layerRef.current?.burst(box.left - origin.left + box.width / 2, box.top - origin.top + box.height / 2, [colour], {
      count: 18,
      speed: [120, 260],
      size: [3, 6],
      life: 0.7,
    });
  }

  function onScrew(index: number) {
    if (busy || boardStatus(sessionRef.current.board) !== "playing") return;
    setBusy(true);
    setHintIndex(null);
    setLeaving(index);
    playCue("unscrew", !mutedRef.current);
    // `now` ticks every 250 ms, so the win time is at most a quarter-second late.
    later(prefersReducedMotion() ? 0 : UNSCREW_MS, () => commit(index, now));
  }

  function onUndo() {
    const next = undo(sessionRef.current);
    sessionRef.current = next;
    setSession(next);
    setResult(null);
    setLeaving(null);
    setHintIndex(null);
  }

  function onHint() {
    const r = hint(sessionRef.current);
    sessionRef.current = r.session;
    setSession(r.session);
    setHintIndex(r.screwIndex);
  }

  function onExtraSlot() {
    const next = addExtraSlot(sessionRef.current);
    sessionRef.current = next;
    setSession(next);
  }

  const playing = current === "playing";
  const canUndo = session.undosLeft > 0 && session.history.length > 0 && !busy;
  const canHint = playing && session.hintsLeft > 0 && !busy;
  const canExtra = session.extraSlotsLeft > 0 && current !== "won" && !busy;
  const elapsed = result ? result.timeMs : now - startedAt;

  return (
    <div className="play">
      <div className="play-meta" aria-live="polite">
        <span>Layers {session.board.plates.length}</span>
        <span>
          Time {formatTime(elapsed)}
        </span>
      </div>

      <ParticleLayer ref={layerRef} />

      <div className="stage">
        {falling && <div className="plate plate-falling" aria-hidden="true" />}
        {active && (
          <div className="plate-wrap" key={session.board.plates.length}>
            {session.board.plates.length > 1 && <div className="plate plate-behind" aria-hidden="true" />}
            <div className="plate plate-enter">
              {active.screws.map((colour, i) => (
                <button
                  key={`${i}-${colour}`}
                  type="button"
                  className={`screw-btn${leaving === i ? " unscrewing" : ""}${hintIndex === i ? " hinted" : ""}`}
                  aria-label={`Unscrew ${colour} screw`}
                  disabled={!playing || busy}
                  onClick={() => onScrew(i)}
                >
                  <Screw colour={colour} />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="boxes" role="list" aria-label="Colour boxes">
        {session.board.boxes.map((box, j) => {
          const colour = box.queue[0];
          return (
            <div
              key={`${j}-${pops[j]}`}
              ref={(el) => {
                boxRefs.current[j] = el;
              }}
              role="listitem"
              className={`box${pops[j] ? " pop" : ""}`}
              aria-label={colour ? `${colour} box, ${box.filled} of 3 filled` : "Box done"}
            >
              <span className={`box-tag${colour ? ` c-${colour}` : ""}`}>{colour ?? "done"}</span>
              <span className="box-slots">
                {[0, 1, 2].map((k) => (
                  <span key={k} className={`slot${colour && k < box.filled ? ` filled c-${colour}` : ""}`} />
                ))}
              </span>
            </div>
          );
        })}
      </div>

      <div className="tray" aria-label={`Tray ${session.board.tray.length} of ${session.board.trayCapacity}`}>
        {Array.from({ length: session.board.trayCapacity }, (_, k) => {
          const colour = session.board.tray[k];
          return (
            <span key={k} className="tray-slot">
              {colour && <Screw colour={colour} size={30} />}
            </span>
          );
        })}
      </div>

      <div className="helpers">
        <GameButton variant="secondary" size="sm" disabled={!canUndo} onClick={onUndo}>
          Undo ({session.undosLeft})
        </GameButton>
        <GameButton variant="secondary" size="sm" disabled={!canHint} onClick={onHint}>
          Hint ({session.hintsLeft})
        </GameButton>
        <GameButton variant="secondary" size="sm" disabled={!canExtra} onClick={onExtraSlot}>
          +1 tray ({session.extraSlotsLeft})
        </GameButton>
        <GameButton variant="ghost" size="sm" onClick={onExit}>
          Levels
        </GameButton>
      </div>

      {result && (
        <div className="overlay" role="dialog" aria-label={result.won ? "Level complete" : "Level failed"}>
          <div className="overlay-card">
            {result.won ? (
              <>
                <h2>Cleared!</h2>
                <p className="stars" aria-label={`${result.stars} of 3 stars`}>
                  {[1, 2, 3].map((n) => (
                    <span key={n} className={n <= result.stars ? "star on" : "star"}>
                      ★
                    </span>
                  ))}
                </p>
                <p className="muted">Time {formatTime(result.timeMs)}</p>
                {onNext && (
                  <GameButton block onClick={onNext}>
                    Next level
                  </GameButton>
                )}
              </>
            ) : (
              <>
                <h2>Tray full</h2>
                <p className="muted">Undo a move, or try again.</p>
                {onRetry && (
                  <GameButton block onClick={onRetry}>
                    Try again
                  </GameButton>
                )}
              </>
            )}
            <GameButton block variant="secondary" onClick={onExit}>
              Levels
            </GameButton>
          </div>
        </div>
      )}
    </div>
  );
}
