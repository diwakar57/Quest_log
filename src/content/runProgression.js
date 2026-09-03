// 12-week run progression, one entry per week, from walk/jog intervals to a continuous run.
// XP ramps 15 -> 45 across the program.
export const runProgression = [
  { name: 'Week 1 — Walk/Jog Intervals', desc: '8 rounds: 1 minute jog, 2 minutes walk.', xp: 15 },
  { name: 'Week 2 — Walk/Jog Intervals', desc: '6 rounds: 1.5 minutes jog, 2 minutes walk.', xp: 18 },
  { name: 'Week 3 — Walk/Jog Intervals', desc: '6 rounds: 2 minutes jog, 1.5 minutes walk.', xp: 20 },
  { name: 'Week 4 — Walk/Jog Intervals', desc: '5 rounds: 3 minutes jog, 1.5 minutes walk.', xp: 23 },
  { name: 'Week 5 — Walk/Jog Intervals', desc: '4 rounds: 4 minutes jog, 1.5 minutes walk.', xp: 25 },
  { name: 'Week 6 — Walk/Jog Intervals', desc: '4 rounds: 5 minutes jog, 1 minute walk.', xp: 28 },
  { name: 'Week 7 — Extended Intervals', desc: '3 rounds: 7 minutes jog, 1 minute walk.', xp: 30 },
  { name: 'Week 8 — Extended Intervals', desc: '2 rounds: 9 minutes jog, 1 minute walk, then a final 5-minute jog.', xp: 33 },
  { name: 'Week 9 — Split Continuous Run', desc: '12 minutes continuous jog, 2 minutes walk, then 10 minutes continuous jog.', xp: 35 },
  { name: 'Week 10 — Split Continuous Run', desc: '15 minutes continuous jog, 2 minutes walk, then 6 minutes continuous jog.', xp: 38 },
  { name: 'Week 11 — Near-Continuous Run', desc: '20 minutes of continuous running at an easy, conversational pace.', xp: 40 },
  { name: 'Week 12 — Continuous Run', desc: '25 minutes of continuous running with no walk breaks.', xp: 45 },
]

export default runProgression
