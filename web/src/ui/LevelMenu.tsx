import { useState } from "react";
import { GameButton } from "@freegamestore/games";
import { getProgress, getStars } from "../engine/progress";
import { LEVEL_COUNT } from "../engine/levels";

const PER_PAGE = 15;
const PAGES = Math.ceil(LEVEL_COUNT / PER_PAGE);

export interface LevelMenuProps {
  onPlay: (levelIndex: number) => void;
  onDaily: () => void;
}

export function LevelMenu({ onPlay, onDaily }: LevelMenuProps) {
  const [page, setPage] = useState(0);
  const progress = getProgress();
  const first = page * PER_PAGE + 1;
  const last = Math.min(first + PER_PAGE - 1, LEVEL_COUNT);

  return (
    <div className="menu">
      <h1 className="menu-title">Boltsort</h1>
      <p className="muted menu-progress">
        {progress.completed}/{LEVEL_COUNT} cleared · {progress.totalStars} stars
      </p>

      <GameButton block onClick={onDaily}>
        Today&rsquo;s daily level
      </GameButton>

      <ul className="level-grid" aria-label={`Levels ${first} to ${last}`}>
        {Array.from({ length: last - first + 1 }, (_, k) => {
          const index = first + k;
          const stars = getStars(index);
          return (
            <li key={index}>
              <button
                type="button"
                className="level-btn"
                aria-label={`Level ${index}, ${stars} of 3 stars`}
                onClick={() => onPlay(index)}
              >
                <span className="level-num">{index}</span>
                <span className={stars ? "level-stars has-stars" : "level-stars"} aria-hidden="true">
                  {stars ? "★".repeat(stars) : "·"}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="pager">
        <GameButton variant="ghost" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
          ‹ Prev
        </GameButton>
        <span className="muted">
          {page + 1} / {PAGES}
        </span>
        <GameButton variant="ghost" size="sm" disabled={page === PAGES - 1} onClick={() => setPage(page + 1)}>
          Next ›
        </GameButton>
      </div>
    </div>
  );
}
