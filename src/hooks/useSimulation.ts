import { useCallback, useEffect, useMemo, useState } from 'react'
import { createEngine, type Engine } from '../sim/engine'
import type { Scenario } from '../sim/types'

export interface SimControls {
  toggleRunning: () => void
  setSpeed: (speed: number) => void
  setSpawnRate: (rate: number) => void
  injectScenario: (kind: Scenario) => void
  startSurge: () => void
  reset: () => void
}

export interface Simulation {
  engine: Engine
  /** Increments every animation frame the engine advances; forces re-render. */
  frame: number
  controls: SimControls
}

/**
 * Drives the engine from a single requestAnimationFrame loop and exposes it to
 * React. The engine is the single source of truth — components read its live
 * (mutated-in-place) state during render. We only trigger React re-renders:
 *   • every frame while running (via `frame`), and
 *   • once after any control action while paused (via `bump`).
 * Memoized panels then decide whether to actually re-render off the engine's
 * version counters, keeping the hot path allocation-free.
 */
export function useSimulation(): Simulation {
  const engine = useMemo(() => createEngine(), [])
  const [frame, setFrame] = useState(0)
  const bump = useCallback(() => setFrame((f) => (f + 1) & 0xffffff), [])

  useEffect(() => {
    let raf = 0
    let last = 0
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop)
      if (last === 0) {
        last = t
        return
      }
      let dt = t - last
      last = t
      if (!engine.running) return
      // Clamp large gaps (tab was backgrounded) so nothing teleports
      if (dt > 100) dt = 100
      engine.tick(dt)
      setFrame((f) => (f + 1) & 0xffffff)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [engine])

  const controls = useMemo<SimControls>(
    () => ({
      toggleRunning: () => {
        engine.toggleRunning()
        bump()
      },
      setSpeed: (speed) => {
        engine.setSpeed(speed)
        bump()
      },
      setSpawnRate: (rate) => {
        engine.setSpawnRate(rate)
        bump()
      },
      injectScenario: (kind) => {
        engine.injectScenario(kind)
        bump()
      },
      startSurge: () => {
        engine.startSurge()
        bump()
      },
      reset: () => {
        engine.reset()
        bump()
      },
    }),
    [engine, bump],
  )

  return { engine, frame, controls }
}
