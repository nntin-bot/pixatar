import {
  type CharacterProfile,
  type Direction,
  renderAvatar,
  renderFrame,
  SHEET_FRAMES,
  TYPE_FRAME_DURATION_SEC,
  WALK_FRAME_DURATION_SEC,
} from 'pixatar';
import { useEffect, useMemo, useRef, useState } from 'react';

import { paint } from './draw';

type Action = 'walk' | 'type' | 'read';
const ACTIONS: readonly Action[] = ['walk', 'type', 'read'];
const DIRECTIONS: readonly Direction[] = ['down', 'left', 'up', 'right'];
const SECONDS: Record<Action, number> = {
  walk: WALK_FRAME_DURATION_SEC,
  type: TYPE_FRAME_DURATION_SEC,
  read: TYPE_FRAME_DURATION_SEC,
};
const FRAME_SCALE = 4;

/** The avatar, big, on its background colour (null: transparent, over a checkerboard). */
export function Avatar({ profile, background, scale = 10 }: { profile: CharacterProfile; background: string | null; scale?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => paint(ref.current, renderAvatar(profile, { scale, background })), [profile, background, scale]);
  return (
    <canvas
      ref={ref}
      className={`pixelated block border-2 border-border shadow-pixel ${background ? '' : 'checkerboard'}`}
      aria-label="Avatar"
    />
  );
}

/** The character walking (typing, reading) in every direction, with pixatar's own frames. */
export function Animation({ profile, background }: { profile: CharacterProfile; background: string }) {
  const [action, setAction] = useState<Action>('walk');
  const [tick, setTick] = useState(0);
  const frames = useMemo(
    () =>
      DIRECTIONS.map((direction) =>
        SHEET_FRAMES[action].map((frame) => renderFrame(profile, { direction, frame, scale: FRAME_SCALE })),
      ),
    [profile, action],
  );
  const refs = useRef<(HTMLCanvasElement | null)[]>([]);

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), SECONDS[action] * 1000);
    return () => clearInterval(timer);
  }, [action]);

  useEffect(() => {
    frames.forEach((cycle, i) => paint(refs.current[i] ?? null, cycle[tick % cycle.length]!));
  }, [frames, tick]);

  return (
    <div>
      <div className="flex gap-8 p-8 border-2 border-border" style={{ background }}>
        {DIRECTIONS.map((direction, i) => (
          <canvas
            key={direction}
            ref={(el) => {
              refs.current[i] = el;
            }}
            className="pixelated block"
            aria-label={`Facing ${direction}`}
          />
        ))}
      </div>
      <div className="flex gap-4 mt-8" role="group" aria-label="Animation">
        {ACTIONS.map((a) => (
          <button
            key={a}
            type="button"
            aria-pressed={a === action}
            onClick={() => setAction(a)}
            className={`px-10 py-2 border-2 border-border text-sm cursor-pointer ${a === action ? 'bg-active-bg' : 'bg-btn-bg hover:bg-btn-hover'}`}
          >
            {a}
          </button>
        ))}
      </div>
    </div>
  );
}
