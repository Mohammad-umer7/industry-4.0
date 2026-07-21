import { useEffect, useRef } from 'react'
import { X, Eye, Cpu, Bot, Activity, type LucideIcon } from 'lucide-react'
import { COLORS } from '../lib/palette'

interface Props {
  open: boolean
  onClose: () => void
}

interface Step {
  n: number
  title: string
  body: string
  icon: LucideIcon
  accent: string
  illustration: React.ReactNode
}

const STEPS: Step[] = [
  {
    n: 1,
    title: 'Sense',
    body: 'A vision camera and load sensors read every package — its label, size, weight and condition — as it pauses at the scanning station.',
    icon: Eye,
    accent: '#2DD4BF',
    illustration: (
      <svg viewBox="0 0 60 40" className="h-full w-full">
        <rect x="6" y="24" width="48" height="6" rx="2" fill="#182437" stroke="#28374F" />
        <rect x="24" y="15" width="12" height="9" rx="1.5" fill="#C9A26B" stroke="#8A6B3C" />
        <line x1="30" y1="6" x2="30" y2="30" stroke="#2DD4BF" strokeWidth="1.4" opacity="0.7" />
        <circle cx="30" cy="6" r="2.4" fill="#2DD4BF" />
      </svg>
    ),
  },
  {
    n: 2,
    title: 'Decide',
    body: 'A rule-based AI engine runs a transparent check chain — label, damage, weight — then assigns a destination lane with a confidence score.',
    icon: Cpu,
    accent: '#38BDF8',
    illustration: (
      <svg viewBox="0 0 60 40" className="h-full w-full">
        <rect x="18" y="10" width="24" height="20" rx="3" fill="#16223a" stroke="#28374F" />
        <circle cx="30" cy="20" r="5" fill="none" stroke="#38BDF8" strokeWidth="1.6" />
        <circle cx="30" cy="20" r="1.6" fill="#38BDF8" />
        <line x1="18" y1="15" x2="12" y2="15" stroke="#38BDF8" strokeWidth="1.2" />
        <line x1="42" y1="25" x2="48" y2="25" stroke="#38BDF8" strokeWidth="1.2" />
      </svg>
    ),
  },
  {
    n: 3,
    title: 'Act',
    body: 'A robotic diverter arm swings out at the correct gate and pushes the package off the belt into its lane — or the reject chute.',
    icon: Bot,
    accent: '#818CF8',
    illustration: (
      <svg viewBox="0 0 60 40" className="h-full w-full">
        <rect x="6" y="14" width="48" height="6" rx="2" fill="#182437" stroke="#28374F" />
        <rect x="26" y="22" width="10" height="8" rx="1.5" fill="#C9A26B" stroke="#8A6B3C" />
        <g transform="translate(24 10) rotate(28)">
          <rect x="0" y="-2" width="16" height="4" rx="2" fill="#818CF8" />
        </g>
        <circle cx="24" cy="10" r="2.4" fill="#818CF8" />
      </svg>
    ),
  },
  {
    n: 4,
    title: 'Report',
    body: 'Every machine reports live to the operations dashboard — counts, throughput, accuracy and a full event log reconcile in real time.',
    icon: Activity,
    accent: '#34D399',
    illustration: (
      <svg viewBox="0 0 60 40" className="h-full w-full">
        <rect x="8" y="8" width="44" height="24" rx="3" fill="#16223a" stroke="#28374F" />
        <rect x="14" y="20" width="4" height="7" rx="1" fill="#34D399" />
        <rect x="22" y="16" width="4" height="11" rx="1" fill="#34D399" />
        <rect x="30" y="22" width="4" height="5" rx="1" fill="#34D399" />
        <rect x="38" y="13" width="4" height="14" rx="1" fill="#34D399" />
        <polyline points="14,15 22,12 30,14 38,10 44,11" fill="none" stroke="#34D399" strokeWidth="1.2" opacity="0.7" />
      </svg>
    ),
  },
]

export function HowItWorksModal({ open, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  // Read the latest onClose from a ref so the effect below depends only on
  // `open` — otherwise it would tear down/re-run every animation frame (App
  // re-renders each frame while the line runs) and steal focus repeatedly.
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open) return
    const opener = document.activeElement as HTMLElement | null

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current()
        return
      }
      if (e.key !== 'Tab' || !panelRef.current) return
      // Trap focus within the dialog
      const nodes = panelRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      if (nodes.length === 0) return
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', onKey)
    closeRef.current?.focus()
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      // Return focus to the control that opened the dialog
      opener?.focus?.()
    }
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="hiw-title"
    >
      <div
        className="absolute inset-0 bg-base/80 backdrop-blur-sm animate-fade-in"
        onClick={() => onCloseRef.current()}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        className="relative z-10 w-full max-w-2xl animate-scale-in rounded-xl border border-line-strong bg-surface shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-line px-5 py-4">
          <div>
            <h2 id="hiw-title" className="text-base font-bold text-ink">
              How SortFlow works
            </h2>
            <p className="mt-0.5 text-2xs text-ink-muted">
              The Industry 4.0 loop, one package at a time — sense, decide, act, report.
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="focusable rounded-md border border-line bg-surface-inset p-1.5 text-ink-muted transition-colors hover:border-line-strong hover:text-ink"
          >
            <X size={16} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2">
          {STEPS.map((step) => {
            const Icon = step.icon
            return (
              <div key={step.n} className="rounded-lg border border-line bg-surface-inset p-4">
                <div className="flex items-center gap-2.5">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-md"
                    style={{ backgroundColor: `${step.accent}1a`, color: step.accent }}
                  >
                    <Icon size={16} />
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="nums text-2xs font-bold" style={{ color: step.accent }}>
                      0{step.n}
                    </span>
                    <h3 className="text-sm font-semibold text-ink">{step.title}</h3>
                  </div>
                </div>
                <div
                  className="mt-3 h-16 w-full rounded-md border border-line bg-base/50"
                  style={{ borderColor: COLORS.line }}
                >
                  {step.illustration}
                </div>
                <p className="mt-3 text-2xs leading-relaxed text-ink-soft">{step.body}</p>
              </div>
            )
          })}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-3.5">
          <p className="text-2xs text-ink-muted">
            Fully client-side simulation — no two runs are alike. Try the scenario buttons to stress the line.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="focusable shrink-0 rounded-md bg-brand px-3.5 py-2 text-xs font-semibold text-[#04120f] transition-colors hover:bg-brand-bright"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}
