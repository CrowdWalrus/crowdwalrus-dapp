export const getBadgeImagePath = (level?: number | null): string | null => {
  if (!level || level <= 0) {
    return null;
  }

  return `/assets/images/badges/level${level}.png`;
};
