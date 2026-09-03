export function deepMerge<T extends Record<string, any>>(
  target: T,
  source: Partial<T>
): T {
  const out: any = { ...target };
  for (const [k, v] of Object.entries(source ?? {})) {
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      out[k] = deepMerge(out[k] ?? {}, v as any);
    } else {
      out[k] = v;
    }
  }
  return out;
}
