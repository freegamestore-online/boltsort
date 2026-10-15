// Original sprites, drawn in SVG and styled by classes in index.css. The colour
// values live in index.css, so this file has no hex colours.

import type { Colour } from "../engine/board";

/** A screw head: a coloured dome with a slot and a highlight. */
export function Screw({ colour, size = 44 }: { colour: Colour; size?: number }) {
  return (
    <svg className={`screw c-${colour}`} width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <circle className="screw-rim" cx="24" cy="24" r="22" />
      <circle className="screw-head" cx="24" cy="24" r="17" />
      <ellipse className="screw-shine" cx="18" cy="16" rx="7" ry="4" />
      <rect className="screw-slot" x="11" y="22.5" width="26" height="3" rx="1.5" />
    </svg>
  );
}
