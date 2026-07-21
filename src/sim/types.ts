// ---------------------------------------------------------------------------
// SortFlow — shared simulation types
// Pure data contracts shared between the engine (src/sim/engine.ts) and the
// React rendering layer. No runtime logic lives here.
// ---------------------------------------------------------------------------

export type Size = 'S' | 'M' | 'L'
export type Zone = 'A' | 'B' | 'C'
/** Where a package can be routed. Zones A/B/C plus the reject lane. */
export type Route = 'A' | 'B' | 'C' | 'REJECT'
export type Condition = 'intact' | 'damaged'

/** Lifecycle of a single package as it travels the line. */
export type Phase =
  | 'belt' // riding the infeed belt toward the scanner
  | 'scanning' // paused under the scan gantry while the AI decides
  | 'routing' // released from the scanner, travelling to its divert gate
  | 'diverting' // being pushed off the belt down into a lane bin
  | 'settled' // resting in the bin (already counted), fading out
  | 'done' // recycled back into the pool

/** One row of the visible AI rule chain. */
export type RuleStatus = 'pending' | 'pass' | 'fail' | 'skip'

export interface RuleStep {
  key: string
  label: string
  status: RuleStatus
  detail: string
}

/** A mutable, pooled package. Reused across lives to avoid per-frame GC. */
export interface Package {
  active: boolean
  /** Unique per life; used as the React key so pooled reuse never confuses reconciliation. */
  serial: number
  id: string
  size: Size
  weight: number
  /** The zone printed on the physical label — ground truth. */
  zone: Zone
  condition: Condition
  labelReadable: boolean

  // ---- runtime motion state (virtual-canvas coordinates) ----
  phase: Phase
  x: number
  y: number
  route: Route | null
  confidence: number
  rejectReason: string | null

  // ---- per-phase timers ----
  dwellMs: number
  divertT: number
  settleMs: number
}

/** Snapshot of the package currently under the scanner, for the decision panel. */
export interface ScanView {
  active: boolean
  serial: number
  id: string
  size: Size
  weight: number
  zone: Zone
  condition: Condition
  labelReadable: boolean
  steps: RuleStep[]
  /** How many rule rows have been revealed so far (progressive reveal). */
  revealed: number
  decided: boolean
  route: Route | null
  confidence: number
  reason: string | null
}

export type LaneCounts = Record<Route, number>

export interface Stats {
  totalProcessed: number
  lanes: LaneCounts
  rejected: number
  /** Packages per minute over a trailing 60s window (extrapolated early). */
  throughput: number
  /** Rolling sort-quality index, expressed 0–100. See engine notes. */
  accuracy: number
}

export type LogKind = 'route' | 'reject' | 'system' | 'scenario'

export interface LogEntry {
  id: number
  /** HH:MM:SS of simulated wall-clock time. */
  time: string
  kind: LogKind
  text: string
}

export type Scenario = 'damaged' | 'unreadable'
