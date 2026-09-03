export const getUserDisplayName = (
  userName: string | null | undefined,
  email: string | null | undefined
): string => {
  const normalizedUserName = userName?.trim();
  if (normalizedUserName) {
    return normalizedUserName;
  }

  const localPart = email?.split('@')[0]?.trim();
  if (localPart) {
    return localPart;
  }

  return 'пользователь';
};

export const getDisplayInitial = (value: string): string => {
  const normalized = value.trim();
  return normalized ? normalized[0].toUpperCase() : '?';
};
