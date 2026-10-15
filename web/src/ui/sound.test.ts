import { afterEach, describe, expect, it, vi } from "vitest";
import { playCue } from "./sound";

describe("playCue", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("makes no sound while muted", () => {
    const ctor = vi.fn();
    vi.stubGlobal("AudioContext", ctor);
    playCue("win", false);
    expect(ctor).not.toHaveBeenCalled();
  });

  it("does nothing when Web Audio is missing", () => {
    vi.stubGlobal("AudioContext", undefined);
    expect(() => playCue("fill", true)).not.toThrow();
  });
});
