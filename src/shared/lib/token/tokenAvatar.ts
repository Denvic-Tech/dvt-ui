export type AvatarColors = { background: string; color: string };

const AVATAR_PALETTE: AvatarColors[] = [
  { background: '#eef2ff', color: '#6366f1' },
];
const EXPIRED_AVATAR_COLORS = { background: '#F3F4F7', color: '#8C93A3' };

// The same name always gets the same color from the palette.
export const getHashedAvatarColors = (
  name: string,
  palette: readonly AvatarColors[]
): AvatarColors => {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash * 31 + name.charCodeAt(index)) >>> 0;
  }

  return palette[hash % palette.length]!;
};

export const getTokenAvatarColors = (name: string, isExpired: boolean) =>
  isExpired
    ? EXPIRED_AVATAR_COLORS
    : getHashedAvatarColors(name, AVATAR_PALETTE);
