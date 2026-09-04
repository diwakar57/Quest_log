import { describe, it, expect } from 'vitest'
import { setSoundEnabled, playClick, playComplete, playLevelUp, playTrialCleared, playError } from './sound'

// jsdom (the test environment) has no AudioContext — these assert the module
// degrades gracefully (no throw) rather than testing actual audio output,
// which isn't observable outside a real browser.
describe('sound', () => {
  it('every playX() is a no-op that never throws without AudioContext support', () => {
    expect(() => playClick()).not.toThrow()
    expect(() => playComplete()).not.toThrow()
    expect(() => playLevelUp()).not.toThrow()
    expect(() => playTrialCleared()).not.toThrow()
    expect(() => playError()).not.toThrow()
  })

  it('setSoundEnabled toggles without throwing, muted or not', () => {
    setSoundEnabled(false)
    expect(() => playClick()).not.toThrow()
    setSoundEnabled(true)
    expect(() => playClick()).not.toThrow()
  })
})
