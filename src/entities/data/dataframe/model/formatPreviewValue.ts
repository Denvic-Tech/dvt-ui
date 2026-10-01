/** Format JSON preview cells without mutating their values. Binary is summarized by Gateway. */
export const formatPreviewValue = (value: unknown): string => {
  if (value == null) return 'null';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};
