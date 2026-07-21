// ---------------------------------------------------------------------------
// SortFlow — simulation engine (pure TypeScript, no React, no DOM)
//
// The engine owns all simulation state and advances it in fixed-semantics
// ticks driven by real-frame delta time. Rendering reads this state directly;
// nothing here imports React so the model stays testable and allocation-light.
//
// Design notes
//  • Packages live in a fixed object pool (no per-frame allocation / GC churn).
//  • Counters, lane totals and the event log are all committed in the SAME
//    instant a package leaves the scanner, so they reconcile exactly and the
//    decision shown in the panel is always where the package actually goes.
//  • "Sort accuracy" is a rolling (EMA) sort-quality index derived from the
//    per-decision confidence scores — a live, honest number that dips when the
//    line is stressed with damaged / unreadable packages and recovers over time.
// ---------------------------------------------------------------------------

import {
  ARM_MS,
  BELT,
  BELT_SPEED,
  BIN,
  DIVERT_MS,
  DWELL_MIN,
  DWELL_SPAN,
  GATE,
  MIN_GAP,
  POOL_SIZE,
  ROUTES,
  SCAN_HOLD_MS,
  SCAN_QUEUE_OFFSET,
  SCAN_X,
  SETTLE_MS,
  SIZE_DIMS,
  SPAWN_X,
  STEP_MS,
} from './layout'
import type {
  LaneCounts,
  LogEntry,
  LogKind,
  Package,
  Route,
  Scenario,
  ScanView,
  Size,
  Stats,
  Zone,
} from './types'

const ACC_ALPHA = 0.1 // EMA weight for the accuracy index
const LOG_CAP = 120 // retained log entries (panel shows a slice)
const THROUGHPUT_WINDOW_MS = 60_000
const SURGE_MS = 20_000
const SURGE_MULTIPLIER = 2
const BASE_CLOCK_SECONDS = 14 * 3600 // simulated wall-clock starts at 14:00:00

const REJECT_REASONS = {
  label: 'Unreadable label — needs manual handling',
  damage: 'Damage detected by vision system',
  weight: 'Weight mismatch — possible mislabel',
} as const

/** Expected weight band per size (kg). */
const WEIGHT_RANGE: Record<Size, { lo: number; hi: number }> = {
  S: { lo: 0.5, hi: 3 },
  M: { lo: 3, hi: 10 },
  L: { lo: 10, hi: 25 },
}

// ---- small RNG helpers ------------------------------------------------------
const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo)
const randInt = (lo: number, hi: number) => Math.floor(rand(lo, hi + 1))
const chance = (p: number) => Math.random() < p
const round1 = (n: number) => Math.round(n * 10) / 10
const easeInQuad = (t: number) => t * t

function pickZone(): Zone {
  const r = Math.random()
  return r < 0.34 ? 'A' : r < 0.67 ? 'B' : 'C'
}

function pickSize(): Size {
  const r = Math.random()
  return r < 0.36 ? 'S' : r < 0.78 ? 'M' : 'L'
}

/** Is this weight sane for the size, or wildly off (far outside the band)? */
function weightIsSane(size: Size, weight: number): boolean {
  const { lo, hi } = WEIGHT_RANGE[size]
  return weight >= lo * 0.6 && weight <= hi * 1.4
}

