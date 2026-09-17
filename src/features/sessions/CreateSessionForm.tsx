import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import {
  hasValidationErrors,
  validateSessionDraft,
} from './validateSessionDraft.ts'
import type { SessionDraftErrors } from './validateSessionDraft.ts'
import type { CreateSessionInput, CreateSessionState } from './types.ts'

const TITLE_ERROR_ID = 'create-session-title-error'
const STARTS_AT_ERROR_ID = 'create-session-starts-at-error'

type CreateSessionFormProps = {
  createState: CreateSessionState
  onSubmit: (input: CreateSessionInput) => void
  onDismiss: () => void
}

export function CreateSessionForm({
  createState,
  onSubmit,
  onDismiss,
}: CreateSessionFormProps) {
  const [title, setTitle] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [errors, setErrors] = useState<SessionDraftErrors>({})

  const titleRef = useRef<HTMLInputElement>(null)
  const startsAtRef = useRef<HTMLInputElement>(null)

  const isSubmitting = createState.status === 'submitting'

  // The form is mounted only while it is open, and it only opens on a deliberate
  // activation of the trigger, so moving focus to the first field on mount is the
  // continuation of that gesture rather than an unsolicited focus steal.
  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const result = validateSessionDraft({ title, startsAt }, new Date())
    setErrors(result.errors)

    if (hasValidationErrors(result.errors)) {
      // Input is intentionally left untouched so the user keeps what they typed.
      const firstInvalid =
        result.errors.title !== undefined ? titleRef.current : startsAtRef.current
      firstInvalid?.focus()
      return
    }

    onSubmit(result.values)
  }

  return (
    <form className="create-session" onSubmit={handleSubmit} noValidate>
      <h2>New session</h2>

      <div className="create-session__field">
        <label htmlFor="create-session-title">Title</label>
        <input
          id="create-session-title"
          name="title"
          type="text"
          autoComplete="off"
          value={title}
          ref={titleRef}
          aria-invalid={errors.title !== undefined ? true : undefined}
          aria-describedby={errors.title !== undefined ? TITLE_ERROR_ID : undefined}
          onChange={(event) => {
            setTitle(event.target.value)
          }}
        />
        {errors.title !== undefined ? (
          <p className="create-session__error" id={TITLE_ERROR_ID} role="alert">
            {errors.title}
          </p>
        ) : null}
      </div>

      <div className="create-session__field">
        <label htmlFor="create-session-starts-at">Start date and time</label>
        <input
          id="create-session-starts-at"
          name="startsAt"
          type="datetime-local"
          autoComplete="off"
          value={startsAt}
          ref={startsAtRef}
          aria-invalid={errors.startsAt !== undefined ? true : undefined}
          aria-describedby={
            errors.startsAt !== undefined ? STARTS_AT_ERROR_ID : undefined
          }
          onChange={(event) => {
            setStartsAt(event.target.value)
          }}
        />
        {errors.startsAt !== undefined ? (
          <p
            className="create-session__error"
            id={STARTS_AT_ERROR_ID}
            role="alert"
          >
            {errors.startsAt}
          </p>
        ) : null}
      </div>

      {createState.status === 'error' ? (
        <p className="create-session__error" role="alert">
          {createState.message}
        </p>
      ) : null}

      <div className="create-session__actions">
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating…' : 'Create session'}
        </button>
        <button type="button" onClick={onDismiss} disabled={isSubmitting}>
          Cancel
        </button>
      </div>
    </form>
  )
}
