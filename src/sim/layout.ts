// ---------------------------------------------------------------------------
// SortFlow — virtual-canvas layout constants
// The engine positions packages in this coordinate space and the SVG scene
// renders the exact same space via a viewBox. Keeping the geometry in one
// module guarantees the decision panel, diverter arms and bins always line up
// with where a package actually goes.
// ---------------------------------------------------------------------------

import type { Route, Size } from './types'

/** Virtual canvas the scene's SVG viewBox maps to. */
export const VIEW = { W: 1000, H: 600 } as const

/** Horizontal infeed belt geometry. */
export const BELT = {
  left: 20,
  right: 980,
  top: 118,
  bottom: 196,
  /** Vertical center packages ride along. */
  center: 157,
} as const

/** X where a package's center sits while it is being scanned. */
export const SCAN_X = 384
/** Scan gantry footprint (posts + top beam) for the scene to draw. */
export const SCANNER = {
  x: SCAN_X,
  left: 330,
  right: 438,
  beamTop: 92,
} as const

/** Divert gate X per route — packages peel off the belt here. */
export const GATE: Record<Route, number> = {
  A: 556,
  B: 664,
  C: 772,
  REJECT: 888,
}

/** Collection bins, centered under their gates. */
export const BIN = {
  top: 424,
  bottom: 560,
  width: 92,
  /** Y a diverted package settles to inside the bin. */
  restY: 470,
} as const

export const ROUTES: Route[] = ['A', 'B', 'C', 'REJECT']

/** Package footprint by size, in virtual px. */
export const SIZE_DIMS: Record<Size, { w: number; h: number }> = {
  S: { w: 26, h: 20 },
  M: { w: 33, h: 25 },
  L: { w: 43, h: 31 },
}

// ---- motion tuning (all in sim-time; the engine scales real dt by speed) ----

/** Belt travel speed, virtual px per simulated second. */
export const BELT_SPEED = 172
/** Minimum center-to-center spacing maintained between packages on the belt. */
export const MIN_GAP = 50
/** Where a queued package waits when the scanner is busy. */
export const SCAN_QUEUE_OFFSET = 46
/** Off-screen spawn X. */
export const SPAWN_X = -34

/** Duration of the divert drop into a bin (ms, sim-time). */
export const DIVERT_MS = 520
/** How long a package rests in the bin before being recycled (ms). */
export const SETTLE_MS = 240
/** Diverter-arm swing duration (ms) — shared by engine timing and scene render. */
export const ARM_MS = 260
/** Reveal cadence for each rule-chain row (ms). */
export const STEP_MS = 74
/** Scanner dwell window (ms) — a package pauses here to be read. */
export const DWELL_MIN = 340
export const DWELL_SPAN = 140
/** Keep showing a finished decision this long once the scanner frees (ms). */
export const SCAN_HOLD_MS = 620

/** Object pool ceiling — comfortably above any surge population. */
export const POOL_SIZE = 84
