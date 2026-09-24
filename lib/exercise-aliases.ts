// Exact mapping: 100-day blueprint movement name -> exercise catalog name.
//
// The blueprint uses Title Case shorthand (DB/KB, parenthetical variants)
// while the catalog uses full equipment words, so naive normalization misses
// ~1/3 of the movements. This table is curated by hand and unit-tested:
// every BLOCKS + TRIAL_BLOCK task must resolve, and every target must exist
// in EXERCISE_CATALOG. Add new movements here, never fuzzy-match.
export const BLUEPRINT_TO_CATALOG: Record<string, string> = {
  // Block 01 - Foundational Swings & Functional Box Power
  'Russian Kettlebell Swings': 'Russian kettlebell swings',
  'Plyo Box Jumps (Step Down)': 'Plyo box jumps with step down',
  'Dual DB Front Squats': 'Dual dumbbell front squats',
  'Strict Hand-Release Push-Ups': 'Strict hand-release push-ups',
  "Heavy KB Farmer's Carry Paces": 'Heavy kettlebell carry paces',
  'Forward Alternating DB Lunges': 'Forward alternating dumbbell lunges',
  'Box Step-Overs (Facing Box)': 'Box step-overs facing box',
  'KB Goblet Sumo Deadlifts': 'Kettlebell goblet sumo deadlifts',
  'Piston Mountain Climbers': 'Piston mountain climbers',
  'Full Chest-to-Deck Burpees': 'Full chest-to-deck burpees',
  // Block 02 - Thruster Engine & Ballistic Overhead Force
  'Dual Dumbbell Thrusters': 'Dual dumbbell thrusters',
  'American Kettlebell Swings': 'American kettlebell swings',
  'Burpee Broad Jumps': 'Burpee broad jumps',
  'KB Goblet Squats (2s Pause)': 'Kettlebell goblet squats with pause',
  'Dumbbell Renegade Rows': 'Dumbbell renegade rows',
  'Box Jump-Overs': 'Box jump-overs',
  'Overhead Kettlebell Carry Paces': 'Overhead kettlebell carry paces',
  'Front-Rack Walking DB Lunges': 'Front-rack walking dumbbell lunges',
  'Plank Up-Downs (Forearm to Palm)': 'Plank up-downs',
  'Alternating DB Snatch': 'Alternating dumbbell snatch',
  // Block 03 - Farmer's Grip, Heavy Carries & Sled Simulator
  "Heavy KB Farmer's Walk": 'Heavy kettlebell farmer walk',
  'Dumbbell Push Press': 'Dumbbell push press',
  'Single-Arm Kettlebell Swings': 'Single-arm kettlebell swings',
  'Weighted Box Step-Ups': 'Weighted dumbbell box step-ups',
  'KB Deadlift-to-High-Pull': 'Kettlebell deadlift to high pull',
  'Wall Sled Drive Marches': 'Wall sled drive marches',
  'Unilateral Suitcase Carry Paces': 'Unilateral suitcase carry paces',
  'Deficit Push-Ups on Hex DBs': 'Deficit push-ups on hex dumbbells',
  'Lateral Box Step-Overs': 'Lateral box step-overs',
  'KB Clean & Push Press': 'Kettlebell clean and push press',
  // Block 04 - Dumbbell Density, Core Rigidity & Devil's Press
  "Dumbbell Devil's Press": 'Dumbbell devil press',
  'KB Goblet Reverse Lunges': 'Kettlebell goblet reverse lunges',
  'Dumbbell Hang Clean & Squat': 'Dumbbell hang clean and squat',
  'Kettlebell Russian Twists': 'Kettlebell Russian twists',
  'Box Rapid Toe-Taps': 'Box rapid toe-taps',
  'Dumbbell Floor Press (Bridge Hold)': 'Dumbbell floor press with bridge hold',
  'Kettlebell Halo to Squat': 'Kettlebell halo to squat',
  'Spiderman Push-Ups on DBs': 'Spiderman push-ups on dumbbells',
  'Dumbbell Romanian Deadlifts': 'Dumbbell Romanian deadlifts',
  'Hollow Body DB Pullover': 'Hollow body dumbbell pullover',
  // Block 05 - Functional Century Simulation Matrix
  'Ski-Pull Simulator: DB Hinge Drives': 'Ski-pull simulator dumbbell hinge drives',
  'Low Sled Drive: Quad Bear Crawls': 'Quad bear crawls',
  'Sled Pull Simulator: Bent KB Rows': 'Sled pull simulator bent kettlebell rows',
  'Athletic Burpee Broad Jumps': 'Athletic burpee broad jumps',
  'Rowing Simulator: Sumo Squat Rows': 'Rowing simulator sumo squat rows',
  "Heavy Farmer's Carry Strides": 'Heavy kettlebell farmer carry strides',
  'Front-Rack DB Walking Lunges': 'Front-rack walking dumbbell lunges',
  'Wall-Ball Simulator Thrusters': 'Wall-ball simulator thrusters',
  'Plyo Box High Jumps': 'Plyo box high jumps',
  'KB American Overhead Swings': 'American kettlebell overhead swings',
  // Block 06 - Unilateral Power, Box Rebounds & Asymmetry
  'Single-Arm Kettlebell Thrusters': 'Single-arm kettlebell thrusters',
  'Box Rebound Jumps': 'Box rebound jumps',
  'Single-Leg DB Romanian Deadlift': 'Single-leg dumbbell Romanian deadlift',
  "Asymmetric Farmer's Carry": 'Asymmetric farmer carry',
  'Dumbbell Bulgarian Split Squats': 'Dumbbell Bulgarian split squats',
  'Alternating Hand KB Swings': 'Alternating hand kettlebell swings',
  'Box Lateral Step-Ups with High Knee': 'Box lateral step-ups with high knee',
  'Single-Arm DB Push Press': 'Single-arm dumbbell push press',
  'Side Plank DB Rotations': 'Side plank dumbbell rotations',
  'Burpee Box Step-Overs': 'Burpee box step-overs',
  // Block 07 - Explosive Functional Capacity & Clusters
  'Dual DB Clean & Thruster (Cluster)': 'Dual dumbbell clean and thruster cluster',
  'KB Swing-to-Goblet Squat': 'Kettlebell swing to goblet squat',
  'High Box Jumps (Step Down)': 'High box jumps with step down',
  "Farmer's High-Knee March": 'Farmer high-knee march',
  'DB Renegade Row to Push-Up': 'Dumbbell renegade row to push-up',
  'Suitcase Walking Lunges': 'Suitcase walking lunges',
  'Box Depth Drop to Vertical Pop': 'Box depth drop to vertical pop',
  'Alternating DB Hang Snatches': 'Alternating dumbbell hang snatches',
  'KB Gorilla Rows (Alternating)': 'Kettlebell gorilla rows',
  'Burpee Box-Over Jumps': 'Burpee box-over jumps',
  // Block 08 - Lactic Threshold & Heavy Load Locomotive Overload
  'Heavy KB Goblet Thrusters': 'Heavy kettlebell goblet thrusters',
  "Heavy Farmer's Carry Turnover": 'Heavy farmer carry turnover',
  'Double Kettlebell Swings': 'Double kettlebell swings',
  'Plyo Box Jumps with Soft Stick': 'Plyo box jumps with soft stick',
  'Overhead DB Walking Lunges': 'Overhead dumbbell walking lunges',
  'Burpee to KB Deadlift': 'Burpee to kettlebell deadlift',
  'Kettlebell Clean-to-Squat': 'Kettlebell clean to squat',
  'Wall-Sit DB Bicep Curls': 'Wall-sit dumbbell bicep curls',
  'Box Lateral Shuffle Taps': 'Box lateral shuffle taps',
  'Navy SEAL 3-Pump Burpees': 'Navy SEAL 3-pump burpees',
  // Block 09 - Speed Turnover & Rapid Cycle Rate
  'Speed Dual DB Thrusters': 'Speed dual dumbbell thrusters',
  'Rapid Touch & Go KB Swings': 'Rapid touch and go kettlebell swings',
  "Speed Farmer's Carry Strides": 'Speed farmer carry strides',
  'Dumbbell Push-Up to Snatch': 'Dumbbell push-up to snatch',
  'Alternating Jump Lunges': 'Alternating jump lunges',
  'Box Step-Overs with Dual DBs': 'Box step-overs with dual dumbbells',
  'Sumo Deadlift High Pulls': 'Sumo deadlift high pulls',
  'Burpee Jump Over Dumbbell': 'Burpee jump over dumbbell',
  'High Knees to Sprawl Drop': 'High knees to sprawl drop',
  // Block 10 - Grandmaster Century Summit
  'Heavy Dual DB Thrusters': 'Heavy dual dumbbell thrusters',
  'Heavy Russian KB Swings': 'Heavy Russian kettlebell swings',
  'Box Jumps to Stand Tall': 'Box jumps to stand tall',
  'Dual DB Walking Lunges': 'Dual dumbbell walking lunges',
  'KB Clean, Squat & Press': 'Kettlebell clean, squat and press',
  'Box Step-Overs with Overhead DB': 'Box step-overs with overhead dumbbell',
  'American KB Overhead Swings': 'American kettlebell overhead swings',
  // The century finisher is a Devil's Press under a ceremonial name.
  "100XU Century Finisher: Devil's Press": 'Dumbbell devil press',
};

export function catalogNameFor(blueprintName: string): string | null {
  return BLUEPRINT_TO_CATALOG[blueprintName] ?? null;
}
