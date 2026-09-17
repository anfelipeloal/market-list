// Pull-to-refresh (ticket #16): the touch gesture at the top of the Despensa and the Lista de
// compras (see src/app/(app)/use-refresh-on-return.ts). This is the geometry alone -- is the
// screen scrolled to the top, how far down has the finger moved, has it moved far enough to
// trigger a refresh on release -- with no DOM, timer or TouchEvent type in sight, so it is
// testable without a browser. The component wires raw touch coordinates to this on every
// touchmove: `scrollTop` is the scroll container's current offset from the top (e.g. window.scrollY
// for a window-scrolled page), and `deltaY` is the vertical distance from where the finger first
// touched down (positive means the finger moved down).
export interface PullToRefreshState {
  // Whether the gesture currently counts as an active pull: only once the screen was already at
  // the top and the finger has moved down from there. Drives whether the indicator shows at all.
  readonly active: boolean;
  // How far to show the indicator, in pixels, clamped so it never grows past a fixed maximum --
  // pulling further than that doesn't move the indicator any further.
  readonly distance: number;
  // distance / threshold, clamped to [0, 1]: how "full" an indicator that fills in with the pull
  // should render.
  readonly progress: number;
  // Whether releasing right now should trigger a refresh.
  readonly shouldTrigger: boolean;
}

export const PULL_TO_REFRESH_THRESHOLD_PX = 64;
const MAX_DISTANCE_PX = 96;

const IDLE_STATE: PullToRefreshState = { active: false, distance: 0, progress: 0, shouldTrigger: false };

// scrollTop > 0 means the screen isn't at the top, so this is an ordinary scroll, not a pull -- the
// gesture never activates no matter how far the finger moves (it could just as well be scrolling
// down further into a long list). deltaY <= 0 is upward movement, or no movement at all, from the
// touch's starting point: pulling only ever means down.
export function computePullToRefresh(
  scrollTop: number,
  deltaY: number,
  threshold: number = PULL_TO_REFRESH_THRESHOLD_PX,
): PullToRefreshState {
  if (scrollTop > 0 || deltaY <= 0) return IDLE_STATE;

  const distance = Math.min(deltaY, MAX_DISTANCE_PX);
  const progress = Math.min(distance / threshold, 1);
  return { active: true, distance, progress, shouldTrigger: distance >= threshold };
}
