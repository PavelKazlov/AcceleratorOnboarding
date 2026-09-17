import { useEffect, useMemo, useRef, useState } from 'react'
import { CreateSessionForm } from './CreateSessionForm.tsx'
import { SessionList } from './SessionList.tsx'
import { StatusFilter } from './StatusFilter.tsx'
import { useSessions } from './useSessions.ts'
import type { CreateSessionInput, Session, StatusFilterValue } from './types.ts'
import './sessions.css'

const NO_SESSIONS: readonly Session[] = []

export function SessionsWorkspace() {
  const { listState, createState, retry, submitSession, resetCreateState } =
    useSessions()
  const [filter, setFilter] = useState<StatusFilterValue>('all')
  const [formState, setFormState] = useState<'closed' | 'open'>('closed')

  // The full list is never overwritten by a filtered one, so created sessions survive a
  // filter round-trip and no refetch happens when the filter changes.
  const allSessions =
    listState.status === 'ready' ? listState.sessions : NO_SESSIONS

  const visibleSessions = useMemo(
    () =>
      filter === 'all'
        ? allSessions
        : allSessions.filter((session) => session.status === filter),
    [allSessions, filter],
  )

  // The trigger stays mounted while the form is open so that it survives as a focus
  // target. `restoreFocusRef` marks a close that was caused by the user (cancel or a
  // successful create) rather than by the list state changing underneath the form.
  const triggerRef = useRef<HTMLButtonElement>(null)
  const restoreFocusRef = useRef(false)

  useEffect(() => {
    if (formState === 'open' || !restoreFocusRef.current) {
      return
    }
    restoreFocusRef.current = false
    triggerRef.current?.focus()
  }, [formState])

  function openForm() {
    resetCreateState()
    setFormState('open')
  }

  function closeForm() {
    restoreFocusRef.current = true
    setFormState('closed')
  }

  function dismissForm() {
    resetCreateState()
    closeForm()
  }

  function handleSubmit(input: CreateSessionInput) {
    void submitSession(input).then((created) => {
      if (created) {
        closeForm()
      }
    })
  }

  return (
    <section className="sessions">
      <header className="sessions__header">
        <h1>Training sessions</h1>
      </header>

      {listState.status === 'ready' ? (
        <div className="sessions__toolbar">
          <StatusFilter value={filter} onChange={setFilter} />
          <button
            type="button"
            ref={triggerRef}
            onClick={openForm}
            disabled={formState === 'open'}
          >
            New session
          </button>
        </div>
      ) : null}

      {formState === 'open' ? (
        <CreateSessionForm
          createState={createState}
          onSubmit={handleSubmit}
          onDismiss={dismissForm}
        />
      ) : null}

      {listState.status === 'loading' ? (
        <p className="sessions__status" role="status">
          Loading sessions…
        </p>
      ) : null}

      {listState.status === 'error' ? (
        <div className="sessions__status">
          <p role="alert">{listState.message}</p>
          <button type="button" onClick={retry}>
            Retry
          </button>
        </div>
      ) : null}

      {listState.status === 'ready' && visibleSessions.length === 0 ? (
        <p className="sessions__status">
          {allSessions.length === 0
            ? 'No sessions yet. Create your first session.'
            : 'No sessions match the selected status.'}
        </p>
      ) : null}

      {listState.status === 'ready' && visibleSessions.length > 0 ? (
        <SessionList sessions={visibleSessions} />
      ) : null}
    </section>
  )
}
