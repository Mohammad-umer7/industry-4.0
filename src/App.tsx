import { useState } from 'react'
import { Pause } from 'lucide-react'
import { useSimulation } from './hooks/useSimulation'
import { useReducedMotion } from './hooks/useReducedMotion'
import { Header } from './components/Header'
import { ConveyorScene } from './components/ConveyorScene'
import { DecisionPanel } from './components/DecisionPanel'
import { Dashboard } from './components/Dashboard'
import { EventLog } from './components/EventLog'
import { ControlBar } from './components/ControlBar'
import { HowItWorksModal } from './components/HowItWorksModal'

export default function App() {
  const { engine, frame, controls } = useSimulation()
  const reducedMotion = useReducedMotion()
  const [howOpen, setHowOpen] = useState(false)

  const running = engine.running
  const surgeActive = engine.surgeActive

  return (
    <div className="flex min-h-screen flex-col lg:h-screen lg:min-h-0 lg:overflow-hidden">
      <Header
        running={running}
        surgeActive={surgeActive}
        surgeSecondsLeft={engine.surgeSecondsLeft}
        throughput={engine.stats.throughput}
        clock={engine.clock}
        onHowItWorks={() => setHowOpen(true)}
      />

      {/* small-screen advisory (layout still works, just denser) */}
      <div className="border-b border-line bg-warn/5 px-4 py-1.5 text-center text-2xs text-warn/80 lg:hidden">
        SortFlow is a control-room display — best viewed on a desktop at 1280px or wider.
      </div>

      <main className="flex min-h-0 flex-1 flex-col gap-3 p-3 lg:flex-row">
        {/* conveyor scene */}
        <section className="panel relative flex min-h-[300px] flex-col overflow-hidden lg:min-h-0 lg:flex-1">
          <div className="pointer-events-none absolute left-3 top-3 z-10 flex items-center gap-2">
            <span className="rounded border border-line bg-base/60 px-2 py-1 text-[9px] font-semibold uppercase tracking-label text-ink-muted backdrop-blur-sm">
              Sortation Line 01
            </span>
            <span className="flex items-center gap-1 rounded border border-line bg-base/60 px-2 py-1 text-[9px] font-semibold uppercase tracking-label text-ink-muted backdrop-blur-sm">
              <span className={`h-1.5 w-1.5 rounded-full ${running ? 'bg-healthy animate-pulse-dot' : 'bg-ink-muted'}`} />
              {running ? 'Live' : 'Held'}
            </span>
          </div>

          <div className={`min-h-0 flex-1 transition-opacity duration-300 ${running ? 'opacity-100' : 'opacity-50'}`}>
            <ConveyorScene engine={engine} frame={frame} reducedMotion={reducedMotion} />
          </div>

          {/* surge tint */}
          {surgeActive && (
            <div
              className="pointer-events-none absolute inset-0 z-10"
              style={{
                background:
                  'radial-gradient(120% 60% at 50% 0%, rgba(251,191,36,0.12), transparent 60%)',
              }}
            />
          )}

          {/* paused watermark */}
          {!running && (
            <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-line-strong bg-surface/80 text-ink-soft backdrop-blur-sm">
                  <Pause size={20} />
                </div>
                <span className="text-2xl font-bold uppercase tracking-[0.4em] text-ink-soft/70">Paused</span>
              </div>
            </div>
          )}
        </section>

        {/* telemetry sidebar */}
        <aside className="flex w-full min-h-0 shrink-0 flex-col gap-3 lg:w-[33%] lg:min-w-[336px] lg:max-w-[440px]">
          <div className="flex min-h-[248px] flex-[5_1_0%] flex-col">
            <DecisionPanel engine={engine} v={engine.vScan} />
          </div>
          <Dashboard engine={engine} v={engine.vStats} />
          <div className="flex min-h-[150px] flex-[4_1_0%] flex-col">
            <EventLog engine={engine} v={engine.vLog} />
          </div>
        </aside>
      </main>

      <ControlBar
        running={running}
        speed={engine.speed}
        spawnRate={engine.spawnRate}
        surgeActive={surgeActive}
        surgeSecondsLeft={engine.surgeSecondsLeft}
        controls={controls}
      />

      <HowItWorksModal open={howOpen} onClose={() => setHowOpen(false)} />
    </div>
  )
}
