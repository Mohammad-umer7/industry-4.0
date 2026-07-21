import { memo } from 'react'
import { Check, X, Minus, ScanLine, PackageSearch, CornerDownRight } from 'lucide-react'
import type { Engine } from '../sim/engine'
import type { RuleStatus, Route } from '../sim/types'
import { ROUTE_COLOR, ROUTE_LABEL } from '../lib/palette'

interface Props {
  engine: Engine
  v: number
}

function Spec({ label, value, tone }: { label: string; value: string; tone?: 'warn' | 'danger' }) {
  const valueClass =
    tone === 'danger' ? 'text-danger' : tone === 'warn' ? 'text-warn' : 'text-ink'
  return (
    <div className="flex flex-col gap-px rounded-md border border-line bg-surface-inset px-2 py-1">
      <span className="text-[9px] font-medium uppercase tracking-label text-ink-muted">{label}</span>
      <span className={`text-[12px] font-semibold leading-tight nums ${valueClass}`}>{value}</span>
    </div>
  )
}

function RuleIcon({ status }: { status: RuleStatus }) {
  if (status === 'pass') {
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-healthy/15 text-healthy">
        <Check size={13} strokeWidth={3} />
      </span>
    )
  }
  if (status === 'fail') {
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-danger/15 text-danger">
        <X size={13} strokeWidth={3} />
      </span>
    )
  }
  if (status === 'skip') {
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-line text-ink-faint">
        <Minus size={13} strokeWidth={3} />
      </span>
    )
  }
  return (
    <span className="flex h-5 w-5 items-center justify-center rounded-full border border-line text-ink-faint">
      <span className="h-1.5 w-1.5 rounded-full bg-ink-faint animate-pulse-dot" />
    </span>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-line bg-surface-inset text-ink-muted">
        <ScanLine size={22} />
      </div>
      <div>
        <p className="text-[13px] font-medium text-ink-soft">Waiting for next package</p>
        <p className="mt-0.5 text-2xs text-ink-muted">Scanner idle — line clear</p>
      </div>
    </div>
  )
}

function DecisionPanelImpl({ engine }: Props) {
  const sv = engine.scanView

  return (
    <section className="panel flex min-h-0 flex-col">
      <header className="flex items-center justify-between border-b border-line px-3.5 py-2.5">
        <div className="flex items-center gap-2">
          <PackageSearch size={14} className="text-brand-bright" />
          <h2 className="panel-title">AI Decision Engine</h2>
        </div>
        {sv.active && (
          <span className="nums text-2xs font-semibold text-brand-bright">{sv.id}</span>
        )}
      </header>

      {!sv.active ? (
        <EmptyState />
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto scroll-slim px-3.5 py-2.5">
          {/* package attributes */}
          <div className="grid grid-cols-3 gap-1">
            <Spec label="Size" value={sv.size} />
            <Spec label="Weight" value={`${sv.weight} kg`} />
            <Spec label="Label Zone" value={sv.labelReadable ? sv.zone : '—'} tone={sv.labelReadable ? undefined : 'danger'} />
            <Spec label="Condition" value={sv.condition === 'intact' ? 'Intact' : 'Damaged'} tone={sv.condition === 'intact' ? undefined : 'danger'} />
            <Spec label="Label" value={sv.labelReadable ? 'Readable' : 'Unreadable'} tone={sv.labelReadable ? undefined : 'danger'} />
            <Spec label="Camera" value="Locked" />
          </div>

          {/* rule chain */}
          <div className="flex flex-col gap-1">
            <p className="panel-title px-0.5">Decision rule chain</p>
            {sv.steps.map((step, i) => {
              const revealed = sv.revealed > i
              const status: RuleStatus = revealed ? step.status : 'pending'
              const isRoute = step.key === 'route'
              const routeColor = isRoute && sv.route ? ROUTE_COLOR[sv.route] : undefined
              return (
                <div
                  key={step.key}
                  className={`flex items-center gap-2.5 rounded-md border px-2.5 py-1.5 transition-colors ${
                    revealed
                      ? isRoute
                        ? 'border-line-strong bg-surface-raised animate-row-in'
                        : 'border-line bg-surface-inset animate-row-in'
                      : 'border-line/60 bg-transparent opacity-55'
                  }`}
                >
                  {isRoute && revealed ? (
                    <span
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: routeColor ? `${routeColor}22` : undefined, color: routeColor }}
                    >
                      <CornerDownRight size={13} strokeWidth={3} />
                    </span>
                  ) : (
                    <RuleIcon status={status} />
                  )}
                  <div className="flex min-w-0 flex-1 flex-col leading-tight">
                    <span className="text-[12px] font-medium text-ink">{step.label}</span>
                    <span className="truncate text-[10.5px] text-ink-muted">{revealed ? step.detail : 'Awaiting…'}</span>
                  </div>
                  <span className="nums text-[10px] font-semibold text-ink-faint">{i + 1}</span>
                </div>
              )
            })}
          </div>

          {/* final decision */}
          <div className="mt-auto">
            {sv.decided && sv.route ? (
              <DecisionSummary route={sv.route} confidence={sv.confidence} reason={sv.reason} />
            ) : (
              <div className="flex items-center justify-center gap-2 rounded-md border border-line border-dashed bg-surface-inset px-3 py-2.5 text-2xs font-medium text-ink-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-bright animate-pulse-dot" />
                Evaluating decision…
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

function DecisionSummary({ route, confidence, reason }: { route: Route; confidence: number; reason: string | null }) {
  const color = ROUTE_COLOR[route]
  const isReject = route === 'REJECT'
  return (
    <div
      className="animate-scale-in rounded-lg border px-3 py-2"
      style={{ borderColor: `${color}55`, backgroundColor: `${color}12` }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xs font-semibold uppercase tracking-label text-ink-muted">Decision</span>
          <span
            className="rounded px-2 py-0.5 text-[12px] font-bold"
            style={{ backgroundColor: color, color: '#08131A' }}
          >
            {isReject ? 'REJECT' : ROUTE_LABEL[route]}
          </span>
        </div>
        <span className="nums text-[13px] font-bold" style={{ color }}>
          {confidence}%
        </span>
      </div>
      <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-surface-inset">
        <div className="h-full rounded-full" style={{ width: `${confidence}%`, backgroundColor: color }} />
      </div>
      <p className="mt-1.5 text-[10.5px] leading-snug text-ink-soft">
        {reason ?? `Zone label matched — cleared to ${ROUTE_LABEL[route]}.`}
      </p>
    </div>
  )
}

export const DecisionPanel = memo(DecisionPanelImpl)
