import { memo } from 'react'
import { HelpCircle, Zap } from 'lucide-react'
import { Logo } from './Logo'
import { formatRate } from '../lib/format'

interface Props {
  running: boolean
  surgeActive: boolean
  surgeSecondsLeft: number
  throughput: number
  clock: string
  onHowItWorks: () => void
}

function StatusPill({ running, surge }: { running: boolean; surge: boolean }) {
  if (!running) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-inset px-2.5 py-1">
        <span className="h-2 w-2 rounded-full bg-ink-muted" />
        <span className="text-2xs font-semibold uppercase tracking-label text-ink-soft">Paused</span>
      </span>
    )
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${
        surge ? 'border-warn/40 bg-warn/10' : 'border-healthy/30 bg-healthy/10'
      }`}
    >
      <span className={`h-2 w-2 rounded-full animate-pulse-dot ${surge ? 'bg-warn' : 'bg-healthy'}`} />
      <span
        className={`text-2xs font-semibold uppercase tracking-label ${surge ? 'text-warn' : 'text-healthy'}`}
      >
        Running
      </span>
    </span>
  )
}

function HeaderImpl({ running, surgeActive, surgeSecondsLeft, throughput, clock, onHowItWorks }: Props) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-line bg-surface/70 px-4 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <Logo size={28} />
        <div className="leading-none">
          <div className="flex items-baseline gap-2">
            <span className="text-[15px] font-bold tracking-tight text-ink">SortFlow</span>
            <span className="hidden text-[10px] font-medium uppercase tracking-label text-ink-muted sm:inline">
              AI Sorting Line
            </span>
          </div>
        </div>
        <div className="ml-1 h-6 w-px bg-line" />
        <StatusPill running={running} surge={surgeActive} />
        {surgeActive && (
          <span className="nums inline-flex items-center gap-1 rounded-full border border-warn/40 bg-warn/10 px-2 py-0.5 text-2xs font-semibold text-warn">
            <Zap size={11} />
            Surge {surgeSecondsLeft}s
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden items-center gap-4 md:flex">
          <Stat label="Throughput" value={formatRate(throughput)} unit="/min" />
          <div className="h-8 w-px bg-line" />
          <Stat label="Line time" value={clock} mono />
        </div>
        <button
          type="button"
          onClick={onHowItWorks}
          className="focusable inline-flex items-center gap-1.5 rounded-md border border-line bg-surface-inset px-2.5 py-1.5 text-2xs font-semibold text-ink-soft transition-colors hover:border-line-strong hover:text-ink"
        >
          <HelpCircle size={14} className="text-brand-bright" />
          How it works
        </button>
      </div>
    </header>
  )
}

function Stat({ label, value, unit, mono }: { label: string; value: string; unit?: string; mono?: boolean }) {
  return (
    <div className="flex flex-col items-end leading-none">
      <span className="text-[9px] font-medium uppercase tracking-label text-ink-muted">{label}</span>
      <span className={`nums mt-1 text-[15px] font-bold text-ink ${mono ? 'font-mono' : ''}`}>
        {value}
        {unit && <span className="ml-0.5 text-2xs font-medium text-ink-muted">{unit}</span>}
      </span>
    </div>
  )
}

export const Header = memo(HeaderImpl)
