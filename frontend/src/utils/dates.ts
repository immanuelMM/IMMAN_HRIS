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
