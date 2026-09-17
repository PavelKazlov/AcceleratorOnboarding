import { useCallback, useEffect, useRef, useState } from 'react'
import { createSession, listSessions } from './sessionsClient.ts'
import type {
  CreateSessionInput,
  CreateSessionState,
  SessionsListState,
} from './types.ts'

const LOAD_ERROR_MESSAGE = 'We could not load your sessions. Please try again.'
const CREATE_ERROR_MESSAGE =
  'We could not create the session. Please try again.'

const IDLE_CREATE_STATE: CreateSessionState = { status: 'idle' }

export type UseSessionsResult = {
  listState: SessionsListState
  createState: CreateSessionState
  retry: () => void
  submitSession: (input: CreateSessionInput) => Promise<boolean>
  resetCreateState: () => void
}

export function useSessions(): UseSessionsResult {
  const [listState, setListState] = useState<SessionsListState>({
    status: 'loading',
  })
  const [createState, setCreateState] =
    useState<CreateSessionState>(IDLE_CREATE_STATE)

  // In-flight guards keep the request count at exactly one. React StrictMode remounts
  // effects in development, and the user can activate retry or submit twice.
  const loadInFlightRef = useRef(false)
  const createInFlightRef = useRef(false)

  const load = useCallback(() => {
    if (loadInFlightRef.current) {
      return
    }
    loadInFlightRef.current = true

    void listSessions()
      .then((sessions) => {
        setListState({ status: 'ready', sessions })
      })
      .catch(() => {
        // Transport detail is intentionally not surfaced to the user.
        setListState({ status: 'error', message: LOAD_ERROR_MESSAGE })
      })
      .finally(() => {
        loadInFlightRef.current = false
      })
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const retry = useCallback(() => {
    if (loadInFlightRef.current) {
      return
    }
    setListState({ status: 'loading' })
    load()
  }, [load])

  const submitSession = useCallback(
    async (input: CreateSessionInput): Promise<boolean> => {
      if (createInFlightRef.current) {
        return false
      }
      createInFlightRef.current = true
      setCreateState({ status: 'submitting' })

      try {
        const created = await createSession(input)
        // The full list is appended to, never replaced by a filtered view.
        setListState((previous) =>
          previous.status === 'ready'
            ? { status: 'ready', sessions: [...previous.sessions, created] }
            : previous,
        )
        setCreateState(IDLE_CREATE_STATE)
        return true
      } catch {
        setCreateState({ status: 'error', message: CREATE_ERROR_MESSAGE })
        return false
      } finally {
        createInFlightRef.current = false
      }
    },
    [],
  )

  const resetCreateState = useCallback(() => {
    setCreateState(IDLE_CREATE_STATE)
  }, [])

  return { listState, createState, retry, submitSession, resetCreateState }
}