function laneLabel(route: Route): string {
  return route === 'REJECT' ? 'REJECT' : `Lane ${route}`
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

/** Format simulated elapsed ms as HH:MM:SS wall-clock. */
export function formatClock(simMs: number): string {
  const total = Math.floor(BASE_CLOCK_SECONDS + simMs / 1000)
  const h = Math.floor(total / 3600) % 24
  const m = Math.floor(total / 60) % 60
  const s = total % 60
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`
}

interface Decision {
  route: Route
  reason: string | null
  confidence: number
  labelPass: boolean
  conditionPass: boolean
  weightPass: boolean
}

function decide(pkg: Package): Decision {
  const labelPass = pkg.labelReadable
  const conditionPass = pkg.condition === 'intact'
  const weightPass = weightIsSane(pkg.size, pkg.weight)

  if (!labelPass) {
    return {
      route: 'REJECT',
      reason: REJECT_REASONS.label,
      confidence: randInt(70, 90),
      labelPass,
      conditionPass,
      weightPass,
    }
  }
  if (!conditionPass) {
    return {
      route: 'REJECT',
      reason: REJECT_REASONS.damage,
      confidence: randInt(70, 90),
      labelPass,
      conditionPass,
      weightPass,
    }
  }
  if (!weightPass) {
    return {
      route: 'REJECT',
      reason: REJECT_REASONS.weight,
      confidence: randInt(70, 90),
      labelPass,
      conditionPass,
      weightPass,
    }
  }
  return {
    route: pkg.zone,
    reason: null,
    confidence: randInt(92, 99),
    labelPass,
    conditionPass,
    weightPass,
  }
}

function emptyLanes(): LaneCounts {
  return { A: 0, B: 0, C: 0, REJECT: 0 }
}

export class Engine {
  // ---- configuration (source of truth; controls mutate these) ----
  running = true
  speed = 1
  spawnRate = 22 // packages / minute

  // ---- pooled packages ----
  readonly packages: Package[] = []

  // ---- aggregate stats ----
  readonly stats: Stats = {
    totalProcessed: 0,
    lanes: emptyLanes(),
    rejected: 0,
    throughput: 0,
    accuracy: 100,
  }

  // ---- scanner decision view (reused object, mutated in place) ----
  readonly scanView: ScanView = {
    active: false,
    serial: -1,
    id: '',
    size: 'M',
    weight: 0,
    zone: 'A',
    condition: 'intact',
    labelReadable: true,
    steps: [
      { key: 'label', label: 'Label read', status: 'pending', detail: '' },
      { key: 'condition', label: 'Condition scan', status: 'pending', detail: '' },
      { key: 'weight', label: 'Weight / size check', status: 'pending', detail: '' },
      { key: 'route', label: 'Route assignment', status: 'pending', detail: '' },
    ],
    revealed: 0,
    decided: false,
    route: null,
    confidence: 0,
    reason: null,
  }

  // ---- diverter-arm swing timers, per gate ----
  readonly armTimers: Record<Route, number> = { A: 0, B: 0, C: 0, REJECT: 0 }

  // ---- event log (newest pushed to the end) ----
  readonly log: LogEntry[] = []

  // ---- change counters so memoized panels re-render only when relevant ----
  vStats = 0
  vScan = 0
  vLog = 0
  vControl = 0

  // ---- clock / surge ----
  simTime = 0
  surgeMs = 0

  // ---- internals ----
  private scannerOccupant = -1
  private scanElapsed = 0
  private scanHold = 0
  private spawnAcc = 0
  private serialSeq = 0
  private idSeq = 1042
  private logSeq = 0
  private accuracyInit = false
  private minBeltX = Infinity
  private lastSurgeSec = -1
  private readonly forcedQueue: Scenario[] = []
  private readonly procTimes: number[] = []
  private readonly order: number[] = []

  constructor() {
    for (let i = 0; i < POOL_SIZE; i++) {
      this.packages.push({
        active: false,
        serial: -1,
        id: '',
        size: 'M',
        weight: 0,
        zone: 'A',
        condition: 'intact',
        labelReadable: true,
        phase: 'done',
        x: SPAWN_X,
        y: BELT.center,
        route: null,
        confidence: 0,
        rejectReason: null,
        dwellMs: 0,
        divertT: 0,
        settleMs: 0,
      })
    }
    this.pushLog('system', 'System online — sorting line initialised')
    this.seed(6)
  }

  // -------------------------------------------------------------------------
  // Controls
  // -------------------------------------------------------------------------
  toggleRunning(): void {
    this.running = !this.running
    this.pushLog('system', this.running ? 'Line resumed' : 'Line paused')
    this.vControl++
  }

  setSpeed(speed: number): void {
    if (speed === this.speed) return
    this.speed = speed
    this.vControl++
  }

  setSpawnRate(rate: number): void {
    const clamped = Math.max(4, Math.min(60, Math.round(rate)))
    if (clamped === this.spawnRate) return
    this.spawnRate = clamped
    this.vControl++
  }

  injectScenario(kind: Scenario): void {
    this.forcedQueue.push(kind)
    this.pushLog(
      'scenario',
      kind === 'damaged'
        ? 'Scenario armed — next package flagged damaged'
        : 'Scenario armed — next package label unreadable',
    )
    this.vControl++
  }

  startSurge(): void {
    const fresh = this.surgeMs <= 0
    this.surgeMs = SURGE_MS
    this.lastSurgeSec = Math.ceil(this.surgeMs / 1000)
    if (fresh) this.pushLog('scenario', 'Peak-hour surge engaged — inflow doubled for 20s')
    this.vControl++
  }

  reset(): void {
    for (const p of this.packages) p.active = false
    this.stats.totalProcessed = 0
    this.stats.rejected = 0
    this.stats.throughput = 0
    this.stats.accuracy = 100
    this.stats.lanes = emptyLanes()
    this.scanView.active = false
    this.scanView.decided = false
    this.scanView.revealed = 0
    this.scanView.route = null
    this.scanView.reason = null
    for (const r of ROUTES) this.armTimers[r] = 0
    this.log.length = 0
    this.simTime = 0
    this.surgeMs = 0
    this.lastSurgeSec = -1
    this.scannerOccupant = -1
    this.scanElapsed = 0
    this.scanHold = 0
    this.spawnAcc = 0
    this.accuracyInit = false
    this.minBeltX = Infinity
    this.forcedQueue.length = 0
    this.procTimes.length = 0
    this.serialSeq = 0
    this.idSeq = 1042
    this.pushLog('system', 'Line reset — counters cleared')
    this.seed(6)
    this.vStats++
    this.vScan++
    this.vLog++
    this.vControl++
  }

  /** True while a package is being read (drives the scan-beam visual). */
  get isScanning(): boolean {
    return this.scannerOccupant >= 0
  }

  get surgeActive(): boolean {
    return this.surgeMs > 0
  }

  get surgeSecondsLeft(): number {
    return Math.ceil(this.surgeMs / 1000)
  }

  get clock(): string {
    return formatClock(this.simTime)
  }

  // -------------------------------------------------------------------------
  // Main tick — advance the whole simulation by realDtMs milliseconds.
  // -------------------------------------------------------------------------
  tick(realDtMs: number): void {
    if (!this.running) return
    const simDt = realDtMs * this.speed
    const simDtS = simDt / 1000
    this.simTime += simDt

    // Surge countdown
    if (this.surgeMs > 0) {
      this.surgeMs -= simDt
      if (this.surgeMs <= 0) {
        this.surgeMs = 0
        this.lastSurgeSec = -1
        this.pushLog('scenario', 'Surge cleared — inflow back to nominal')
        this.vControl++
      } else {
        const sec = Math.ceil(this.surgeMs / 1000)
        if (sec !== this.lastSurgeSec) {
          this.lastSurgeSec = sec
          this.vControl++
        }
      }
    }

    // Diverter-arm swing timers
    for (const r of ROUTES) {
      if (this.armTimers[r] > 0) {
        this.armTimers[r] = Math.max(0, this.armTimers[r] - simDt)
      }
    }

    // Advance every package (front-to-back so following/queueing is stable)
    this.moveAll(simDtS, simDt)

    // Spawn new packages at the configured (surge-adjusted) rate
    const effRate = this.spawnRate * (this.surgeMs > 0 ? SURGE_MULTIPLIER : 1)
    const interval = 60_000 / effRate
    this.spawnAcc += simDt
    let guard = 0
    while (this.spawnAcc >= interval && guard < 8) {
      guard++
      if (this.canSpawn()) {
        this.spawn()
        this.spawnAcc -= interval
      } else {
        // Belt congested — hold the accumulator so inflow doesn't burst later
        this.spawnAcc = Math.min(this.spawnAcc, interval)
        break
      }
    }

    // Let a finished decision linger briefly, then fall back to the idle state
    if (this.scanView.active && this.scanView.decided && this.scannerOccupant < 0) {
      this.scanHold -= simDt
      if (this.scanHold <= 0) {
        this.scanView.active = false
        this.vScan++
      }
    }

    this.updateThroughput()
  }

  // -------------------------------------------------------------------------
  // Movement
  // -------------------------------------------------------------------------
  private moveAll(simDtS: number, simDt: number): void {
    const step = BELT_SPEED * simDtS

    // Build a front-to-back (descending x) order over active packages
    const order = this.order
    order.length = 0
    for (let i = 0; i < this.packages.length; i++) {
      if (this.packages[i].active) order.push(i)
    }
    order.sort((a, b) => this.packages[b].x - this.packages[a].x)

    let aheadX = Infinity // nearest belt-lane package ahead of the current one
    let minBeltX = Infinity

    for (const idx of order) {
      const p = this.packages[idx]

      switch (p.phase) {
        case 'scanning':
          this.updateScanning(p, simDt)
          break

        case 'belt': {
          let target = p.x + step
          const ceil = aheadX - MIN_GAP
          if (target > ceil) target = ceil

          if (p.x < SCAN_X && target >= SCAN_X) {
            if (this.scannerOccupant < 0) {
              p.x = SCAN_X
              this.beginScan(p)
              break
            }
            const wait = SCAN_X - SCAN_QUEUE_OFFSET
            if (target > wait) target = wait
          }
          if (target > p.x) p.x = target
          break
        }

        case 'routing': {
          let target = p.x + step
          const ceil = aheadX - MIN_GAP
          if (target > ceil) target = ceil
          const gate = GATE[p.route as Route]
          if (target > gate) target = gate
          if (target > p.x) p.x = target
          if (p.x >= gate - 0.25) {
            p.phase = 'diverting'
            p.divertT = 0
            this.armTimers[p.route as Route] = ARM_MS
          }
          break
        }

        case 'diverting': {
          p.divertT += simDt / DIVERT_MS
          if (p.divertT >= 1) {
            p.divertT = 1
            p.phase = 'settled'
            p.settleMs = SETTLE_MS
            p.y = BIN.restY
          } else {
            p.y = BELT.center + easeInQuad(p.divertT) * (BIN.restY - BELT.center)
          }
          break
        }

        case 'settled': {
          p.settleMs -= simDt
          if (p.settleMs <= 0) {
            p.phase = 'done'
            p.active = false
          }
          break
        }

        default:
          break
      }

      // A package on the belt line blocks the one behind it
      if (
        p.active &&
        (p.phase === 'belt' || p.phase === 'scanning' || p.phase === 'routing')
      ) {
        if (p.x < aheadX) aheadX = p.x
        if (p.x < minBeltX) minBeltX = p.x
      }
    }

    this.minBeltX = minBeltX
  }

  private beginScan(p: Package): void {
    const d = decide(p)
    p.phase = 'scanning'
    p.route = d.route
    p.confidence = d.confidence
    p.rejectReason = d.reason

    this.scannerOccupant = p.serial
    this.scanElapsed = 0

    const sv = this.scanView
    sv.active = true
    sv.decided = false
    sv.revealed = 0
    sv.serial = p.serial
    sv.id = p.id
    sv.size = p.size
    sv.weight = p.weight
    sv.zone = p.zone
    sv.condition = p.condition
    sv.labelReadable = p.labelReadable
    sv.route = d.route
    sv.confidence = d.confidence
    sv.reason = d.reason

    // Populate the visible rule chain (statuses fixed now, revealed over time)
    const [s1, s2, s3, s4] = sv.steps
    s1.status = d.labelPass ? 'pass' : 'fail'
    s1.detail = d.labelPass ? `Barcode locked · Zone ${p.zone}` : 'No barcode lock'

    if (!d.labelPass) {
      s2.status = 'skip'
      s2.detail = 'Skipped'
      s3.status = 'skip'
      s3.detail = 'Skipped'
    } else {
      s2.status = d.conditionPass ? 'pass' : 'fail'
      s2.detail = d.conditionPass ? 'No damage detected' : 'Impact damage found'
      if (!d.conditionPass) {
        s3.status = 'skip'
        s3.detail = 'Skipped'
      } else {
        s3.status = d.weightPass ? 'pass' : 'fail'
        const { lo, hi } = WEIGHT_RANGE[p.size]
        s3.detail = d.weightPass
          ? `${round1(p.weight)} kg within ${p.size} range`
          : `${round1(p.weight)} kg outside ${lo}–${hi} kg`
      }
    }
    s4.status = 'pass'
    s4.detail =
      d.route === 'REJECT' ? 'Divert to REJECT lane' : `Divert to Lane ${d.route}`

    this.vScan++
  }

  private updateScanning(p: Package, simDt: number): void {
    this.scanElapsed += simDt
    const revealed = Math.min(this.scanView.steps.length, Math.floor(this.scanElapsed / STEP_MS))
    if (revealed !== this.scanView.revealed) {
      this.scanView.revealed = revealed
      if (revealed >= this.scanView.steps.length) this.scanView.decided = true
      this.vScan++
    }

    p.dwellMs -= simDt
    if (p.dwellMs <= 0 && this.scanView.decided) {
      // Release from the scanner and COMMIT the decision atomically
      p.phase = 'routing'
      this.scannerOccupant = -1
      this.scanHold = SCAN_HOLD_MS
      this.commit(p)
    }
  }

  private commit(p: Package): void {
    const route = p.route as Route
    this.stats.lanes[route]++
    this.stats.totalProcessed++
    if (route === 'REJECT') this.stats.rejected++

    if (this.accuracyInit) {
      this.stats.accuracy += ACC_ALPHA * (p.confidence - this.stats.accuracy)
    } else {
      this.stats.accuracy = p.confidence
      this.accuracyInit = true
    }

    this.procTimes.push(this.simTime)

    if (route === 'REJECT') {
      this.pushLog(
        'reject',
        `${p.id} routed to REJECT — ${p.rejectReason} (${p.confidence}% confidence)`,
      )
    } else {
      this.pushLog(
        'route',
        `${p.id} routed to ${laneLabel(route)} (${p.confidence}% confidence)`,
      )
    }

    this.vStats++
  }

  // -------------------------------------------------------------------------
  // Spawning
  // -------------------------------------------------------------------------
  private canSpawn(): boolean {
    if (this.minBeltX < SPAWN_X + MIN_GAP) return false
    for (let i = 0; i < this.packages.length; i++) {
      if (!this.packages[i].active) return true
    }
    return false
  }

  private freeSlot(): Package | null {
    for (let i = 0; i < this.packages.length; i++) {
      if (!this.packages[i].active) return this.packages[i]
    }
    return null
  }

  private spawn(): void {
    this.createPackage(SPAWN_X, this.forcedQueue.shift())
  }

  /**
   * Pre-populate the belt so the line is visibly busy from the first frame —
   * a cold, empty conveyor reads as "broken" for the first few seconds.
   */
  private seed(count: number): void {
    const startX = SCAN_X - 54
    for (let i = 0; i < count; i++) {
      this.createPackage(startX - i * MIN_GAP)
    }
  }

  private createPackage(x: number, forced?: Scenario): void {
    const p = this.freeSlot()
    if (!p) return

    const size = pickSize()
    const zone = pickZone()

    let labelReadable: boolean
    let condition: Package['condition']
    let weight: number

    if (forced === 'unreadable') {
      labelReadable = false
      condition = 'intact'
      weight = round1(rand(WEIGHT_RANGE[size].lo, WEIGHT_RANGE[size].hi))
    } else if (forced === 'damaged') {
      labelReadable = true
      condition = 'damaged'
      weight = round1(rand(WEIGHT_RANGE[size].lo, WEIGHT_RANGE[size].hi))
    } else {
      labelReadable = !chance(0.04)
      condition = chance(0.08) ? 'damaged' : 'intact'
      const { lo, hi } = WEIGHT_RANGE[size]
      if (chance(0.03)) {
        // Occasional wildly-off weight to trigger the mismatch rule organically
        weight = chance(0.5) ? round1(rand(lo * 0.15, lo * 0.5)) : round1(rand(hi * 1.6, hi * 2.2))
      } else {
        weight = round1(rand(lo, hi))
      }
    }

    p.active = true
    p.serial = ++this.serialSeq
    p.id = `PKG-${this.idSeq++}`
    p.size = size
    p.zone = zone
    p.condition = condition
    p.labelReadable = labelReadable
    p.weight = Math.max(0.3, weight)
    p.phase = 'belt'
    p.x = x
    p.y = BELT.center
    p.route = null
    p.confidence = 0
    p.rejectReason = null
    p.dwellMs = DWELL_MIN + Math.random() * DWELL_SPAN
    p.divertT = 0
    p.settleMs = 0
  }

  // -------------------------------------------------------------------------
  // Throughput (trailing 60s window, extrapolated before the window fills)
  // -------------------------------------------------------------------------
  private updateThroughput(): void {
    const cutoff = this.simTime - THROUGHPUT_WINDOW_MS
    while (this.procTimes.length > 0 && this.procTimes[0] < cutoff) {
      this.procTimes.shift()
    }
    const windowMs = Math.min(this.simTime, THROUGHPUT_WINDOW_MS)
    const next =
      windowMs <= 0 ? 0 : (this.procTimes.length / windowMs) * THROUGHPUT_WINDOW_MS
    if (Math.abs(next - this.stats.throughput) > 0.01) {
      this.stats.throughput = next
      this.vStats++
    }
  }

  // -------------------------------------------------------------------------
  // Logging
  // -------------------------------------------------------------------------
  private pushLog(kind: LogKind, text: string): void {
    this.log.push({ id: ++this.logSeq, time: formatClock(this.simTime), kind, text })
    if (this.log.length > LOG_CAP) this.log.shift()
    this.vLog++
  }
}

/** Package footprint helper for the renderer. */
export function sizeOf(size: Size): { w: number; h: number } {
  return SIZE_DIMS[size]
}

export function createEngine(): Engine {
  return new Engine()
}
