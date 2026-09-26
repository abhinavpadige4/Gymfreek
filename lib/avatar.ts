// DiceBear preset avatars (no upload, no storage). The seed string is the
// only thing saved on User.avatarSeed.
export const AVATAR_SEEDS = [
  'Ravi',
  'Asha',
  'Kabir',
  'Meera',
  'Arjun',
  'Diya',
  'Vikram',
  'Neha',
  'Aditya',
  'Priya',
  'Rohan',
  'Sana',
] as const;

export function avatarUrl(seed: string | null | undefined): string {
  const s = encodeURIComponent(seed?.trim() || 'Ravi');
  return `https://api.dicebear.com/9.x/adventurer/svg?seed=${s}`;
}

// 10 block badges: name + color only, rendered as SVG medal in UI.
export const BLOCK_BADGES = [
  { block: 1, name: 'Foundational', color: '#CD7F32' },
  { block: 2, name: 'Thruster Engine', color: '#CD7F32' },
  { block: 3, name: 'Grip Iron', color: '#C0C0C0' },
  { block: 4, name: 'Density Armor', color: '#C0C0C0' },
  { block: 5, name: 'Century Half', color: '#C0C0C0' },
  { block: 6, name: 'Unilateral', color: '#FFD700' },
  { block: 7, name: 'Explosive', color: '#FFD700' },
  { block: 8, name: 'Lactic Lord', color: '#FFD700' },
  { block: 9, name: 'Speed Demon', color: '#B9F' },
  { block: 10, name: 'Century Finisher', color: '#B9F' },
] as const;
