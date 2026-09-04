// level N requires round(50 * N^1.6) cumulative XP — fast growth early, sharply
// slower at higher levels (see Claude_Code_Build_Tasks.md TASK 8).
export function xpForLevel(n) {
  return Math.round(50 * Math.pow(n, 1.6))
}

export function levelForXp(totalXp) {
  let level = 0
  while (xpForLevel(level + 1) <= totalXp) {
    level++
  }
  return level
}

export const XP_FIELDS = ['strength_xp', 'endurance_xp', 'discipline_xp', 'nutrition_xp']

export function totalXpFrom(xpStats) {
  return XP_FIELDS.reduce((sum, field) => sum + (xpStats?.[field] ?? 0), 0)
}
