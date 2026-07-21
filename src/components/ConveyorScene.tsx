import { memo } from 'react'
import type { Engine } from '../sim/engine'
import { sizeOf } from '../sim/engine'
import { ARM_MS, BELT, BELT_SPEED, BIN, GATE, ROUTES, SCANNER, SCAN_X, SETTLE_MS, VIEW } from '../sim/layout'
import type { Package, Route } from '../sim/types'
import { COLORS, ROUTE_COLOR } from '../lib/palette'

const SLAT_GAP = 24
const FILL_CAP = 24

const ROUTE_TITLE: Record<Route, string> = {
  A: 'LANE A',
  B: 'LANE B',
  C: 'LANE C',
  REJECT: 'REJECT',
}

interface Props {
  engine: Engine
  /** Changes each frame — presence forces a re-render off the live engine. */
  frame: number
  reducedMotion: boolean
}

/** Diverter-arm sweep (0 idle → 1 fully swung → 0) from its remaining timer. */
function armSwing(remainMs: number): number {
  if (remainMs <= 0) return 0
  const p = 1 - remainMs / ARM_MS // 0 → 1 over the swing
  return Math.sin(Math.PI * p) // out-and-back
}

function PackageSprite({ pkg }: { pkg: Package }) {
  const { w, h } = sizeOf(pkg.size)
  const x = pkg.x - w / 2
  const y = pkg.y - h / 2
  const zoneColor = ROUTE_COLOR[pkg.zone]
  const decided = pkg.route !== null
  const settling = pkg.phase === 'settled'
  const opacity = settling ? Math.max(0, pkg.settleMs / SETTLE_MS) : 1

  const edge = decided ? ROUTE_COLOR[pkg.route as Route] : COLORS.boxEdge
  const chipW = Math.min(14, w * 0.42)
  const chipH = Math.min(11, h * 0.5)

  return (
    <g transform={`translate(${x} ${y})`} opacity={opacity}>
      {/* body */}
      <rect
        width={w}
        height={h}
        rx={3}
        fill={COLORS.boxFill}
        stroke={edge}
        strokeWidth={decided ? 1.6 : 1}
      />
      {/* top face highlight */}
      <rect width={w} height={h * 0.32} rx={3} fill={COLORS.boxFillTop} opacity={0.9} />
      {/* tape seam */}
      <line
        x1={w / 2}
        y1={0}
        x2={w / 2}
        y2={h}
        stroke={COLORS.boxEdge}
        strokeWidth={0.75}
        opacity={0.55}
      />

      {/* zone label chip (bottom-right) or unreadable smudge */}
      {pkg.labelReadable ? (
        <g transform={`translate(${w - chipW - 2} ${h - chipH - 2})`}>
          <rect width={chipW} height={chipH} rx={2} fill={zoneColor} opacity={0.92} />
          <text
            x={chipW / 2}
            y={chipH / 2 + 0.5}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={chipH * 0.82}
            fontWeight={800}
            fill="#08131A"
          >
            {pkg.zone}
          </text>
        </g>
      ) : (
        <g transform={`translate(${w - chipW - 2} ${h - chipH - 2})`}>
          <rect width={chipW} height={chipH} rx={2} fill="#5B4A32" />
          <line x1={1.5} y1={chipH * 0.35} x2={chipW - 1.5} y2={chipH * 0.35} stroke="#2a2015" strokeWidth={1} />
          <line x1={1.5} y1={chipH * 0.62} x2={chipW - 1.5} y2={chipH * 0.62} stroke="#2a2015" strokeWidth={1} />
        </g>
      )}

      {/* damage mark — human-visible dent + crack, before the scanner too */}
      {pkg.condition === 'damaged' && (
        <g stroke={COLORS.warn} strokeWidth={1.1} fill="none" strokeLinecap="round" opacity={0.95}>
          <polyline points={`2,${h * 0.2} ${w * 0.28},${h * 0.5} ${w * 0.14},${h * 0.72}`} />
          <path d={`M ${w * 0.5} 1 q 3 4 0 7`} strokeWidth={0.9} />
        </g>
      )}
    </g>
  )
}

