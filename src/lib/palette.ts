import type { Route } from '../sim/types'

/**
 * Concrete hex values mirroring the Tailwind theme, for use inside SVG where
 * utility classes are awkward. Keep these in sync with tailwind.config.js.
 */
export const ROUTE_COLOR: Record<Route, string> = {
  A: '#2DD4BF',
  B: '#38BDF8',
  C: '#818CF8',
  REJECT: '#FB7185',
}

export const ROUTE_LABEL: Record<Route, string> = {
  A: 'Lane A',
  B: 'Lane B',
  C: 'Lane C',
  REJECT: 'Reject',
}

export const COLORS = {
  base: '#0B1220',
  surface: '#0F1826',
  surfaceRaised: '#141E30',
  line: '#1E2A3E',
  lineStrong: '#28374F',
  brand: '#14B8A6',
  brandBright: '#2DD4BF',
  healthy: '#34D399',
  warn: '#FBBF24',
  danger: '#F87171',
  ink: '#E6EDF7',
  inkSoft: '#AEBED6',
  inkMuted: '#6B7C99',
  // package body (warm cardboard so a box reads as a box on the dark line)
  boxFill: '#C9A26B',
  boxFillTop: '#E0BE8B',
  boxEdge: '#8A6B3C',
} as const
