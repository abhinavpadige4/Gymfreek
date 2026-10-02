// Athletic back-view geometry. Same 400x900 viewBox and silhouette language
// as the front view: traps, rear delts, lats, spinal erectors, rounded
// glutes, hamstrings, strong calves. Head/neck carry no training data.

import type { BodyPathDef } from './FrontBody';

export const BACK_PATHS: readonly BodyPathDef[] = [
  { id: 'head', label: 'Head', group: null, zone: 'UPPER', d: 'M200,18 C218,18 230,34 230,54 C230,74 216,90 200,90 C184,90 170,74 170,54 C170,34 182,18 200,18 Z' },
  { id: 'neck', label: 'Neck', group: null, zone: 'UPPER', d: 'M181,86 L219,86 L224,128 L176,128 Z' },
  // Trapezius kite from neck to mid-back.
  { id: 'trapezius', label: 'Trapezius', group: 'BACK_THICKNESS', zone: 'UPPER', d: 'M148,128 C170,118 230,118 252,128 L238,196 C220,206 180,206 162,196 Z' },
  // Rear deltoid caps.
  { id: 'left-rear-deltoid', label: 'Left Rear Deltoid', group: 'SHOULDERS_REAR', zone: 'UPPER', d: 'M96,150 C96,128 114,114 136,114 C158,114 170,130 168,152 L162,186 C140,196 112,192 100,178 Z' },
  { id: 'right-rear-deltoid', label: 'Right Rear Deltoid', group: 'SHOULDERS_REAR', zone: 'UPPER', d: 'M304,150 C304,128 286,114 264,114 C242,114 230,130 232,152 L238,186 C260,196 288,192 300,178 Z' },
  // Lat wings sweeping down in a V.
  { id: 'left-lat', label: 'Left Lat', group: 'BACK_WIDTH', zone: 'UPPER', d: 'M134,206 C154,198 180,198 192,206 L186,300 C184,330 160,340 144,330 C132,310 130,250 134,206 Z' },
  { id: 'right-lat', label: 'Right Lat', group: 'BACK_WIDTH', zone: 'UPPER', d: 'M266,206 C246,198 220,198 208,206 L214,300 C216,330 240,340 256,330 C268,310 270,250 266,206 Z' },
  // Full tricep bellies on the backs of the arms.
  { id: 'left-tricep', label: 'Left Tricep', group: 'TRICEPS', zone: 'UPPER', d: 'M104,212 C92,212 86,224 88,242 L96,296 C98,310 116,310 118,296 L122,242 C124,226 118,212 106,212 Z' },
  { id: 'right-tricep', label: 'Right Tricep', group: 'TRICEPS', zone: 'UPPER', d: 'M296,212 C308,212 314,224 312,242 L304,296 C302,310 284,310 282,296 L278,242 C276,226 282,212 294,212 Z' },
  // Spinal erectors column.
  { id: 'lower-back', label: 'Lower Back', group: 'LOWER_BACK', zone: 'CORE', d: 'M182,338 C192,334 208,334 218,338 L220,424 C208,432 192,432 180,424 Z' },
  // Rounded glutes.
  { id: 'left-glute', label: 'Left Glute', group: 'GLUTES', zone: 'LOWER', d: 'M138,476 C160,470 188,472 196,484 L192,540 C188,562 164,570 148,562 C136,548 134,500 138,476 Z' },
  { id: 'right-glute', label: 'Right Glute', group: 'GLUTES', zone: 'LOWER', d: 'M262,476 C240,470 212,472 204,484 L208,540 C212,562 236,570 252,562 C264,548 266,500 262,476 Z' },
  // Hamstring masses.
  { id: 'left-hamstring', label: 'Left Hamstring', group: 'HAMSTRINGS', zone: 'LOWER', d: 'M126,572 C144,566 172,566 188,574 L184,660 C182,682 164,690 156,690 C146,690 130,680 128,656 Z' },
  { id: 'right-hamstring', label: 'Right Hamstring', group: 'HAMSTRINGS', zone: 'LOWER', d: 'M274,572 C256,566 228,566 212,574 L216,660 C218,682 236,690 244,690 C254,690 270,680 272,656 Z' },
  // Strong calves with full bellies.
  { id: 'left-calf', label: 'Left Calf', group: 'CALVES', zone: 'LOWER', d: 'M132,700 C148,694 172,694 186,702 L182,806 C180,842 164,856 159,856 C154,856 138,842 136,806 Z' },
  { id: 'right-calf', label: 'Right Calf', group: 'CALVES', zone: 'LOWER', d: 'M268,700 C252,694 228,694 214,702 L218,806 C220,842 236,856 241,856 C246,856 262,842 264,806 Z' },
];
