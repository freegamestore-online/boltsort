import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Board } from "../engine/board";
import { PlayScreen, starsFor } from "./PlayScreen";

// With reduced motion on, the unscrew delay is 0 and the tests do not wait on timers.
function setReducedMotion(reduce: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: reduce && query.includes("reduce"),
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

// Taps the top plate's first screw and wins.
const oneScrew: Board = {
  plates: [{ screws: ["red"] }],
  boxes: [{ queue: ["red"], filled: 0 }],
  tray: [],
  trayCapacity: 2,
};

// Tapping blue first overflows the one-slot tray.
const loseOnBlue: Board = {
  plates: [{ screws: ["blue", "red"] }],
  boxes: [{ queue: ["red"], filled: 0 }],
  tray: [],
  trayCapacity: 1,
};

// Either order works: blue has its own box, and the tray is never needed.
const solvable: Board = {
  plates: [{ screws: ["blue", "red"] }],
  boxes: [
    { queue: ["red"], filled: 0 },
    { queue: ["blue"], filled: 0 },
  ],
  tray: [],
  trayCapacity: 1,
};

describe("PlayScreen", () => {
  beforeEach(() => setReducedMotion(true));
  afterEach(() => vi.unstubAllGlobals());

  it("shows a button per screw on the active plate", () => {
    render(<PlayScreen board={loseOnBlue} onExit={() => {}} />);
    expect(screen.getByRole("button", { name: "Unscrew blue screw" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Unscrew red screw" })).toBeEnabled();
  });

  it("removes a screw and reports a win with three stars when no helpers were used", async () => {
    const onFinish = vi.fn();
    render(<PlayScreen board={oneScrew} onExit={() => {}} onFinish={onFinish} />);
    fireEvent.click(screen.getByRole("button", { name: "Unscrew red screw" }));

    expect(await screen.findByRole("dialog", { name: "Level complete" })).toBeInTheDocument();
    expect(screen.getByLabelText("3 of 3 stars")).toBeInTheDocument();
    expect(onFinish).toHaveBeenCalledTimes(1);
    expect(onFinish.mock.calls[0]![0]).toMatchObject({ won: true, stars: 3 });
  });

  it("reports a loss with zero stars when the tray fills", async () => {
    const onFinish = vi.fn();
    render(<PlayScreen board={loseOnBlue} onExit={() => {}} onFinish={onFinish} />);
    fireEvent.click(screen.getByRole("button", { name: "Unscrew blue screw" }));

    expect(await screen.findByRole("dialog", { name: "Level failed" })).toBeInTheDocument();
    expect(onFinish.mock.calls[0]![0]).toMatchObject({ won: false, stars: 0 });
  });

  it("undo brings back a lost level", async () => {
    render(<PlayScreen board={loseOnBlue} onExit={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Unscrew blue screw" }));
    await screen.findByRole("dialog", { name: "Level failed" });

    fireEvent.click(screen.getByRole("button", { name: /Undo/ }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Unscrew blue screw" })).toBeEnabled();
  });

  it("hint highlights a screw without changing the board", () => {
    const { container } = render(<PlayScreen board={solvable} onExit={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: /Hint/ }));

    expect(container.querySelectorAll(".screw-btn.hinted")).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Unscrew blue screw" })).toBeEnabled();
    expect(screen.getByRole("button", { name: /Hint/ })).toHaveTextContent("Hint (2)");
  });

  it("disables undo before any move", () => {
    render(<PlayScreen board={oneScrew} onExit={() => {}} />);
    expect(screen.getByRole("button", { name: /Undo/ })).toBeDisabled();
  });

  it("calls onExit from the Levels button", () => {
    const onExit = vi.fn();
    render(<PlayScreen board={oneScrew} onExit={onExit} />);
    fireEvent.click(screen.getByRole("button", { name: "Levels" }));
    expect(onExit).toHaveBeenCalled();
  });
});

describe("starsFor", () => {
  it("drops with helper use", () => {
    expect(starsFor(0)).toBe(3);
    expect(starsFor(1)).toBe(2);
    expect(starsFor(2)).toBe(2);
    expect(starsFor(3)).toBe(1);
  });
});
