let audioContext: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioContext) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    audioContext = new Ctor()
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume().catch(() => {})
  }
  return audioContext
}

/** Call synchronously inside a click handler (before any `await`) so the
 * browser still counts audio playback as triggered by a user gesture. */
export function primeAudio() {
  try {
    getAudioContext()
  } catch {
    // Web Audio unavailable — sound effects are a non-critical enhancement.
  }
}

interface Note {
  freq: number
  start: number
  duration: number
  gain?: number
  type?: OscillatorType
}

function playNotes(notes: Note[]) {
  try {
    const ctx = getAudioContext()
    const now = ctx.currentTime
    notes.forEach(({ freq, start, duration, gain = 0.18, type = 'sine' }) => {
      const osc = ctx.createOscillator()
      const gainNode = ctx.createGain()
      osc.type = type
      osc.frequency.value = freq
      gainNode.gain.setValueAtTime(0, now + start)
      gainNode.gain.linearRampToValueAtTime(gain, now + start + 0.02)
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + start + duration)
      osc.connect(gainNode)
      gainNode.connect(ctx.destination)
      osc.start(now + start)
      osc.stop(now + start + duration + 0.05)
    })
  } catch {
    // Web Audio unavailable — sound effects are a non-critical enhancement.
  }
}

/** Cheerful ascending chime — clocked in on time. */
export function playGoodMorningSound() {
  playNotes([
    { freq: 523.25, start: 0, duration: 0.18 },
    { freq: 659.25, start: 0.15, duration: 0.18 },
    { freq: 783.99, start: 0.3, duration: 0.32 },
  ])
}

/** Single soft low note — clocked in well before the shift starts. */
export function playTooEarlySound() {
  playNotes([{ freq: 392.0, start: 0, duration: 0.4, gain: 0.14 }])
}

/** Descending low tones — clocked in late. */
export function playLateSound() {
  playNotes([
    { freq: 329.63, start: 0, duration: 0.2, type: 'triangle', gain: 0.2 },
    { freq: 246.94, start: 0.18, duration: 0.38, type: 'triangle', gain: 0.2 },
  ])
}

/** Pleasant confirm tone — clocked out after a full day. */
export function playNormalOutSound() {
  playNotes([
    { freq: 659.25, start: 0, duration: 0.16 },
    { freq: 880.0, start: 0.14, duration: 0.34 },
  ])
}

/** Neutral two-note ding — clocked out before finishing a full day. */
export function playEarlyOutSound() {
  playNotes([
    { freq: 587.33, start: 0, duration: 0.16, gain: 0.15 },
    { freq: 523.25, start: 0.15, duration: 0.3, gain: 0.15 },
  ])
}

/** Short bright beep — a QR scan was read and accepted. */
export function playScanSuccessSound() {
  playNotes([
    { freq: 987.77, start: 0, duration: 0.12, gain: 0.2 },
    { freq: 1318.51, start: 0.1, duration: 0.2, gain: 0.2 },
  ])
}

/** Low buzzer — a QR scan was rejected or errored. */
export function playScanErrorSound() {
  playNotes([
    { freq: 220, start: 0, duration: 0.22, type: 'sawtooth', gain: 0.18 },
    { freq: 174.61, start: 0.2, duration: 0.28, type: 'sawtooth', gain: 0.18 },
  ])
}
