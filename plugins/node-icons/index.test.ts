import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { buildNodeIconSprite, readNodeIconSources } from './index';

const simple = (color = 'currentColor') =>
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" stroke="' +
  color +
  '" stroke-width="1.6" stroke-linecap="round"><path d="M2 2L18 18"/></svg>';

describe('node icon sprite builder', () => {
  it('packages all 62 source icons with their presentation attributes', async () => {
    const sources = await readNodeIconSources(
      path.resolve('src/shared/assets/node-icons')
    );
    const sprite = buildNodeIconSprite(sources);
    const doc = new DOMParser().parseFromString(sprite.svg, 'image/svg+xml');
    expect(doc.querySelector('parsererror')).toBeNull();
    expect(sprite.keys).toHaveLength(62);
    expect(doc.querySelectorAll('symbol')).toHaveLength(62);
    expect(sprite.keys).toEqual(
      expect.arrayContaining([
        'expand-json',
        'execute-sql',
        'text',
        'dataframe-unpivot',
        'get-mock-table-schema',
        'save-parquet',
      ])
    );
    const table = doc.getElementById('node-table-from-db')!;
    expect(table.getAttribute('viewBox')).toBe('0 0 20 20');
    expect(table.getAttribute('stroke')).toBe('currentColor');
    expect(table.getAttribute('stroke-width')).toBe('1.6');
    expect(table.getAttribute('fill')).toBe('none');
    expect(table.getAttribute('width')).toBeNull();
    expect(sprite.keys).toContain('json-path-extract');
    expect(sprite.keys).toContain('send-http-response');
    expect(doc.querySelector('[fill="#fff"]')).not.toBeNull();
    const ids = [...doc.querySelectorAll('[id]')].map(node => node.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(sprite.svg.length).toBeLessThan(
      sources.reduce((size, item) => size + item.source.length, 0)
    );
  });

  it('is deterministic across filesystem order and changes the hash for changed graphics', () => {
    const a = { key: 'a', source: simple() };
    const b = { key: 'b', source: simple('red') };
    expect(buildNodeIconSprite([a, b])).toEqual(buildNodeIconSprite([b, a]));
    expect(buildNodeIconSprite([a]).fileName).not.toBe(
      buildNodeIconSprite([{ ...a, source: simple('blue') }]).fileName
    );
  });

  it('isolates internal IDs and their references between icons', () => {
    const source =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">' +
      '<defs><linearGradient id="paint"><stop stop-color="red"/><stop offset="1" stop-color="blue"/></linearGradient></defs>' +
      '<path fill="url(#paint)" d="M0 0h20v20H0z"/></svg>';
    const sprite = buildNodeIconSprite([
      { key: 'a', source },
      { key: 'b', source },
    ]);
    const doc = new DOMParser().parseFromString(sprite.svg, 'image/svg+xml');
    const gradients = [...doc.querySelectorAll('linearGradient')];
    expect(gradients).toHaveLength(2);
    expect(gradients[0]!.id).not.toBe(gradients[1]!.id);
    for (const symbol of doc.querySelectorAll('symbol')) {
      const gradient = symbol.querySelector('linearGradient')!;
      expect(symbol.querySelector('[fill^="url("]')?.getAttribute('fill')).toBe(
        'url(#' + gradient.id + ')'
      );
    }
  });

  it('fails the build for duplicate keys, invalid XML or missing viewBox', () => {
    expect(() =>
      buildNodeIconSprite([
        { key: 'same', source: simple() },
        { key: 'same', source: simple() },
      ])
    ).toThrow('duplicate');
    expect(() =>
      buildNodeIconSprite([{ key: '../path', source: simple() }])
    ).toThrow('Invalid');
    expect(() =>
      buildNodeIconSprite([{ key: 'bad', source: '<svg>' }])
    ).toThrow();
    expect(() =>
      buildNodeIconSprite([{ key: 'bad', source: '<svg/>' }])
    ).toThrow('viewBox');
  });
});
