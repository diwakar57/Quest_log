import { useEffect } from 'react'
import { playTrialCleared } from '../lib/sound'

// Tier is stored 0-indexed internally (workoutPools[0..5]) — +1 here is a
// display-only adjustment so users see "Tier 1" instead of "Tier 0", never
// fed back into any tier calculation or storage.
export default function TrialClearedOverlay({ beforeTier, afterTier, trialContent, onContinue }) {
  // Fires on mount, not from the "Clear it" click handler that triggered this
  // component to render — so the sound lines up with the overlay actually
  // appearing, independent of how it got triggered.
  useEffect(() => {
    playTrialCleared()
  }, [])

  return (
    <div className="tc-backdrop">
      <div className="tc-overlay">
        <div className="tc-scanline" />
        <div className="bl" /><div className="br" />

        <div className="tc-head">
          <p className="tc-eyebrow">System Notification</p>
          <p className="tc-title">Trial Cleared</p>
          <p className="tc-sub">You proved it. Not just logged it.</p>
        </div>

        <div className="tc-body">
          <div className="tc-tier-line">
            <div className="tc-tier-box">
              <div className="lbl">Tier</div>
              <div className="val">{String(beforeTier + 1).padStart(2, '0')}</div>
            </div>
            <span className="tc-arrow">»</span>
            <div className="tc-tier-box next">
              <div className="lbl">Tier</div>
              <div className="val">{String(afterTier + 1).padStart(2, '0')}</div>
            </div>
          </div>

          <div className="divider"><span>Cleared Criteria</span></div>
          <div className="tc-criteria-line">
            <i className="ti ti-check" />
            {trialContent.criteria}
          </div>

          <div className="divider"><span>Rewards</span></div>
          <div className="tc-reward-row">
            <div className="tc-reward-cell">
              <div className="lbl">XP Earned</div>
              <div className="num">+{trialContent.xpReward}</div>
            </div>
            <div className="tc-reward-cell">
              <div className="lbl">Pool Unlocked</div>
              <div className="num">Tier {afterTier + 1}</div>
            </div>
          </div>

          <button onClick={onContinue} className="quest-btn mt-4">
            [ Continue ]
          </button>
        </div>
      </div>
    </div>
  )
}
