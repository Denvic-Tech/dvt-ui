export interface ReplaceValuePair {
  id: number;
  key: string;
  value: string;
}

export const createEmptyPair = (): ReplaceValuePair => ({
  id: Date.now(),
  key: '',
  value: '',
});

export const mapDictionaryToPairs = (
  dictionary: Record<string, string>
): ReplaceValuePair[] =>
  Object.entries(dictionary).map(([key, value], idx) => ({
    id: idx,
    key,
    value,
  }));

export const buildDictionaryFromPairs = (
  sourcePairs: Pick<ReplaceValuePair, 'key' | 'value'>[]
): Record<string, string> => {
  const dictionary: Record<string, string> = {};

  sourcePairs.forEach(pair => {
    if (pair.key !== '' || pair.value !== '') {
      dictionary[pair.key] = pair.value;
    }
  });

  return dictionary;
};
