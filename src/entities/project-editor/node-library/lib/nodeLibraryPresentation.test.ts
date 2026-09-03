import { describe, expect, it } from 'vitest';

import {
  buildNodeLibrarySections,
  getCategoryColor,
  getNodeDisplayTags,
  isDeprecatedNode,
  PINNED_NODE_LIBRARY_SECTION_ID,
} from './nodeLibraryPresentation';

describe('nodeLibraryPresentation', () => {
  const extractionNode = {
    name: 'load_csv',
    display_name: 'Load CSV',
    category: 'Extraction',
    tags: ['Fast'],
  } as any;

  const deprecatedNode = {
    name: 'query_from_db_v3',
    display_name: 'Query From DB V3',
    category: 'Extraction',
    tags: ['Deprecated', 'SQL'],
    deprecated: false,
  } as any;

  const jsonNode = {
    name: 'json_editor',
    display_name: 'JSON Editor',
    category: 'JSON',
    tags: [],
  } as any;

  it('returns a stable deterministic color for a category name', () => {
    expect(getCategoryColor('Extraction')).toBe(getCategoryColor('Extraction'));
    expect(getCategoryColor('Extraction')).toMatch(/^#/);
  });

  it('detects deprecated nodes from flag or tag and hides deprecated tag chip', () => {
    expect(isDeprecatedNode(deprecatedNode)).toBe(true);
    expect(
      isDeprecatedNode({
        deprecated: true,
        tags: [],
      } as any)
    ).toBe(true);
    expect(getNodeDisplayTags(deprecatedNode)).toEqual(['SQL']);
  });

  it('builds a pinned section and keeps pinned nodes in their category', () => {
    const sections = buildNodeLibrarySections({
      nodes: [jsonNode, deprecatedNode, extractionNode],
      pinnedNodeNames: ['load_csv'],
      collapsedCategories: {
        Extraction: true,
      },
    });

    expect(sections[0]).toMatchObject({
      id: PINNED_NODE_LIBRARY_SECTION_ID,
      count: 1,
      collapsible: false,
      collapsed: false,
    });
    expect(sections[0]?.nodes.map(node => node.name)).toEqual(['load_csv']);

    const extractionSection = sections.find(
      section => section.title === 'Extraction'
    );
    expect(extractionSection).toMatchObject({
      count: 2,
      collapsed: true,
      collapsible: true,
    });
    expect(extractionSection?.nodes.map(node => node.name)).toEqual([
      'load_csv',
      'query_from_db_v3',
    ]);
  });
});
