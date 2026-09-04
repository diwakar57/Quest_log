// Procedurally-generated UI sound effects via the Web Audio API — no audio
// files, no licensing concerns. Every playX() is safe to call unconditionally:
// it no-ops silently if muted, if AudioContext isn't available (e.g. tests,
// unsupported environments), or if creating it throws for any reason.

let audioContext = null
let soundEnabled = true

export function setSoundEnabled(value) {
  soundEnabled = Boolean(value)
}

function getAudioContext() {
  if (!audioContext) {
    try {
      const Ctor = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext)
      if (!Ctor) return null
      // Created lazily here, on the first actual playX() call from a user
      // gesture handler (click, etc.) — never at module load / page load —
      // so this respects browsers' autoplay policies by construction.
      audioContext = new Ctor()
    } catch {
      return null
    }
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume().catch(() => {})
  }
  return audioContext
}

// A single tone with a short linear attack/release envelope (avoids the
// audible click/pop a hard on/off gain transition would cause).
function playTone(freq, duration, { type = 'sine', gain = 0.07, delay = 0 } = {}) {
  if (!soundEnabled) return
  const ctx = getAudioContext()
  if (!ctx) return

  const startTime = ctx.currentTime + delay
  const stopTime = startTime + duration

  const osc = ctx.createOscillator()
  const gainNode = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, startTime)

  gainNode.gain.setValueAtTime(0, startTime)
  gainNode.gain.linearRampToValueAtTime(gain, startTime + Math.min(0.01, duration / 4))
  gainNode.gain.linearRampToValueAtTime(0, stopTime)

  osc.connect(gainNode)
  gainNode.connect(ctx.destination)
  osc.start(startTime)
  osc.stop(stopTime)
}

// General button press / toggle / nav switch. ~80ms.
export function playClick() {
  playTone(600, 0.08, { type: 'sine', gain: 0.05 })
}

// Workout/meal quest marked complete. Two-note rising blip, ~150ms.
export function playComplete() {
  playTone(500, 0.08, { gain: 0.08 })
  playTone(750, 0.08, { gain: 0.08, delay: 0.07 })
}

// Level crossed (called only when levelForXp increases). Ascending
// 4-note arpeggio, ~400ms, louder than the other cues.
export function playLevelUp() {
  const notes = [400, 500, 650, 800]
  notes.forEach((freq, i) => {
    playTone(freq, 0.12, { gain: 0.11, delay: i * 0.1 })
  })
}

// Trial cleared — a bigger milestone than a level-up, so it gets a fuller
// chime: each step layers a fifth above the root for more harmonic body,
// over more time (~500ms) than playLevelUp.
export function playTrialCleared() {
  const steps = [440, 550, 660, 880]
  steps.forEach((freq, i) => {
    const delay = i * 0.1
    playTone(freq, 0.18, { gain: 0.1, delay })
    playTone(freq * 1.5, 0.18, { gain: 0.05, delay })
  })
}

// Invalid input or a failed action. Two-note descending blip, ~150ms.
export function playError() {
  playTone(400, 0.08, { type: 'square', gain: 0.06 })
  playTone(250, 0.08, { type: 'square', gain: 0.06, delay: 0.07 })
}
