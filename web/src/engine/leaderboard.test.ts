import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { submitDailyScore } from "./leaderboard";

const BASE = "https://leaderboard.example.test";

describe("submitDailyScore", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_FGS_LEADERBOARD_URL", BASE);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("does nothing when no endpoint is configured", async () => {
    vi.stubEnv("VITE_FGS_LEADERBOARD_URL", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await submitDailyScore(5000);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("posts the score for the UTC date", async () => {
    const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await submitDailyScore(60_000, new Date("2026-01-01T10:00:00Z"));
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(`${BASE}/api/scores`);
    expect(JSON.parse(String(init.body))).toEqual({
      game: "boltsort",
      score: 24 * 60 * 60 * 1000 - 60_000,
      period: "2026-01-01",
    });
  });

  it("swallows an 'Invalid game' response with a warning", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("Invalid game", { status: 400 })));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await expect(submitDailyScore(1000)).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalled();
  });

  it("swallows network errors", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("offline"); }));
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await expect(submitDailyScore(1000)).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalled();
  });
});
