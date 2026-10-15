import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getProgress, getStars, saveStars } from "./progress";

function mockLocalStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, String(value)),
    removeItem: (key: string) => void store.delete(key),
    clear: () => store.clear(),
  };
}

describe("progress", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", mockLocalStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns 0 stars for an unplayed level", () => {
    expect(getStars(4)).toBe(0);
  });

  it("saves and reads stars for a level", () => {
    saveStars(4, 2);
    expect(getStars(4)).toBe(2);
    expect(localStorage.getItem("boltsort_stars_4")).toBe("2");
  });

  it("only raises the best rating, never lowers it", () => {
    saveStars(1, 3);
    saveStars(1, 1);
    expect(getStars(1)).toBe(3);
  });

  it("counts completed levels and total stars", () => {
    saveStars(1, 3);
    saveStars(2, 1);
    saveStars(2, 3);
    expect(getProgress()).toEqual({ completed: 2, totalStars: 6 });
  });

  it("starts from zero progress", () => {
    expect(getProgress()).toEqual({ completed: 0, totalStars: 0 });
  });

  it("rejects star counts outside 1 to 3", () => {
    expect(() => saveStars(1, 0)).toThrow();
    expect(() => saveStars(1, 4)).toThrow();
    expect(() => saveStars(1, 1.5)).toThrow();
  });
});
