import { memo } from 'react'
import { Play, Pause, RotateCcw, PackageX, FileWarning, TrendingUp } from 'lucide-react'
import type { SimControls } from '../hooks/useSimulation'

interface Props {
  running: boolean
  speed: number
  spawnRate: number
  surgeActive: boolean
  surgeSecondsLeft: number
  controls: SimControls
}

const SPEEDS = [0.5, 1, 2, 4]

function GroupLabel({ children }: { children: string }) {
  return (
    <span className="hidden text-[9px] font-semibold uppercase tracking-label text-ink-faint lg:inline">
      {children}
    </span>
  )
}

function Divider() {
  return <div className="mx-0.5 hidden h-7 w-px bg-line sm:block" />
}

function ScenarioButton({
  icon: Icon,
  label,
  tone,
  onClick,
}: {
  icon: typeof PackageX
  label: string
  tone: 'danger' | 'warn' | 'brand'
  onClick: () => void
}) {
  const toneClass =
    tone === 'danger'
      ? 'hover:border-danger/50 hover:text-danger hover:bg-danger/10'
      : tone === 'warn'
        ? 'hover:border-warn/50 hover:text-warn hover:bg-warn/10'
        : 'hover:border-brand/60 hover:text-brand-bright hover:bg-brand/10'
  return (
    <button
      type="button"
      onClick={onClick}
      className={`focusable inline-flex items-center gap-1.5 rounded-md border border-line bg-surface-inset px-2.5 py-2 text-2xs font-semibold text-ink-soft transition-colors ${toneClass}`}
    >
      <Icon size={14} />
      <span className="whitespace-nowrap">{label}</span>
    </button>
  )
}

function ControlBarImpl({ running, speed, spawnRate, surgeActive, surgeSecondsLeft, controls }: Props) {
  return (
    <footer className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-t border-line bg-surface/70 px-4 py-2.5 backdrop-blur-sm">
      {/* transport */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={controls.toggleRunning}
          className={`focusable inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition-colors ${
            running
              ? 'bg-surface-inset text-ink-soft border border-line hover:border-line-strong hover:text-ink'
              : 'bg-brand text-[#04120f] hover:bg-brand-bright'
          }`}
        >
          {running ? <Pause size={14} /> : <Play size={14} />}
          {running ? 'Pause' : 'Start'}
        </button>
        <button
          type="button"
          onClick={controls.reset}
          className="focusable inline-flex items-center gap-1.5 rounded-md border border-line bg-surface-inset px-2.5 py-2 text-xs font-semibold text-ink-soft transition-colors hover:border-line-strong hover:text-ink"
        >
          <RotateCcw size={14} />
          Reset
        </button>
      </div>

      <Divider />

      {/* speed */}
      <div className="flex items-center gap-2">
        <GroupLabel>Speed</GroupLabel>
        <div className="flex items-center rounded-md border border-line bg-surface-inset p-0.5">
          {SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => controls.setSpeed(s)}
              className={`focusable nums rounded px-2.5 py-1.5 text-2xs font-semibold transition-colors ${
                speed === s ? 'bg-brand text-[#04120f]' : 'text-ink-muted hover:text-ink'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      <Divider />

      {/* inflow */}
      <div className="flex items-center gap-2.5">
        <GroupLabel>Inflow</GroupLabel>
        <input
          type="range"
          min={4}
          max={60}
          step={1}
          value={spawnRate}
          onChange={(e) => controls.setSpawnRate(Number(e.target.value))}
          className="range-teal focusable w-28 md:w-36"
          aria-label="Spawn rate, packages per minute"
        />
        <span className="nums w-16 text-2xs font-semibold text-ink-soft">{spawnRate}/min</span>
      </div>

      <Divider />

      {/* scenarios */}
      <div className="flex items-center gap-2">
        <GroupLabel>Scenarios</GroupLabel>
        <div className="flex flex-wrap items-center gap-1.5">
          <ScenarioButton icon={PackageX} label="Damaged pkg" tone="danger" onClick={() => controls.injectScenario('damaged')} />
          <ScenarioButton icon={FileWarning} label="Unreadable label" tone="warn" onClick={() => controls.injectScenario('unreadable')} />
          <button
            type="button"
            onClick={controls.startSurge}
            className={`focusable inline-flex items-center gap-1.5 rounded-md border px-2.5 py-2 text-2xs font-semibold transition-colors ${
              surgeActive
                ? 'border-warn/50 bg-warn/10 text-warn'
                : 'border-line bg-surface-inset text-ink-soft hover:border-brand/60 hover:bg-brand/10 hover:text-brand-bright'
            }`}
          >
            <TrendingUp size={14} />
            <span className="whitespace-nowrap nums">
              {surgeActive ? `Surge · ${surgeSecondsLeft}s` : 'Peak surge'}
            </span>
          </button>
        </div>
      </div>
    </footer>
  )
}

export const ControlBar = memo(ControlBarImpl)
