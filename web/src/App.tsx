import { useCallback, useMemo, useState } from "react";
import { GameShell, GameTopbar } from "@freegamestore/games";
import { getDailyLevel } from "./engine/daily";
import { LEVEL_COUNT, LEVELS } from "./engine/levels";
import { saveStars } from "./engine/progress";
import { submitDailyScore } from "./engine/leaderboard";
import { LevelMenu } from "./ui/LevelMenu";
import { PlayScreen, type PlayResult } from "./ui/PlayScreen";

type Target = { kind: "level"; index: number } | { kind: "daily" };

const PRIVACY_URL = "https://freegamestore.online/privacy.html";
const STORE_URL = "https://freegamestore.online";

function Links() {
  return (
    <nav className="links">
      <a href={PRIVACY_URL}>Privacy policy</a>
      <a href={STORE_URL}>More free games on freegamestore.online</a>
    </nav>
  );
}

export default function App() {
  const [target, setTarget] = useState<Target | null>(null);
  // Bumped to remount the play screen on "Try again".
  const [attempt, setAttempt] = useState(0);
  const daily = useMemo(() => (target?.kind === "daily" ? getDailyLevel() : null), [target]);

  const board = target?.kind === "level" ? LEVELS[target.index - 1] : daily;

  const onFinish = useCallback(
    (result: PlayResult) => {
      if (!result.won || !target) return;
      if (target.kind === "level") saveStars(target.index, result.stars);
      else void submitDailyScore(result.timeMs);
    },
    [target],
  );

  return (
    <GameShell
      topbar={
        <GameTopbar
          title="Boltsort"
          about={
            <div>
              <p>Boltsort is free, MIT-licensed, and has no tracking.</p>
              <Links />
            </div>
          }
        />
      }
    >
      {target && board ? (
        <PlayScreen
          key={`${target.kind}-${target.kind === "level" ? target.index : "daily"}-${attempt}`}
          board={board}
          onExit={() => setTarget(null)}
          onRetry={target.kind === "level" ? () => setAttempt((n) => n + 1) : undefined}
          onNext={
            target.kind === "level" && target.index < LEVEL_COUNT
              ? () => setTarget({ kind: "level", index: target.index + 1 })
              : undefined
          }
          onFinish={onFinish}
        />
      ) : (
        <div className="menu-wrap">
          <LevelMenu onPlay={(index) => setTarget({ kind: "level", index })} onDaily={() => setTarget({ kind: "daily" })} />
          <Links />
        </div>
      )}
    </GameShell>
  );
}
