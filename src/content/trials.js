// Performance test for each tier transition. `tier` is the tier being left.
export const trials = [
  {
    tier: 0,
    name: 'Foundation Trial',
    criteria: 'Hold a plank for 30 seconds, complete 12 clean bodyweight squats, and finish a 20-minute walk.',
    xpReward: 50,
  },
  {
    tier: 1,
    name: 'Momentum Trial',
    criteria: 'Complete 15 knee push-ups, hold a plank for 45 seconds, and jog for 5 continuous minutes.',
    xpReward: 60,
  },
  {
    tier: 2,
    name: 'Builder Trial',
    criteria: 'Complete 10 standard push-ups, 10 inverted rows, and a 10-minute continuous jog.',
    xpReward: 70,
  },
  {
    tier: 3,
    name: 'Grinder Trial',
    criteria: 'Complete 20 standard push-ups, hold a hollow body position for 30 seconds, and run continuously for 15 minutes.',
    xpReward: 80,
  },
  {
    tier: 4,
    name: 'Forge Trial',
    criteria: 'Complete 5 strict pull-ups (or a 60-second negative pull-up), 25 push-ups, and a 20-minute continuous run.',
    xpReward: 90,
  },
  {
    tier: 5,
    name: 'Ascension Trial',
    criteria: 'Complete 10 strict pull-ups, 40 push-ups within 2 minutes, and a continuous 25-minute run.',
    xpReward: 100,
  },
]

export default trials
