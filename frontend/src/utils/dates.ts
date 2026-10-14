/** Formats a Date using its local calendar date (not UTC), as "yyyy-MM-dd" —
 * matches how the backend's `DateOnly` fields are keyed to the server's local date. */
export function toLocalDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function todayLocalDateString(): string {
  return toLocalDateString(new Date())
}

/** Humanizes the span between two ISO "yyyy-MM-dd" dates (end defaults to
 * today) as e.g. "3 yrs 2 mos", "7 mos", or "Today" — used for auto-computed
 * tenure fields like years-in-department or time-since-sabbath-date. */
export function formatDurationSince(startDate: string, endDate?: string | null): string {
  const start = new Date(startDate)
  const end = endDate ? new Date(endDate) : new Date()
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return '—'
  }

  let years = end.getFullYear() - start.getFullYear()
  let months = end.getMonth() - start.getMonth()
  if (end.getDate() < start.getDate()) {
    months -= 1
  }
  if (months < 0) {
    years -= 1
    months += 12
  }

  if (years === 0 && months === 0) {
    return 'Today'
  }
  const parts: string[] = []
  if (years > 0) parts.push(`${years} yr${years === 1 ? '' : 's'}`)
  if (months > 0) parts.push(`${months} mo${months === 1 ? '' : 's'}`)
  return parts.join(' ')
}
