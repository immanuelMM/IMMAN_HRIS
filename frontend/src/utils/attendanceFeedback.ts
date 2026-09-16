export type FeedbackTone = 'success' | 'warning' | 'info' | 'neutral'

export interface AttendanceFeedback {
  message: string
  tone: FeedbackTone
}

const TOO_EARLY_MINUTES = 6 * 60 // before 6:00 AM
const ON_TIME_CUTOFF_MINUTES = 8 * 60 + 15 // 8:15 AM grace period
const FULL_DAY_HOURS_THRESHOLD = 7.5 // close enough to 8 worked hours to count as a full day

export function getTimeInFeedback(timeInIso: string): AttendanceFeedback {
  const d = new Date(timeInIso)
  const minutes = d.getHours() * 60 + d.getMinutes()

  if (minutes < TOO_EARLY_MINUTES) {
    return { message: "You're in early — the shift hasn't started yet.", tone: 'info' }
  }
  if (minutes <= ON_TIME_CUTOFF_MINUTES) {
    return { message: 'Good morning! You are on time.', tone: 'success' }
  }
  return { message: "You're late today.", tone: 'warning' }
}

export function getTimeOutFeedback(timeInIso: string | null, timeOutIso: string): AttendanceFeedback {
  if (!timeInIso) {
    return { message: 'Time out recorded.', tone: 'neutral' }
  }

  const hoursWorked = (new Date(timeOutIso).getTime() - new Date(timeInIso).getTime()) / 3_600_000 - 1
  if (hoursWorked >= FULL_DAY_HOURS_THRESHOLD) {
    return { message: 'Nice work! Full day completed.', tone: 'success' }
  }
  return { message: "Clocked out early today — noted.", tone: 'neutral' }
}
