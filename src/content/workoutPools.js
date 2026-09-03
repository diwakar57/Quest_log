// Bodyweight strength quest pools, indexed by tier (0 = beginner, 5 = advanced).
// 12 entries per tier — enough that a shuffled cycle covers a full ~2-week tier
// with no repeats. XP is uniform per tier (15 -> 45), reflecting that entries
// within a tier are roughly equivalent effort; variety is in exercise choice.
export const workoutPools = [
  // Tier 0 — Beginner (15 XP)
  [
    { key: 'wall_pushups', name: 'Wall Push-ups', desc: '3 sets of 10 wall push-ups, rest 60 seconds between sets.', xp: 15 },
    { key: 'towel_rows', name: 'Towel Rows', desc: '3 sets of 10 towel rows, rest 60 seconds between sets.', xp: 15 },
    { key: 'bodyweight_squats', name: 'Bodyweight Squats', desc: '3 sets of 12 bodyweight squats, rest 60 seconds between sets.', xp: 15 },
    { key: 'plank_hold', name: 'Plank Hold', desc: 'Hold a plank for 20 seconds, 3 attempts.', xp: 15 },
    { key: 'dead_hang', name: 'Dead Hang', desc: 'Hold a dead hang for 15 seconds, 3 attempts.', xp: 15 },
    { key: 'incline_pushups_high', name: 'Incline Push-ups (high)', desc: '3 sets of 8 push-ups with hands on a counter-height surface, rest 60 seconds between sets.', xp: 15 },
    { key: 'seated_leg_raises', name: 'Seated Leg Raises', desc: '3 sets of 12 seated leg raises, rest 45 seconds between sets.', xp: 15 },
    { key: 'standing_calf_raises', name: 'Standing Calf Raises', desc: '3 sets of 15 standing calf raises, rest 45 seconds between sets.', xp: 15 },
    { key: 'bird_dog', name: 'Bird Dog', desc: '3 sets of 8 bird dogs per side, rest 45 seconds between sets.', xp: 15 },
    { key: 'glute_bridge_beginner', name: 'Glute Bridge', desc: '3 sets of 12 glute bridges, rest 45 seconds between sets.', xp: 15 },
    { key: 'marching_in_place', name: 'Marching in Place', desc: '3 sets of 30 seconds marching in place, rest 30 seconds between sets.', xp: 15 },
    { key: 'arm_circles', name: 'Arm Circles', desc: '3 sets of 20 seconds forward and 20 seconds backward arm circles.', xp: 15 },
  ],
  // Tier 1 (21 XP)
  [
    { key: 'knee_pushups', name: 'Knee Push-ups', desc: '3 sets of 12 knee push-ups, rest 60 seconds between sets.', xp: 21 },
    { key: 'doorway_rows', name: 'Doorway Rows', desc: '3 sets of 12 doorway rows, rest 60 seconds between sets.', xp: 21 },
    { key: 'split_squats', name: 'Split Squats', desc: '3 sets of 10 split squats per leg, rest 60 seconds between sets.', xp: 21 },
    { key: 'side_plank', name: 'Side Plank', desc: 'Hold a side plank for 20 seconds per side, 3 attempts.', xp: 21 },
    { key: 'glute_bridges', name: 'Glute Bridges', desc: '3 sets of 15 glute bridges, rest 45 seconds between sets.', xp: 21 },
    { key: 'incline_pushups_low', name: 'Incline Push-ups (low)', desc: '3 sets of 10 push-ups with hands on a chair-height surface, rest 45 seconds between sets.', xp: 21 },
    { key: 'superman_hold', name: 'Superman Hold', desc: '3 sets of 15 seconds superman hold, rest 45 seconds between sets.', xp: 21 },
    { key: 'wall_sit_short', name: 'Wall Sit', desc: 'Hold a wall sit for 25 seconds, 3 attempts.', xp: 21 },
    { key: 'standing_knee_raises', name: 'Standing Knee Raises', desc: '3 sets of 12 standing knee raises per side, rest 45 seconds between sets.', xp: 21 },
    { key: 'towel_curls', name: 'Towel Bicep Curls', desc: '3 sets of 12 towel bicep curls, rest 45 seconds between sets.', xp: 21 },
    { key: 'lateral_lunges', name: 'Lateral Lunges', desc: '3 sets of 10 lateral lunges per side, rest 45 seconds between sets.', xp: 21 },
    { key: 'crunches', name: 'Crunches', desc: '3 sets of 15 crunches, rest 45 seconds between sets.', xp: 21 },
  ],
  // Tier 2 (27 XP)
  [
    { key: 'incline_pushups', name: 'Incline Push-ups', desc: '3 sets of 12 incline push-ups, rest 45 seconds between sets.', xp: 27 },
    { key: 'inverted_rows_feet_down', name: 'Inverted Rows (feet down)', desc: '3 sets of 10 inverted rows, rest 60 seconds between sets.', xp: 27 },
    { key: 'bulgarian_split_squats', name: 'Bulgarian Split Squats', desc: '3 sets of 10 Bulgarian split squats per leg, rest 60 seconds between sets.', xp: 27 },
    { key: 'shoulder_tap_plank', name: 'Plank with Shoulder Taps', desc: '3 sets of 20 shoulder taps (10 per side) in a plank position, rest 45 seconds between sets.', xp: 27 },
    { key: 'wall_sit', name: 'Wall Sit', desc: 'Hold a wall sit for 45 seconds, 3 attempts.', xp: 27 },
    { key: 'pike_pushups', name: 'Pike Push-ups', desc: '3 sets of 8 pike push-ups, rest 60 seconds between sets.', xp: 27 },
    { key: 'single_leg_glute_bridge', name: 'Single-Leg Glute Bridge', desc: '3 sets of 10 single-leg glute bridges per side, rest 45 seconds between sets.', xp: 27 },
    { key: 'mountain_climbers', name: 'Mountain Climbers', desc: '3 sets of 20 mountain climbers (10 per side), rest 45 seconds between sets.', xp: 27 },
    { key: 'reverse_lunges', name: 'Reverse Lunges', desc: '3 sets of 12 reverse lunges per leg, rest 45 seconds between sets.', xp: 27 },
    { key: 'flutter_kicks', name: 'Flutter Kicks', desc: '3 sets of 20 seconds flutter kicks, rest 30 seconds between sets.', xp: 27 },
    { key: 'tricep_dips', name: 'Chair Tricep Dips', desc: '3 sets of 10 chair tricep dips, rest 45 seconds between sets.', xp: 27 },
    { key: 'russian_twists', name: 'Russian Twists', desc: '3 sets of 20 russian twists (10 per side), rest 45 seconds between sets.', xp: 27 },
  ],
  // Tier 3 (33 XP)
  [
    { key: 'standard_pushups', name: 'Standard Push-ups', desc: '4 sets of 12 standard push-ups, rest 45 seconds between sets.', xp: 33 },
    { key: 'inverted_rows_feet_up', name: 'Inverted Rows (feet elevated)', desc: '4 sets of 10 inverted rows, rest 45 seconds between sets.', xp: 33 },
    { key: 'jump_squats', name: 'Jump Squats', desc: '4 sets of 12 jump squats, rest 45 seconds between sets.', xp: 33 },
    { key: 'hollow_body_hold', name: 'Hollow Body Hold', desc: 'Hold a hollow body position for 30 seconds, 4 attempts.', xp: 33 },
    { key: 'step_ups', name: 'Step-ups', desc: '4 sets of 12 step-ups per leg, rest 45 seconds between sets.', xp: 33 },
    { key: 'archer_pushups_progression', name: 'Archer Push-up Progression', desc: '4 sets of 6 archer push-ups per side, rest 60 seconds between sets.', xp: 33 },
    { key: 'single_arm_rows', name: 'Single-Arm Towel Rows', desc: '4 sets of 10 single-arm towel rows per side, rest 45 seconds between sets.', xp: 33 },
    { key: 'cossack_squats', name: 'Cossack Squats', desc: '4 sets of 8 cossack squats per side, rest 60 seconds between sets.', xp: 33 },
    { key: 'side_plank_reach', name: 'Side Plank with Reach', desc: '4 sets of 8 side plank reaches per side, rest 45 seconds between sets.', xp: 33 },
    { key: 'jumping_lunges', name: 'Jumping Lunges', desc: '4 sets of 10 jumping lunges per leg, rest 45 seconds between sets.', xp: 33 },
    { key: 'plank_up_downs', name: 'Plank Up-Downs', desc: '4 sets of 10 plank up-downs, rest 45 seconds between sets.', xp: 33 },
    { key: 'v_ups', name: 'V-Ups', desc: '4 sets of 12 v-ups, rest 45 seconds between sets.', xp: 33 },
  ],
  // Tier 4 (39 XP)
  [
    { key: 'diamond_pushups', name: 'Diamond Push-ups', desc: '4 sets of 12 diamond push-ups, rest 45 seconds between sets.', xp: 39 },
    { key: 'negative_pullups', name: 'Negative Pull-ups', desc: '4 sets of 5 negative pull-ups (5-second lower each), rest 60 seconds between sets.', xp: 39 },
    { key: 'pistol_squat_progression', name: 'Pistol Squat Progression', desc: '4 sets of 6 pistol squat progressions per leg, rest 60 seconds between sets.', xp: 39 },
    { key: 'long_plank_hold', name: 'Extended Plank Hold', desc: 'Hold a plank for 60 seconds, 3 attempts.', xp: 39 },
    { key: 'broad_jumps', name: 'Broad Jumps', desc: '4 sets of 8 broad jumps, rest 45 seconds between sets.', xp: 39 },
    { key: 'decline_pushups', name: 'Decline Push-ups', desc: '4 sets of 14 decline push-ups (feet elevated), rest 45 seconds between sets.', xp: 39 },
    { key: 'chin_up_negatives', name: 'Chin-up Negatives', desc: '4 sets of 6 chin-up negatives (6-second lower each), rest 60 seconds between sets.', xp: 39 },
    { key: 'shrimp_squats_assisted', name: 'Assisted Shrimp Squats', desc: '4 sets of 6 assisted shrimp squats per leg, rest 60 seconds between sets.', xp: 39 },
    { key: 'dragon_flag_progression', name: 'Dragon Flag Progression', desc: '4 sets of 6 dragon flag negatives, rest 60 seconds between sets.', xp: 39 },
    { key: 'box_jumps', name: 'Box Jumps', desc: '4 sets of 8 box jumps, rest 60 seconds between sets.', xp: 39 },
    { key: 'plyo_pushups', name: 'Plyo Push-ups', desc: '4 sets of 8 plyometric push-ups, rest 60 seconds between sets.', xp: 39 },
    { key: 'hanging_knee_raises', name: 'Hanging Knee Raises', desc: '4 sets of 10 hanging knee raises, rest 60 seconds between sets.', xp: 39 },
  ],
  // Tier 5 — Advanced (45 XP)
  [
    { key: 'full_pushups', name: 'Full Push-ups', desc: '5 sets of 15 full push-ups, rest 45 seconds between sets.', xp: 45 },
    { key: 'pullup_test', name: 'Pull-up Test', desc: 'Max effort set of strict pull-ups, 3 attempts, rest 90 seconds between attempts.', xp: 45 },
    { key: 'endurance_squats', name: 'Endurance Squats', desc: 'Max bodyweight squats in 2 minutes, 2 attempts.', xp: 45 },
    { key: 'l_sit_hold', name: 'L-sit Hold', desc: 'Hold an L-sit for 20 seconds, 4 attempts.', xp: 45 },
    { key: 'handstand_pushup_progression', name: 'Handstand Push-up Progression', desc: '4 sets of 5 pike or wall-assisted handstand push-ups, rest 60 seconds between sets.', xp: 45 },
    { key: 'one_arm_pushup_progression', name: 'One-Arm Push-up Progression', desc: '4 sets of 5 one-arm-assisted push-ups per side, rest 60 seconds between sets.', xp: 45 },
    { key: 'muscle_up_progression', name: 'Muscle-up Progression', desc: '4 sets of 4 explosive pull-ups to chest height, rest 90 seconds between sets.', xp: 45 },
    { key: 'pistol_squats', name: 'Full Pistol Squats', desc: '4 sets of 8 pistol squats per leg, rest 60 seconds between sets.', xp: 45 },
    { key: 'front_lever_progression', name: 'Front Lever Progression', desc: '4 sets of 15-second tucked front lever holds, rest 90 seconds between sets.', xp: 45 },
    { key: 'clapping_pushups', name: 'Clapping Push-ups', desc: '4 sets of 8 clapping push-ups, rest 60 seconds between sets.', xp: 45 },
    { key: 'loaded_step_ups', name: 'Loaded Step-ups', desc: '5 sets of 12 step-ups per leg with a weighted backpack, rest 45 seconds between sets.', xp: 45 },
    { key: 'burpees', name: 'Burpees', desc: '5 sets of 10 burpees, rest 45 seconds between sets.', xp: 45 },
  ],
]

export default workoutPools
