// Athletic front-view geometry. viewBox 0 0 400 900, head at top, feet at
// bottom. Broad shoulders, V-taper torso, segmented abs, thick thighs.
// Every entry is one interactable muscle; head/neck carry no training data
// (group: null) and render as static anatomy.

import type { MuscleGroup } from '@/lib/prisma-client';

export type BodyZone = 'UPPER' | 'CORE' | 'LOWER';

export interface BodyPathDef {
  id: string;
  label: string;
  group: MuscleGroup | null;
  zone: BodyZone;
  d: string;
}

// Dark mannequin drawn under the muscles; gaps between muscle shapes read as
// definition lines. Shared by both views.
export const BASE_FILL = '#141619';

export const FRONT_BASE: readonly string[] = [
  // Head (no face, neutral mannequin).
  'M200,18 C218,18 230,34 230,54 C230,74 216,90 200,90 C184,90 170,74 170,54 C170,34 182,18 200,18 Z',
  // Neck.
  'M181,86 L219,86 L224,128 L176,128 Z',
  // Torso: broad shoulders tapering to a narrow waist.
  'M108,138 C140,118 260,118 292,138 L280,330 L264,472 L136,472 L120,330 Z',
  // Thick arms, slightly away from the torso.
  'M92,148 C78,148 70,162 72,180 L84,400 C86,418 108,418 110,400 L112,180 C112,162 106,148 92,148 Z',
  'M308,148 C322,148 330,162 328,180 L316,400 C314,418 292,418 290,400 L288,180 C288,162 294,148 308,148 Z',
  // Heavy legs.
  'M150,468 C132,468 120,484 120,510 L128,840 C130,866 170,866 172,840 L180,510 C180,484 168,468 150,468 Z',
  'M250,468 C268,468 280,484 280,510 L272,840 C270,866 230,866 228,840 L220,510 C220,484 232,468 250,468 Z',
];

export const FRONT_PATHS: readonly BodyPathDef[] = [
  { id: 'head', label: 'Head', group: null, zone: 'UPPER', d: 'M200,18 C218,18 230,34 230,54 C230,74 216,90 200,90 C184,90 170,74 170,54 C170,34 182,18 200,18 Z' },
  { id: 'neck', label: 'Neck', group: null, zone: 'UPPER', d: 'M181,86 L219,86 L224,128 L176,128 Z' },
  // Rounded deltoid caps.
  { id: 'left-deltoid', label: 'Left Deltoid', group: 'SHOULDERS_FRONT', zone: 'UPPER', d: 'M96,150 C96,128 114,114 136,114 C158,114 170,130 168,152 L162,186 C140,196 112,192 100,178 Z' },
  { id: 'right-deltoid', label: 'Right Deltoid', group: 'SHOULDERS_FRONT', zone: 'UPPER', d: 'M304,150 C304,128 286,114 264,114 C242,114 230,130 232,152 L238,186 C260,196 288,192 300,178 Z' },
  // Defined pectorals with a lower curve.
  { id: 'left-chest', label: 'Left Chest', group: 'CHEST', zone: 'UPPER', d: 'M134,198 C152,190 176,190 196,198 L194,252 C194,272 170,284 148,278 C134,272 128,250 130,228 Z' },
  { id: 'right-chest', label: 'Right Chest', group: 'CHEST', zone: 'UPPER', d: 'M266,198 C248,190 224,190 204,198 L206,252 C206,272 230,284 252,278 C266,272 272,250 270,228 Z' },
  // Bicep bellies on the upper arms.
  { id: 'left-bicep', label: 'Left Bicep', group: 'BICEPS', zone: 'UPPER', d: 'M112,212 C100,212 94,224 96,240 L104,292 C106,304 122,304 124,292 L128,240 C130,226 124,212 112,212 Z' },
  { id: 'right-bicep', label: 'Right Bicep', group: 'BICEPS', zone: 'UPPER', d: 'M288,212 C300,212 306,224 304,240 L296,292 C294,304 278,304 276,292 L272,240 C270,226 276,212 288,212 Z' },
  // Tricep slivers on the outer arms (full bellies live on the back view).
  { id: 'left-tricep', label: 'Left Tricep', group: 'TRICEPS', zone: 'UPPER', d: 'M92,220 C86,220 84,228 86,240 L92,290 C94,300 104,298 104,288 L102,232 C102,224 98,220 92,220 Z' },
  { id: 'right-tricep', label: 'Right Tricep', group: 'TRICEPS', zone: 'UPPER', d: 'M308,220 C314,220 316,228 314,240 L308,290 C306,300 296,298 296,288 L298,232 C298,224 302,220 308,220 Z' },
  // Tapering forearms.
  { id: 'left-forearm', label: 'Left Forearm', group: 'FOREARMS', zone: 'UPPER', d: 'M100,312 C90,312 86,322 88,336 L96,398 C98,414 116,414 118,398 L120,336 C122,322 114,312 104,312 Z' },
  { id: 'right-forearm', label: 'Right Forearm', group: 'FOREARMS', zone: 'UPPER', d: 'M300,312 C310,312 314,322 312,336 L304,398 C302,414 284,414 282,398 L280,336 C278,322 286,312 296,312 Z' },
  // Segmented ab wall.
  { id: 'upper-abs', label: 'Upper Abs', group: 'ABS', zone: 'CORE', d: 'M166,300 C182,294 218,294 234,300 L232,340 C216,346 184,346 168,340 Z' },
  { id: 'middle-abs', label: 'Middle Abs', group: 'ABS', zone: 'CORE', d: 'M168,346 C184,340 216,340 232,346 L230,386 C214,392 186,392 170,386 Z' },
  { id: 'lower-abs', label: 'Lower Abs', group: 'ABS', zone: 'CORE', d: 'M172,392 C187,387 213,387 228,392 L224,428 C210,434 190,434 176,428 Z' },
  // Oblique columns flanking the abs.
  { id: 'left-oblique', label: 'Left Oblique', group: 'ABS', zone: 'CORE', d: 'M140,318 C132,318 128,328 130,344 L138,404 C140,416 152,416 154,404 L150,340 C150,328 146,318 140,318 Z' },
  { id: 'right-oblique', label: 'Right Oblique', group: 'ABS', zone: 'CORE', d: 'M260,318 C268,318 272,328 270,344 L262,404 C260,416 248,416 246,404 L250,340 C250,328 254,318 260,318 Z' },
  // Large quadriceps masses.
  { id: 'left-quad', label: 'Left Quadriceps', group: 'QUADS', zone: 'LOWER', d: 'M120,478 C140,470 170,470 192,480 L196,600 C196,650 180,672 158,672 C134,672 118,648 116,600 Z' },
  { id: 'right-quad', label: 'Right Quadriceps', group: 'QUADS', zone: 'LOWER', d: 'M280,478 C260,470 230,470 208,480 L204,600 C204,650 220,672 242,672 C266,672 282,648 284,600 Z' },
  // Defined front calves below the knee gap.
  { id: 'left-calf', label: 'Left Calf', group: 'CALVES', zone: 'LOWER', d: 'M136,706 C150,700 170,700 182,706 L178,800 C176,836 160,852 158,852 C156,852 140,836 138,800 Z' },
  { id: 'right-calf', label: 'Right Calf', group: 'CALVES', zone: 'LOWER', d: 'M264,706 C250,700 230,700 218,706 L222,800 C224,836 240,852 242,852 C244,852 260,836 262,800 Z' },
];
