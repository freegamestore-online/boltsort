// Daily leaderboard submit. Set VITE_FGS_LEADERBOARD_URL to enable it; unset, every call is a no-op.

export const GAME_ID = "boltsort";

/** Time is capped at a day, so every solve ranks above zero. Faster ranks higher. */
const DAY_CAP_MS = 24 * 60 * 60 * 1000;

function leaderboardBase(): string {
  const url = import.meta.env.VITE_FGS_LEADERBOARD_URL?.trim() ?? "";
  return url.replace(/\/+$/, "");
}

/**
 * Submit the daily level's completion time. Failures, including "Invalid game"
 * and network errors, are logged with console.warn and never thrown.
 */
export async function submitDailyScore(timeMs: number, date: Date = new Date()): Promise<void> {
  const base = leaderboardBase();
  if (!base) return;
  if (!Number.isFinite(timeMs) || timeMs < 0) return;

  const period = date.toISOString().slice(0, 10);
  const score = Math.max(0, Math.round(DAY_CAP_MS - timeMs));

  try {
    const res = await fetch(`${base}/api/scores`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ game: GAME_ID, score, period }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.warn(`leaderboard submit failed (${res.status}): ${detail.slice(0, 200)}`);
    }
  } catch (err) {
    console.warn("leaderboard submit failed:", err);
  }
}