function Bin({ route, count }: { route: Route; count: number }) {
  const cx = GATE[route]
  const bw = BIN.width
  const left = cx - bw / 2
  const top = BIN.top
  const height = BIN.bottom - BIN.top
  const color = ROUTE_COLOR[route]
  const isReject = route === 'REJECT'
  const fillRatio = Math.min(1, count / FILL_CAP)
  const fillH = fillRatio * (height - 14)

  return (
    <g>
      {/* lane header */}
      <g>
        <rect x={left} y={top - 30} width={bw} height={16} rx={3} fill={COLORS.surfaceRaised} stroke={COLORS.line} />
        <rect x={left} y={top - 30} width={4} height={16} rx={2} fill={color} />
        <text
          x={left + 12}
          y={top - 22}
          dominantBaseline="central"
          fontSize={9}
          fontWeight={700}
          letterSpacing="0.08em"
          fill={isReject ? COLORS.danger : COLORS.inkSoft}
        >
          {ROUTE_TITLE[route]}
        </text>
      </g>

      {/* bin body */}
      <rect
        x={left}
        y={top}
        width={bw}
        height={height}
        rx={6}
        fill={isReject ? 'rgba(248,113,113,0.05)' : COLORS.surface}
        stroke={isReject ? 'rgba(248,113,113,0.4)' : COLORS.line}
        strokeWidth={1.2}
      />
      {/* fill level */}
      <rect
        x={left + 3}
        y={top + height - 3 - fillH}
        width={bw - 6}
        height={fillH}
        rx={4}
        fill={color}
        opacity={isReject ? 0.16 : 0.14}
      />
      <rect
        x={left + 3}
        y={top + height - 4 - fillH}
        width={bw - 6}
        height={fillH > 2 ? 2 : 0}
        fill={color}
        opacity={0.6}
      />

      {/* count */}
      <text
        x={cx}
        y={top + height - 16}
        textAnchor="middle"
        fontSize={26}
        fontWeight={800}
        fill={isReject ? COLORS.danger : COLORS.ink}
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {count}
      </text>
      <text x={cx} y={top + 18} textAnchor="middle" fontSize={8.5} fontWeight={600} letterSpacing="0.1em" fill={COLORS.inkMuted}>
        {isReject ? 'DIVERTED' : 'SORTED'}
      </text>
    </g>
  )
}

function DiverterArm({ route, swing }: { route: Route; swing: number }) {
  const cx = GATE[route]
  const pivotX = cx - 20
  const pivotY = BELT.top - 3
  const idle = -76
  const active = -16
  const angle = idle + swing * (active - idle)
  const armLen = 56
  const color = route === 'REJECT' ? COLORS.danger : COLORS.brandBright
  const activeGlow = swing > 0.05

  return (
    <g transform={`translate(${pivotX} ${pivotY})`}>
      {/* mount housing */}
      <rect x={-9} y={-11} width={18} height={14} rx={3} fill={COLORS.surfaceRaised} stroke={COLORS.lineStrong} />
      <g transform={`rotate(${angle})`}>
        <rect
          x={0}
          y={-3.5}
          width={armLen}
          height={7}
          rx={3.5}
          fill={activeGlow ? color : COLORS.lineStrong}
          opacity={activeGlow ? 0.95 : 0.7}
        />
        <rect x={armLen - 8} y={-5} width={8} height={10} rx={2} fill={activeGlow ? color : COLORS.line} />
      </g>
      <circle r={4.5} fill={activeGlow ? color : COLORS.lineStrong} />
      <circle r={1.6} fill={COLORS.base} />
    </g>
  )
}

// Fully-static scene geometry, built once at module load. ConveyorScene
// re-renders every frame; referencing these stable elements lets React skip
// re-allocating and re-diffing ~40 unchanging nodes each frame.
const BACKDROP_GRID = (
  <g opacity={0.5}>
    {Array.from({ length: 11 }, (_, i) => (
      <line key={`gx${i}`} x1={i * 100} y1={0} x2={i * 100} y2={VIEW.H} stroke="#0f1a2b" strokeWidth={1} />
    ))}
    {Array.from({ length: 7 }, (_, i) => (
      <line key={`gy${i}`} x1={0} y1={i * 100} x2={VIEW.W} y2={i * 100} stroke="#0f1a2b" strokeWidth={1} />
    ))}
  </g>
)

