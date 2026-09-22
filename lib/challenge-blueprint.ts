// 100XU Athletic Performance System: 100-day century blueprint data.
//
// 10 blocks x 10 days. Every day runs the block's full V1..V10 circuit
// (10 reps x 10 rounds = 1,000 reps/day, 100,000 total). Consumed by
// scripts/seed-challenge.ts. Kept here so the shape is unit-tested.

export type BlueprintTask = { name: string; load: string; cue: string; format?: string };
export type Block = { title: string; focus: string; tasks: BlueprintTask[] };

export const R10 = '10 Reps x 10 Rds';
export const RECOVERY =
  'Day 5/10 option: active recovery 6-8 rounds (600-800 reps) if systemic fatigue peaks.';

export const BLOCKS: Block[] = [
  {
    title: 'Foundational Swings & Functional Box Power',
    focus:
      'Calibrating posterior chain acceleration with kettlebell swings, box jump absorption, and upper body push-press density. Target 42-55 min.',
    tasks: [
      { name: 'Russian Kettlebell Swings', load: '16-24 kg KB', cue: 'Aggressive hip snap to eye line; locked knees and tight glute squeeze at apex.' },
      { name: 'Plyo Box Jumps (Step Down)', load: '20-24 inch Box', cue: 'Two-foot explosive takeoff, quiet athletic landing, step down to reset.' },
      { name: 'Dual DB Front Squats', load: 'Dual 10-15 kg DBs', cue: 'Heads of DBs resting on delts, elbows parallel to deck, descend past parallel.' },
      { name: 'Strict Hand-Release Push-Ups', load: 'Bodyweight', cue: 'Chest flat to floor, lift palms momentarily, press up without sagging hips.' },
      { name: "Heavy KB Farmer's Carry Paces", load: 'Dual 16-24 kg KBs', cue: 'Pack shoulders down and back, tight grip, 10 deliberate heel-to-toe paces.', format: '10 Paces x 10 Rds' },
      { name: 'Forward Alternating DB Lunges', load: 'Dual 10-12.5 kg DBs', cue: 'Suitcase carry, vertical shin on lead leg, light floor tap with rear knee.', format: '10 Reps (5/leg) x 10 Rds' },
      { name: 'Box Step-Overs (Facing Box)', load: '20-24 inch Box', cue: 'Step up onto box center, pivot, and step down facing opposite side smoothly.' },
      { name: 'KB Goblet Sumo Deadlifts', load: '20-28 kg KB', cue: 'Wide stance, hinge deeply at hips, push the floor away through the heels.' },
      { name: 'Piston Mountain Climbers', load: 'Bodyweight', cue: 'High tempo knee drives to chest; keep hips lower than shoulder line.', format: '10 Reps (L+R=1) x 10 Rds' },
      { name: 'Full Chest-to-Deck Burpees', load: 'Bodyweight', cue: 'Chest and thighs touch deck, snap feet forward wide, vertical jump with clap.' },
    ],
  },
  {
    title: 'Thruster Engine & Ballistic Overhead Force',
    focus:
      'Synchronized lower-to-upper kinetic drive with dumbbell thrusters, overhead American swings, and horizontal plyometrics. Target 42-55 min.',
    tasks: [
      { name: 'Dual Dumbbell Thrusters', load: 'Dual 10-15 kg DBs', cue: 'Deep front squat; erupt through heels and punch DBs overhead in one movement.' },
      { name: 'American Kettlebell Swings', load: '16-20 kg KB', cue: 'Hip snap propels KB directly overhead to 12 o clock; core locked to protect back.' },
      { name: 'Burpee Broad Jumps', load: 'Bodyweight', cue: 'Chest to floor, snap up to feet, immediate explosive 2-foot forward bound.' },
      { name: 'KB Goblet Squats (2s Pause)', load: '16-24 kg KB', cue: 'Hold horn at collarbone; 2s freeze at parallel; explode to standing lockout.' },
      { name: 'Dumbbell Renegade Rows', load: 'Dual 10-15 kg DBs', cue: 'Push-up plank; pull dumbbell to ribcage without allowing hips to tilt.', format: '10 Reps (5/side) x 10 Rds' },
      { name: 'Box Jump-Overs', load: '20-24 inch Box', cue: 'Jump up onto box top, hop down the far side, immediate pivot to repeat.' },
      { name: 'Overhead Kettlebell Carry Paces', load: '12-16 kg KB', cue: 'Arm locked vertical beside ear, ribs clamped down, 10 steady strides.', format: '10 Paces (5L/5R) x 10 Rds' },
      { name: 'Front-Rack Walking DB Lunges', load: 'Dual 10-12.5 kg DBs', cue: 'DBs resting on shoulders; continuous forward strides with soft knee touch.', format: '10 Reps (5/leg) x 10 Rds' },
      { name: 'Plank Up-Downs (Forearm to Palm)', load: 'Bodyweight', cue: 'Alternate lead arm each rep; squeeze glutes to keep pelvis totally stationary.' },
      { name: 'Alternating DB Snatch', load: '12.5-17.5 kg DB', cue: 'Pull straight off floor, jump through hips, punch DB overhead in one motion.', format: '10 Reps (5/side) x 10 Rds' },
    ],
  },
  {
    title: "Farmer's Grip, Heavy Carries & Sled Simulator",
    focus:
      'Maximum forearm grip endurance, heavy loaded locomotion, wall-drive sled mechanics, and push-press density. Grip recovery emphasis post-session.',
    tasks: [
      { name: "Heavy KB Farmer's Walk", load: 'Dual 20-28 kg KBs', cue: 'Crush handles, chest high, walk with zero lateral torso swaying.', format: '10 Paces x 10 Rds' },
      { name: 'Dumbbell Push Press', load: 'Dual 12.5-17.5 kg DBs', cue: 'Quick 2-inch vertical dip, violent hip extension, drive dumbbells to lockout.' },
      { name: 'Single-Arm Kettlebell Swings', load: '16-20 kg KB', cue: 'Anti-rotational swing; keep shoulders square to front wall throughout.', format: '10 Reps (5L/5R) x 10 Rds' },
      { name: 'Weighted Box Step-Ups', load: 'Dual 8-12 kg DBs + Box', cue: 'Step completely onto box; drive through lead heel without jumping off rear foot.', format: '10 Reps (5/leg) x 10 Rds' },
      { name: 'KB Deadlift-to-High-Pull', load: '16-24 kg KB', cue: 'Deadlift from floor, explode at hips, pull elbows high and wide to chin level.' },
      { name: 'Wall Sled Drive Marches', load: 'Isometric Wall Load', cue: 'Hands on wall at 45 deg angle, drive alternating knees hard against resistance.' },
      { name: 'Unilateral Suitcase Carry Paces', load: '20-24 kg KB single', cue: 'Single-sided load; contract opposite obliques to keep shoulders totally level.', format: '10 Paces (5L/5R) x 10 Rds' },
      { name: 'Deficit Push-Ups on Hex DBs', load: 'Dual Hex DBs', cue: 'Hands on handles; lower chest deeply between dumbbells for maximal stretch.' },
      { name: 'Lateral Box Step-Overs', load: '20 inch Box', cue: 'Travel sideways over box; plant lead foot, stand tall, step down other side.' },
      { name: 'KB Clean & Push Press', load: '16-20 kg KB', cue: 'Smooth clean into rack, shallow dip, drive weight straight overhead.' },
    ],
  },
  {
    title: "Dumbbell Density, Core Rigidity & Devil's Press",
    focus:
      "Uncompromising multi-plane loaded endurance featuring the Devil's Press, Russian twists, and posterior chain deadlifts. Protect lumbar alignment on RDLs.",
    tasks: [
      { name: "Dumbbell Devil's Press", load: 'Dual 10-15 kg DBs', cue: 'Burpee with chest onto DB handles; swing and snatch DBs overhead in one stroke.' },
      { name: 'KB Goblet Reverse Lunges', load: '16-24 kg KB', cue: 'KB held at chin; step back into deep 90 deg lunge; drive up through front heel.', format: '10 Reps (5/leg) x 10 Rds' },
      { name: 'Dumbbell Hang Clean & Squat', load: 'Dual 10-15 kg DBs', cue: 'Hang pull to front rack into instantaneous deep squat below knee crease.' },
      { name: 'Kettlebell Russian Twists', load: '8-12 kg KB', cue: 'V-sit hold with heels floating; tap kettlebell to floor on alternating flanks.', format: '10 Reps (5/side) x 10 Rds' },
      { name: 'Box Rapid Toe-Taps', load: '20 inch Box', cue: 'High cadence turnover; spring off balls of feet, alternate tapping box top.', format: '10 Reps (L+R=1) x 10 Rds' },
      { name: 'Dumbbell Floor Press (Bridge Hold)', load: 'Dual 12.5-17.5 kg DBs', cue: 'Hold hips up in glute bridge while pressing dumbbells up to complete lockout.' },
      { name: 'Kettlebell Halo to Squat', load: '12-16 kg KB', cue: 'Circle KB around head, catch at chest, sink into deep squat; alternate halo direction.' },
      { name: 'Spiderman Push-Ups on DBs', load: 'Dual Hex DBs', cue: 'Hands on dumbbells; bring lateral knee to touch DB handle at bottom of press.', format: '10 Reps (5/side) x 10 Rds' },
      { name: 'Dumbbell Romanian Deadlifts', load: 'Dual 15-20 kg DBs', cue: 'Hips back, flat back, slide DBs down shins until hamstrings stretch, snap erect.' },
      { name: 'Hollow Body DB Pullover', load: 'Single 10-12.5 kg DB', cue: 'Lock lower spine down; reach DB overhead with straight arms and return to chest.' },
    ],
  },
  {
    title: 'The Functional Century Simulation Matrix',
    focus:
      'The ultimate functional conditioning crucible: row pulls, sled locomotion, broad jumps, wall-ball thrusters. Day 45: reduce to 600 reps if sore.',
    tasks: [
      { name: 'Ski-Pull Simulator: DB Hinge Drives', load: 'Dual 8-12 kg DBs', cue: 'Elevate on toes, aggressive hip hinge, drive dumbbells downward past hips.' },
      { name: 'Low Sled Drive: Quad Bear Crawls', load: 'Bodyweight', cue: 'Knees hovering 1 inch off floor; forward crawl maintaining low 45 deg torso angle.', format: '10 Paces x 10 Rds' },
      { name: 'Sled Pull Simulator: Bent KB Rows', load: '24-32 kg KB', cue: 'Hinged flat back; row heavy bell to navel simulating hand-over-hand rope pull.' },
      { name: 'Athletic Burpee Broad Jumps', load: 'Bodyweight', cue: 'Chest hits deck; snap feet in and spring into maximum forward 2-foot bound.' },
      { name: 'Rowing Simulator: Sumo Squat Rows', load: 'Dual 12.5-15 kg DBs', cue: 'Deep squat drive, explosive hip extension into simultaneous upper pull.' },
      { name: "Heavy Farmer's Carry Strides", load: 'Dual 20-28 kg KBs', cue: 'Iron grip, locked lats; 10 heavy, controlled, rapid paces per round.', format: '10 Paces x 10 Rds' },
      { name: 'Front-Rack DB Walking Lunges', load: 'Dual 10-15 kg DBs', cue: 'Dumbbells racked at clavicles; full depth knee touch, no stalling at center.', format: '10 Reps (5/leg) x 10 Rds' },
      { name: 'Wall-Ball Simulator Thrusters', load: 'Dual 8-12 kg DBs', cue: 'Squat below parallel and use hip velocity to launch DBs straight overhead.' },
      { name: 'Plyo Box High Jumps', load: '24 inch Box', cue: 'Vertical explosion, land softly, stand to complete hip lockout at top.' },
      { name: 'KB American Overhead Swings', load: '16-20 kg KB', cue: 'Bell punched to vertical lockout directly over spine; glutes fire hard.' },
    ],
  },
  {
    title: 'Unilateral Power, Box Rebounds & Asymmetry',
    focus:
      'Eliminating left-right strength discrepancies with single-arm thrusters, asymmetric carries, and rebound plyometrics. Weaker side first.',
    tasks: [
      { name: 'Single-Arm Kettlebell Thrusters', load: '12-16 kg KB', cue: 'Rack on one shoulder, deep squat, punch overhead with core braced against lean.', format: '10 Reps (5L/5R) x 10 Rds' },
      { name: 'Box Rebound Jumps', load: '20 inch Box', cue: 'Land softly on box, step down, instantly spring off forefoot back onto box.' },
      { name: 'Single-Leg DB Romanian Deadlift', load: '12-16 kg DB', cue: 'Hinge on single foot, rear leg straight, lower DB to midshin, drive glute.', format: '10 Reps (5/leg) x 10 Rds' },
      { name: "Asymmetric Farmer's Carry", load: 'Heavy KB (R) + DB (L)', cue: 'Uneven loading forces contralateral obliques to fire continuously during walk.', format: '10 Paces x 10 Rds (switch side round 5)' },
      { name: 'Dumbbell Bulgarian Split Squats', load: 'Dual 10-15 kg DBs', cue: 'Rear foot on box; lower until front thigh is parallel to deck; drive heel.', format: '10 Reps (5/leg) x 10 Rds' },
      { name: 'Alternating Hand KB Swings', load: '16-20 kg KB', cue: 'Switch hands smoothly at the apex float with crisp hip extension.', format: '10 Reps (5L/5R) x 10 Rds' },
      { name: 'Box Lateral Step-Ups with High Knee', load: 'Dual 8-10 kg DBs + Box', cue: 'Stand beside box, step up laterally, drive opposite knee to chest level.', format: '10 Reps (5/side) x 10 Rds' },
      { name: 'Single-Arm DB Push Press', load: '12.5-17.5 kg DB', cue: 'Quick dip and violent single-arm drive to lock DB directly overhead.', format: '10 Reps (5L/5R) x 10 Rds' },
      { name: 'Side Plank DB Rotations', load: '4-6 kg DB', cue: 'High side plank; thread DB beneath torso then extend straight toward ceiling.', format: '10 Reps (5/side) x 10 Rds' },
      { name: 'Burpee Box Step-Overs', load: '20-24 inch Box', cue: 'Burpee facing box, jump up, step across top of box to opposite floor.' },
    ],
  },
  {
    title: 'Explosive Functional Capacity & Clusters',
    focus:
      'High-output compound complexes combining cleans, thrusters, and explosive kettlebell-to-squat transitions. Soft landing mechanics on box jumps.',
    tasks: [
      { name: 'Dual DB Clean & Thruster (Cluster)', load: 'Dual 10-15 kg DBs', cue: 'DBs tap deck, clean to rack, full front squat, explosive overhead press.' },
      { name: 'KB Swing-to-Goblet Squat', load: '16-20 kg KB', cue: 'Russian swing, catch horn at chest, sink into deep squat, repeat.' },
      { name: 'High Box Jumps (Step Down)', load: '24-30 inch Box', cue: 'Maximum vertical hip drive; land softly in quarter squat; step down to reset.' },
      { name: "Farmer's High-Knee March", load: 'Dual 16-24 kg KBs', cue: 'Farmer grip hold; lift lead thigh to parallel on every steady stride.', format: '10 Paces x 10 Rds' },
      { name: 'DB Renegade Row to Push-Up', load: 'Dual 10-15 kg DBs', cue: 'Row Left + Row Right + strict Push-Up on DBs = 1 complete repetition.' },
      { name: 'Suitcase Walking Lunges', load: 'Dual 12-16 kg KBs', cue: 'Kettlebells held at sides; continuous walking forward lunges with soft knee touch.', format: '10 Reps (5/leg) x 10 Rds' },
      { name: 'Box Depth Drop to Vertical Pop', load: '20 inch Box', cue: 'Step off box, hit floor, instantaneously redirect kinetic energy straight up.' },
      { name: 'Alternating DB Hang Snatches', load: '12.5-17.5 kg DB', cue: 'Hinge hips, pull DB straight overhead in one violent, continuous stroke.', format: '10 Reps (5/side) x 10 Rds' },
      { name: 'KB Gorilla Rows (Alternating)', load: 'Dual 16-20 kg KBs', cue: 'Deep deadlift hinge; row one bell up while pressing the other down into deck.', format: '10 Reps (5/side) x 10 Rds' },
      { name: 'Burpee Box-Over Jumps', load: '20-24 inch Box', cue: 'Chest-to-deck burpee, spring over box top to far side without standing upright.' },
    ],
  },
  {
    title: 'Lactic Threshold & Heavy Load Locomotive Overload',
    focus:
      'Testing physiological stamina under severe muscular fatigue with heavy double kettlebell swings and overhead lunges. Carb-rich pre-workout nutrition.',
    tasks: [
      { name: 'Heavy KB Goblet Thrusters', load: '20-24 kg KB', cue: 'Hold heavy bell at chest; sink to the hole; drive and punch overhead.' },
      { name: "Heavy Farmer's Carry Turnover", load: 'Dual 24-32 kg KBs', cue: 'Maximum grip test; quick compact strides with locked thoracic extension.', format: '10 Paces x 10 Rds' },
      { name: 'Double Kettlebell Swings', load: 'Dual 16-20 kg KBs', cue: 'Bells outside knees; violent synchronized hip hinge and drive to chest line.' },
      { name: 'Plyo Box Jumps with Soft Stick', load: '24 inch Box', cue: 'Absorb landing silently; stand tall to full vertical hip extension.' },
      { name: 'Overhead DB Walking Lunges', load: 'Single/Dual 10-12.5 kg DB', cue: 'Arms rigidly locked overhead; forward lunges challenging shoulder stability.', format: '10 Reps (5/leg) x 10 Rds' },
      { name: 'Burpee to KB Deadlift', load: 'Dual 16-24 kg KBs', cue: 'Burpee between bells; snap into hip hinge and stand tall with weights.' },
      { name: 'Kettlebell Clean-to-Squat', load: '16-20 kg KB', cue: 'Swing clean to rack, instantly drop into deep front squat, explode up.', format: '10 Reps (5L/5R) x 10 Rds' },
      { name: 'Wall-Sit DB Bicep Curls', load: 'Dual 8-10 kg DBs', cue: 'Thighs pinned at 90 deg against wall; execute strict curls while quads burn.' },
      { name: 'Box Lateral Shuffle Taps', load: '20 inch Box', cue: 'Lateral shuffle tap top of box, drop to side, immediate athletic rebound.' },
      { name: 'Navy SEAL 3-Pump Burpees', load: 'Bodyweight', cue: 'Drop down, 3 push-ups + 2 knee-to-elbow drives inside each push-up, jump.' },
    ],
  },
  {
    title: 'Speed Turnover & Rapid Cycle Rate',
    focus:
      'Shaving seconds off transitions, maximizing cadence, unbroken speed thrusters, and rapid kettlebell turnover. Track round times as benchmark.',
    tasks: [
      { name: 'Speed Dual DB Thrusters', load: 'Dual 10-12.5 kg DBs', cue: 'Continuous piston tempo; zero hesitation at bottom or top of press.' },
      { name: 'Rapid Touch & Go KB Swings', load: '16-20 kg KB', cue: 'Crisp hip pop, aggressive spike down, instant reversal off hamstrings.' },
      { name: 'Box Rebound Jumps', load: '20-24 inch Box', cue: 'Minimal floor contact time; land on box and spring back instantly.' },
      { name: "Speed Farmer's Carry Strides", load: 'Dual 16-20 kg KBs', cue: 'Fast-turnover sprint strides carrying bells with rigid shoulder control.', format: '10 Fast Paces x 10 Rds' },
      { name: 'Dumbbell Push-Up to Snatch', load: 'Single 12.5-15 kg DB', cue: 'One hand on DB push-up; immediately pull and snatch DB overhead.', format: '10 Reps (5L/5R) x 10 Rds' },
      { name: 'Alternating Jump Lunges', load: 'Bodyweight', cue: 'Fast switch in mid-air, touch rear knee, explode back up instantly.', format: '10 Reps (5/leg) x 10 Rds' },
      { name: 'Box Step-Overs with Dual DBs', load: 'Dual 8-10 kg DBs + Box', cue: 'Hold dumbbells at sides; travel over box top with steady rapid cadence.' },
      { name: 'Sumo Deadlift High Pulls', load: '20-24 kg KB', cue: 'Violent triple extension; elbows punch high above shoulders.' },
      { name: 'Burpee Jump Over Dumbbell', load: 'Single DB', cue: 'Chest hits deck, snap feet in, two-foot lateral jump over dumbbell.' },
      { name: 'High Knees to Sprawl Drop', load: 'Bodyweight', cue: '4 high knees + 1 chest drop sprawl = 1 rep; complete 10 reps to finish round.' },
    ],
  },
  {
    title: 'The 100XU Grandmaster Century Summit',
    focus:
      'The ultimate test of athletic character: heavy thrusters, heavy swings, farmer carries, box jumps, and Devil presses. Flawless standard across all reps.',
    tasks: [
      { name: 'Heavy Dual DB Thrusters', load: 'Dual 12.5-17.5 kg DBs', cue: 'Full front squat depth into explosive locked overhead press.' },
      { name: 'Heavy Russian KB Swings', load: '24-32 kg KB', cue: 'Brace core, hinge back deep, fire glutes with maximum power to eye height.' },
      { name: 'Box Jumps to Stand Tall', load: '24 inch Box', cue: 'Land softly on top of box, stand to full vertical hip lockout before stepping down.' },
      { name: "Heavy KB Farmer's Walk", load: 'Dual 24-32 kg KBs', cue: 'Iron grip, locked lats, straight spine; 10 heavy deliberate loaded strides.', format: '10 Heavy Paces x 10 Rds' },
      { name: 'Athletic Burpee Broad Jumps', load: 'Bodyweight', cue: 'Full chest-to-deck burpee followed by an explosive forward broad jump.' },
      { name: 'Dual DB Walking Lunges', load: 'Dual 12.5-15 kg DBs', cue: 'Suitcase hold; deep lunge steps with knee tap, driving forward continuously.', format: '10 Reps (5/leg) x 10 Rds' },
      { name: 'KB Clean, Squat & Press', load: '16-20 kg KB', cue: 'Swing clean to rack, front squat, stand and press overhead. Flawless flow.', format: '10 Reps (5L/5R) x 10 Rds' },
      { name: 'Box Step-Overs with Overhead DB', load: 'Single 10-15 kg DB + Box', cue: 'Punch single DB overhead; step onto and over box without dropping elbow.' },
      { name: 'American KB Overhead Swings', load: '16-20 kg KB', cue: 'Full overhead vertical lock; hips drive bell upward in single continuous line.' },
      { name: "100XU Century Finisher: Devil's Press", load: 'Dual 10-15 kg DBs', cue: 'The ultimate test: burpee chest to deck on DBs into explosive snatch overhead.' },
    ],
  },
];

// Free trial: the first 5 movements of Block 01 Day 1. Price 0 joins free
// through the existing demo verify path, no payment keys needed.
export const TRIAL_BLOCK: Block = {
  title: 'Free Trial Taster',
  focus: 'Five movements from Block 01 Day 1. Same circuit rules: 10 reps x 10 rounds.',
  tasks: BLOCKS[0]!.tasks.slice(0, 5),
};
