import { formatStartsAt } from './formatStartsAt.ts'
import { SESSION_STATUS_LABELS } from './types.ts'
import type { Session } from './types.ts'

type SessionListProps = {
  sessions: readonly Session[]
}

export function SessionList({ sessions }: SessionListProps) {
  return (
    <ul className="session-list">
      {sessions.map((session) => (
        <li className="session-list__row" key={session.id}>
          <h2 className="session-list__title">{session.title}</h2>
          <span
            className={`session-list__status session-list__status--${session.status}`}
          >
            {SESSION_STATUS_LABELS[session.status]}
          </span>
          <time className="session-list__starts-at" dateTime={session.startsAt}>
            {formatStartsAt(session.startsAt)}
          </time>
        </li>
      ))}
    </ul>
  )
}
