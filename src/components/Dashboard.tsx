import { memo } from 'react'
import { Boxes, Gauge, Target, Ban, type LucideIcon } from 'lucide-react'
import type { Engine } from '../sim/engine'
import { ROUTES } from '../sim/layout'
import type { Route } from '../sim/types'
import { ROUTE_COLOR } from '../lib/palette'
import { formatInt, formatPct, formatRate } from '../lib/format'

interface Props {
  engine: Engine
  v: number
}

function Kpi({
  icon: Icon,
  label,
  value,
  unit,
  accent,
}: {
  icon: LucideIcon
  label: string
  value: string
  unit?: string
  accent: string
}) {
  return (
    <div className="rounded-md border border-line bg-surface-inset px-3 py-2">
      <div className="flex items-center gap-1.5">
        <Icon size={12} style={{ color: accent }} />
        <span className="text-[9px] font-medium uppercase tracking-label text-ink-muted">{label}</span>
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="nums text-[23px] font-bold leading-none text-ink">{value}</span>
        {unit && <span className="text-2xs font-medium text-ink-muted">{unit}</span>}
      </div>
    </div>
  )
}

function DashboardImpl({ engine }: Props) {
  const { stats } = engine
  const total = stats.totalProcessed
  const accuracy = total === 0 ? '—' : formatPct(stats.accuracy)

  const distTotal = ROUTES.reduce((sum, r) => sum + stats.lanes[r], 0)

  return (
    <section className="panel flex flex-col">
      <header className="flex items-center gap-2 border-b border-line px-3.5 py-2.5">
        <Gauge size={14} className="text-brand-bright" />
        <h2 className="panel-title">Live Operations</h2>
      </header>

      <div className="flex flex-col gap-3 px-3.5 py-3">
        <div className="grid grid-cols-2 gap-1.5">
          <Kpi icon={Boxes} label="Total processed" value={formatInt(total)} accent={ROUTE_COLOR.A} />
          <Kpi icon={Gauge} label="Throughput" value={formatRate(stats.throughput)} unit="/min" accent={ROUTE_COLOR.B} />
          <Kpi icon={Target} label="Sort accuracy" value={accuracy} accent="#34D399" />
          <Kpi icon={Ban} label="Rejected" value={formatInt(stats.rejected)} accent={ROUTE_COLOR.REJECT} />
        </div>

        {/* lane distribution */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="panel-title">Lane distribution</span>
            <span className="nums text-2xs text-ink-muted">{formatInt(distTotal)} sorted</span>
          </div>
          <div className="flex h-2.5 w-full overflow-hidden rounded-full border border-line bg-surface-inset">
            {distTotal === 0 ? (
              <div className="h-full w-full bg-transparent" />
            ) : (
              ROUTES.map((r) => {
                const pct = (stats.lanes[r] / distTotal) * 100
                return (
                  <div
                    key={r}
                    className="h-full transition-[width] duration-300 ease-out"
                    style={{ width: `${pct}%`, backgroundColor: ROUTE_COLOR[r] }}
                    title={`${labelOf(r)}: ${stats.lanes[r]}`}
                  />
                )
              })
            )}
          </div>
          <div className="mt-2 grid grid-cols-4 gap-1">
            {ROUTES.map((r) => (
              <div key={r} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: ROUTE_COLOR[r] }} />
                <div className="flex flex-col leading-tight">
                  <span className="text-[10px] font-medium text-ink-soft">{labelOf(r)}</span>
                  <span className="nums text-[11px] font-semibold text-ink">{formatInt(stats.lanes[r])}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function labelOf(r: Route): string {
  return r === 'REJECT' ? 'Reject' : `Lane ${r}`
}

export const Dashboard = memo(DashboardImpl)
