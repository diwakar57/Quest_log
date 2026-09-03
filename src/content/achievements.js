// Achievement unlock conditions, described in plain text (checked elsewhere in app logic).
export const achievements = [
  { key: 'first_workout', name: 'First Rep', condition: 'Complete your first workout quest.' },
  { key: 'first_rest', name: 'Rest Easy', condition: 'Complete your first rest day quest.' },
  { key: 'first_meal', name: 'Fueled Up', condition: 'Complete your first meal quest.' },
  { key: 'first_run', name: 'First Mile', condition: 'Complete your first run-day quest.' },
  { key: 'streak_7', name: 'One Week Strong', condition: 'Reach a 7-day streak.' },
  { key: 'streak_30', name: 'Iron Habit', condition: 'Reach a 30-day streak.' },
  { key: 'first_trial_cleared', name: 'Trial by Fire', condition: 'Clear your first Trial.' },
  { key: 'tier_5_reached', name: 'Peak Tier', condition: 'Reach Tier 5.' },
  { key: 'ten_workouts', name: 'Getting Reps In', condition: 'Complete 10 total workout quests.' },
  { key: 'perfect_week', name: 'Perfect Week', condition: 'Complete both required quests every day for 7 consecutive days.' },
]

export default achievements
