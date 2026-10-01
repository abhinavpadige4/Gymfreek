// 100XU character art (public/bitmoji/*.png) on the share-card template
// (public/cards/share-bg.png). Local files ship with the app, so they render
// on Vercel with no external host. The seed string is the only thing saved
// on User.avatarSeed.
export const AVATAR_SEEDS = ['Ravi', 'Asha', 'Kabir', 'Diya', 'Arjun'] as const;

export function avatarUrl(seed: string | null | undefined): string {
  const s = (seed?.trim() || 'Ravi').toLowerCase();
  const known = (AVATAR_SEEDS as readonly string[]).map((n) => n.toLowerCase());
  return `/bitmoji/${known.includes(s) ? s : 'ravi'}.png`;
}

export const SHARE_CARD_BG = '/cards/share-bg.png';

// 10 block badges: name + color only, rendered as SVG medal in UI.
export const BLOCK_BADGES = [
  { block: 1, name: 'IRON WILL', color: '#CD7F32' },
  { block: 2, name: 'BLOCK OUT', color: '#CD7F32' },
  { block: 3, name: 'PAIN TO POWER', color: '#C0C0C0' },
  { block: 4, name: 'ALPHA MODE', color: '#C0C0C0' },
  { block: 5, name: 'WILD CORE', color: '#C0C0C0' },
  { block: 6, name: 'AFTER BURN', color: '#FFD700' },
  { block: 7, name: 'NO SURRENDER', color: '#FFD700' },
  { block: 8, name: 'MISSION IMPOSSIBLE', color: '#FFD700' },
  { block: 9, name: 'THE FINAL SHOWDOWN', color: '#B9F' },
  { block: 10, name: '100XU', color: '#B9F' },
] as const;
