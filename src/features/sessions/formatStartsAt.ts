const START_FORMATTER = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})

/** Renders an ISO 8601 instant in the browser locale and timezone. */
export function formatStartsAt(startsAt: string): string {
  const parsed = new Date(startsAt)
  if (Number.isNaN(parsed.getTime())) {
    return 'Unknown date'
  }
  return START_FORMATTER.format(parsed)
}
