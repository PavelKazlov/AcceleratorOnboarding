import type { CreateSessionInput, Session } from './types.ts'

/**
 * Mock data and mock failure behavior live here only. Nothing in this module may be
 * imported by a view component -- `sessionsClient.ts` is the single consumer.
 */

export const MOCK_LATENCY_MS = 400

const DAY_MS = 24 * 60 * 60 * 1000

function offsetFromNow(days: number, hour: number): string {
  const date = new Date(Date.now() + days * DAY_MS)
  date.setHours(hour, 0, 0, 0)
  return date.toISOString()
}

const SEED_SESSIONS: readonly Session[] = [
  {
    id: 'session-1',
    title: 'React 19 Fundamentals',
    status: 'scheduled',
    startsAt: offsetFromNow(2, 10),
  },
  {
    id: 'session-2',
    title: 'TypeScript Deep Dive',
    status: 'scheduled',
    startsAt: offsetFromNow(5, 14),
  },
  {
    id: 'session-3',
    title: 'Accessibility Workshop',
    status: 'completed',
    startsAt: offsetFromNow(-7, 9),
  },
  {
    id: 'session-4',
    title: 'Design Systems Intro',
    status: 'cancelled',
    startsAt: offsetFromNow(-2, 16),
  },
  {
    id: 'session-5',
    title: 'Performance Clinic',
    status: 'scheduled',
    startsAt: offsetFromNow(12, 11),
  },
]

const NO_SEED_SESSIONS: readonly Session[] = []

/**
 * Demo-only switches, read from the URL inside this module so that no view component
 * depends on the location.
 * - `?mockData=empty` seeds an empty store, so the successful-but-empty list response
 *   (A5) is reachable in the browser; creating a session then repopulates it.
 * - `?mockFail=list` fails the first list request only, so retry visibly recovers.
 * - `?mockFail=create` fails every create request.
 */
function readMockParam(name: string): string | null {
  if (typeof window === 'undefined') {
    return null
  }
  return new URLSearchParams(window.location.search).get(name)
}

let store: readonly Session[] =
  readMockParam('mockData') === 'empty' ? NO_SEED_SESSIONS : SEED_SESSIONS

let idCounter = SEED_SESSIONS.length

function nextId(): string {
  idCounter += 1
  return `session-${idCounter}`
}

function readFailureMode(): string | null {
  return readMockParam('mockFail')
}

let listAttempts = 0

export function shouldFailListRequest(): boolean {
  listAttempts += 1
  return readFailureMode() === 'list' && listAttempts === 1
}

export function shouldFailCreateRequest(): boolean {
  return readFailureMode() === 'create'
}

export function readSessions(): Session[] {
  return store.map((session) => ({ ...session }))
}

export function appendSession(input: CreateSessionInput): Session {
  const created: Session = {
    id: nextId(),
    title: input.title,
    status: 'scheduled',
    startsAt: input.startsAt,
  }
  store = [...store, created]
  return { ...created }
}