const CHUTES = (
  <>
    {ROUTES.map((r) => {
      const cx = GATE[r]
      const color = ROUTE_COLOR[r]
      return (
        <g key={`chute${r}`} opacity={0.5}>
          <path
            d={`M ${cx - 22} ${BELT.bottom} L ${cx + 22} ${BELT.bottom} L ${cx + 34} ${BIN.top} L ${cx - 34} ${BIN.top} Z`}
            fill={r === 'REJECT' ? 'rgba(248,113,113,0.04)' : 'rgba(148,180,220,0.02)'}
            stroke={color}
            strokeOpacity={0.18}
            strokeWidth={1}
          />
          <line x1={cx - 22} y1={BELT.bottom} x2={cx - 34} y2={BIN.top} stroke={color} strokeOpacity={0.28} strokeWidth={1} />
          <line x1={cx + 22} y1={BELT.bottom} x2={cx + 34} y2={BIN.top} stroke={color} strokeOpacity={0.28} strokeWidth={1} />
        </g>
      )
    })}
  </>
)

const BELT_LEGS = (
  <>
    {[120, 320, 520, 720, 900].map((lx) => (
      <rect key={`leg${lx}`} x={lx} y={BELT.bottom} width={10} height={40} fill="#0d1626" stroke={COLORS.line} />
    ))}
  </>
)

const DIVERT_SLOTS = (
  <>
    {ROUTES.map((r) => (
      <rect key={`slot${r}`} x={GATE[r] - 22} y={BELT.bottom - 5} width={44} height={5} fill="#070d16" opacity={0.85} />
    ))}
  </>
)

