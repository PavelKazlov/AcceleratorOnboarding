import {
  MOCK_LATENCY_MS,
  appendSession,
  readSessions,
  shouldFailCreateRequest,
  shouldFailListRequest,
} from './mockSessions.ts'
import type { CreateSessionInput, Session } from './types.ts'

/**
 * The single boundary for every session read and write. Swapping the mock for a real HTTP
 * backend means rewriting the bodies below; no hook or view component changes.
 */

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export async function listSessions(): Promise<Session[]> {
  await delay(MOCK_LATENCY_MS)
  if (shouldFailListRequest()) {
    throw new Error('listSessions failed')
  }
  return readSessions()
}

export async function createSession(input: CreateSessionInput): Promise<Session> {
  await delay(MOCK_LATENCY_MS)
  if (shouldFailCreateRequest()) {
    throw new Error('createSession failed')
  }
  return appendSession(input)
}
