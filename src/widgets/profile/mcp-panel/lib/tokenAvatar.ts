const AVATAR_PALETTE: Array<{ background: string; color: string }> = [
  { background: '#eef2ff', color: '#6366f1' },
];
const EXPIRED_AVATAR_COLORS = { background: '#F3F4F7', color: '#8C93A3' };

export const getTokenAvatarColors = (name: string, isExpired: boolean) => {
  if (isExpired) return EXPIRED_AVATAR_COLORS;

  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash * 31 + name.charCodeAt(index)) >>> 0;
  }

  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length]!;
};
