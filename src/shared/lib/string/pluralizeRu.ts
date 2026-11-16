/** Форма существительного для числа: `[1, 2–4, 5+]`. */
export const pluralFormRu = (
  count: number,
  forms: [string, string, string]
): string => {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return forms[1];
  }
  return forms[2];
};

export const pluralizeRu = (
  count: number,
  forms: [string, string, string]
): string => `${count} ${pluralFormRu(count, forms)}`;
