import { describe, expect, it } from 'vitest';

import { matchesNodeSearch } from './nodeSearch';

describe('node-library search helpers', () => {
  const nodeDefinition = {
    display_name: 'Load CSV',
    name: 'load_csv',
    category: 'Sources',
    description: 'Imports tabular data from csv files',
  };

  it('matches by display_name, name, category, and description', () => {
    expect(matchesNodeSearch(nodeDefinition, 'load csv')).toBe(true);
    expect(matchesNodeSearch(nodeDefinition, 'load_csv')).toBe(true);
    expect(matchesNodeSearch(nodeDefinition, 'sources')).toBe(true);
    expect(matchesNodeSearch(nodeDefinition, 'tabular data')).toBe(true);
  });

  it('returns true for empty search and false for unrelated terms', () => {
    expect(matchesNodeSearch(nodeDefinition, '')).toBe(true);
    expect(matchesNodeSearch(nodeDefinition, 'transform')).toBe(false);
  });
});
