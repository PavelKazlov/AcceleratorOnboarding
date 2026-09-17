import type { CreateSessionInput } from './types.ts'

export const TITLE_MIN_LENGTH = 3
export const TITLE_MAX_LENGTH = 80

export const TITLE_LENGTH_MESSAGE = `Title must be between ${TITLE_MIN_LENGTH} and ${TITLE_MAX_LENGTH} characters.`
export const STARTS_AT_REQUIRED_MESSAGE =
  'Start date and time is required and must be in the future.'
export const STARTS_AT_FUTURE_MESSAGE = 'Start date and time must be in the future.'

export type SessionDraft = {
  title: string
  /** Raw value of a `datetime-local` input, for example `2026-10-01T14:30`. */
  startsAt: string
}

export type SessionDraftErrors = {
  title?: string
  startsAt?: string
}

export type SessionDraftValidation = {
  values: CreateSessionInput
  errors: SessionDraftErrors
}

/**
 * Pure validation for the create form. `now` is injected so the future-date rule stays
 * clock-independent. This is also the single conversion point from the local-time
 * `datetime-local` value to the ISO 8601 string the client boundary expects.
 */
export function validateSessionDraft(
  draft: SessionDraft,
  now: Date,
): SessionDraftValidation {
  const title = draft.title.trim()
  const errors: SessionDraftErrors = {}

  if (title.length < TITLE_MIN_LENGTH || title.length > TITLE_MAX_LENGTH) {
    errors.title = TITLE_LENGTH_MESSAGE
  }

  const rawStartsAt = draft.startsAt.trim()
  let startsAt = ''

  if (rawStartsAt === '') {
    errors.startsAt = STARTS_AT_REQUIRED_MESSAGE
  } else {
    const parsed = new Date(rawStartsAt)
    if (Number.isNaN(parsed.getTime())) {
      errors.startsAt = STARTS_AT_REQUIRED_MESSAGE
    } else if (parsed.getTime() <= now.getTime()) {
      errors.startsAt = STARTS_AT_FUTURE_MESSAGE
    } else {
      startsAt = parsed.toISOString()
    }
  }

  return { values: { title, startsAt }, errors }
}

export function hasValidationErrors(errors: SessionDraftErrors): boolean {
  return errors.title !== undefined || errors.startsAt !== undefined
}
