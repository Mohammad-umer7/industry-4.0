import { memo } from 'react'
import { Terminal } from 'lucide-react'
import type { Engine } from '../sim/engine'
import type { LogEntry, LogKind } from '../sim/types'

interface Props {
  engine: Engine
  v: number
}

const DOT: Record<LogKind, string> = {
  route: 'bg-brand-bright',
  reject: 'bg-danger',
  scenario: 'bg-warn',
  system: 'bg-ink-faint',
}

const TEXT: Record<LogKind, string> = {
  route: 'text-ink-soft',
  reject: 'text-danger/90',
  scenario: 'text-warn/90',
  system: 'text-ink-muted',
}

function Row({ entry }: { entry: LogEntry }) {
  return (
    <li className="flex items-start gap-2 px-3.5 py-1 leading-relaxed">
      <span className={`mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full ${DOT[entry.kind]}`} />
      <span className="mt-px shrink-0 text-ink-faint">{entry.time}</span>
      <span className={`min-w-0 flex-1 ${TEXT[entry.kind]}`}>{entry.text}</span>
    </li>
  )
}

function EventLogImpl({ engine }: Props) {
  const entries = engine.log
  const count = entries.length

  return (
    <section className="panel flex min-h-0 flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-line px-3.5 py-2.5">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-brand-bright" />
          <h2 className="panel-title">Event Log</h2>
        </div>
        <span className="nums text-2xs text-ink-muted">{count} events</span>
      </header>

      <ol className="scroll-slim min-h-0 flex-1 overflow-y-auto py-1 font-mono text-[11.5px]">
        {count === 0 ? (
          <li className="px-3.5 py-3 text-2xs text-ink-muted">No events yet.</li>
        ) : (
          // newest first
          entries
            .slice()
            .reverse()
            .map((entry) => <Row key={entry.id} entry={entry} />)
        )}
      </ol>
    </section>
  )
}

export const EventLog = memo(EventLogImpl)
