export const SESSION_STATUSES = ['scheduled', 'completed', 'cancelled'] as const

export type SessionStatus = (typeof SESSION_STATUSES)[number]

export const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
  scheduled: 'Scheduled',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

/** A training session. `startsAt` is always an ISO 8601 string across the client boundary. */
export type Session = {
  id: string
  title: string
  status: SessionStatus
  startsAt: string
}

/** Payload accepted by the client boundary. `title` is already trimmed, `startsAt` is ISO 8601. */
export type CreateSessionInput = {
  title: string
  startsAt: string
}

export type StatusFilterValue = 'all' | SessionStatus

/** Mutually exclusive list states -- makes "loading" and "no sessions" unrepresentable together. */
export type SessionsListState =
  | { status: 'loading' }
  | { status: 'ready'; sessions: readonly Session[] }
  | { status: 'error'; message: string }

/** Mutually exclusive create states, used instead of stacked booleans. */
export type CreateSessionState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'error'; message: string }