function ConveyorSceneImpl({ engine, reducedMotion }: Props) {
  const packages = engine.packages
  const scanning = engine.isScanning
  const scroll = reducedMotion ? 0 : (engine.simTime / 1000) * BELT_SPEED
  const slatOffset = scroll % SLAT_GAP
  // sweep for the scan beam
  const sweep = reducedMotion ? 0 : Math.sin(engine.simTime / 90) * 22

  return (
    <svg
      viewBox={`0 0 ${VIEW.W} ${VIEW.H}`}
      className="h-full w-full"
      role="img"
      aria-label="Live conveyor sorting line: packages travel right, are scanned mid-line, then diverted into lanes A, B, C or reject."
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="beltGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#20304a" />
          <stop offset="0.5" stopColor="#182437" />
          <stop offset="1" stopColor="#101a29" />
        </linearGradient>
        <linearGradient id="beamGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COLORS.brandBright} stopOpacity="0" />
          <stop offset="0.5" stopColor={COLORS.brandBright} stopOpacity="0.5" />
          <stop offset="1" stopColor={COLORS.brandBright} stopOpacity="0" />
        </linearGradient>
        <radialGradient id="scanGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={COLORS.brandBright} stopOpacity="0.35" />
          <stop offset="1" stopColor={COLORS.brandBright} stopOpacity="0" />
        </radialGradient>
        <clipPath id="beltClip">
          <rect x={BELT.left} y={BELT.top} width={BELT.right - BELT.left} height={BELT.bottom - BELT.top} rx={4} />
        </clipPath>
      </defs>

      {/* faint backdrop grid (static) */}
      {BACKDROP_GRID}

      {/* chutes from belt down to bins (static) */}
      {CHUTES}

      {/* bins */}
      {ROUTES.map((r) => (
        <Bin key={`bin${r}`} route={r} count={engine.stats.lanes[r]} />
      ))}

      {/* belt legs (static) */}
      {BELT_LEGS}

      {/* belt surface */}
      <rect
        x={BELT.left}
        y={BELT.top}
        width={BELT.right - BELT.left}
        height={BELT.bottom - BELT.top}
        rx={4}
        fill="url(#beltGrad)"
        stroke={COLORS.lineStrong}
        strokeWidth={1.4}
      />
      {/* moving slats */}
      <g clipPath="url(#beltClip)">
        <g transform={`translate(${slatOffset - SLAT_GAP} 0)`}>
          {Array.from(
            { length: Math.ceil((BELT.right - BELT.left) / SLAT_GAP) + 2 },
            (_, i) => {
              const sx = BELT.left + i * SLAT_GAP
              return (
                <line
                  key={`slat${i}`}
                  x1={sx}
                  y1={BELT.top + 3}
                  x2={sx}
                  y2={BELT.bottom - 3}
                  stroke="#0b1421"
                  strokeWidth={2}
                  opacity={0.7}
                />
              )
            },
          )}
        </g>
      </g>
      {/* belt divert slots at each gate (static) */}
      {DIVERT_SLOTS}
      {/* belt front rail */}
      <rect x={BELT.left} y={BELT.bottom - 3} width={BELT.right - BELT.left} height={3} fill="#0a1220" opacity={0.8} />
      {/* rollers */}
      <circle cx={BELT.left + 2} cy={BELT.center} r={9} fill="#1b2842" stroke={COLORS.lineStrong} />
      <circle cx={BELT.right - 2} cy={BELT.center} r={9} fill="#1b2842" stroke={COLORS.lineStrong} />

      {/* infeed marker */}
      <g opacity={0.8}>
        <text x={BELT.left + 8} y={BELT.top - 10} fontSize={8.5} fontWeight={600} letterSpacing="0.12em" fill={COLORS.inkMuted}>
          INFEED
        </text>
      </g>

      {/* scanner gantry */}
      <g>
        <rect x={SCANNER.left - 6} y={SCANNER.beamTop} width={8} height={BELT.bottom - SCANNER.beamTop + 6} rx={2} fill={COLORS.surfaceRaised} stroke={COLORS.lineStrong} />
        <rect x={SCANNER.right - 2} y={SCANNER.beamTop} width={8} height={BELT.bottom - SCANNER.beamTop + 6} rx={2} fill={COLORS.surfaceRaised} stroke={COLORS.lineStrong} />
        <rect x={SCANNER.left - 6} y={SCANNER.beamTop} width={SCANNER.right - SCANNER.left + 8} height={16} rx={3} fill={COLORS.surfaceRaised} stroke={COLORS.lineStrong} />
        {/* camera housing */}
        <g transform={`translate(${SCAN_X} ${SCANNER.beamTop + 8})`}>
          <rect x={-16} y={-4} width={32} height={16} rx={3} fill="#16223a" stroke={COLORS.lineStrong} />
          <circle cx={0} cy={4} r={4.5} fill="#0a0f1a" stroke={scanning ? COLORS.brandBright : COLORS.lineStrong} strokeWidth={1.4} />
          <circle cx={0} cy={4} r={1.6} fill={scanning ? COLORS.brandBright : '#2a3a55'} />
          <circle cx={11} cy={0} r={1.7} fill={scanning ? COLORS.healthy : '#33465f'} />
        </g>
        <text x={SCAN_X} y={SCANNER.beamTop - 6} textAnchor="middle" fontSize={9} fontWeight={700} letterSpacing="0.14em" fill={scanning ? COLORS.brandBright : COLORS.inkMuted}>
          AI SCAN
        </text>
      </g>

      {/* scan beam (only while a package is being read) */}
      {scanning && (
        <g clipPath="url(#beltClip)">
          <rect x={SCAN_X - 40 + sweep} y={BELT.top} width={4} height={BELT.bottom - BELT.top} fill="url(#beamGrad)" />
          <rect x={SCAN_X - 44} y={BELT.top} width={88} height={BELT.bottom - BELT.top} fill="url(#scanGlow)" opacity={0.6} />
          <rect x={SCAN_X + sweep} y={BELT.top} width={1.6} height={BELT.bottom - BELT.top} fill={COLORS.brandBright} opacity={0.9} />
        </g>
      )}

      {/* packages */}
      {packages.map((p) =>
        p.active ? <PackageSprite key={p.serial} pkg={p} /> : null,
      )}

      {/* diverter arms (above the belt/packages) */}
      {ROUTES.map((r) => (
        <DiverterArm key={`arm${r}`} route={r} swing={armSwing(engine.armTimers[r])} />
      ))}
    </svg>
  )
}

export const ConveyorScene = memo(ConveyorSceneImpl)
