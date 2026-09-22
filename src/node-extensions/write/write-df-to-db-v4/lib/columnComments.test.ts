import { describe, expect, it } from 'vitest';

import type { WriteColumnResolutionRow } from '@/shared/gatewayClient';

import {
  commentTargetKey,
  commentValue,
  mergeCommentActions,
  normalizeComment,
} from './columnComments';
import {
  buildCreateSqlCacheKey,
  buildDbColumnsFromColumnMapping,
} from './helpers';

const rows: WriteColumnResolutionRow[] = [
  {
    source_name: 'source',
    db_name: 'target',
    source_comment: 'DF',
    db_comment: 'DB',
    status: 'match',
  },
  {
    source_name: null,
    db_name: 'db_only',
    db_comment: null,
    status: 'missing_in_dataframe',
  },
  {
    source_name: 'new',
    db_name: null,
    source_comment: 'new DF',
    status: 'missing_in_db',
    suggested_action: { type: 'add_column', column_name: 'new_target' },
  },
];

describe('column comment drafts', () => {
  it('inherits metadata until an explicit override, including deletion', () => {
    expect(commentValue({}, 'x', 'DF')).toBe('DF');
    expect(commentValue({ x: null }, 'x', 'DF')).toBeNull();
    expect(commentValue({ x: '' }, 'x', 'DF')).toBeNull();
    expect(normalizeComment('  text\n ')).toBe('  text\n ');
  });
  it('generates only dirty changes, including DB-only columns', () => {
    expect(mergeCommentActions([], rows, { target: 'DB' })).toEqual([]);
    expect(
      mergeCommentActions([], rows, { target: null, db_only: 'added' })
    ).toEqual([
      { type: 'set_column_comment', column_name: 'target', comment: null },
      { type: 'set_column_comment', column_name: 'db_only', comment: 'added' },
    ]);
    expect(
      mergeCommentActions(
        [],
        rows.map(row => ({ ...row, db_comment: 'edited' })),
        { target: 'edited' }
      )
    ).toEqual([]);
  });
  it('keeps drafts on their DB target after remapping', () => {
    const remapped = [
      { ...rows[0]!, db_name: 'other' },
      { ...rows[1]!, db_name: 'target', db_comment: 'DB' },
    ];
    expect(mergeCommentActions([], remapped, { target: 'edited' })).toEqual([
      { type: 'set_column_comment', column_name: 'target', comment: 'edited' },
    ]);
    expect(commentTargetKey('c', 'db', 's', 'one')).not.toBe(
      commentTargetKey('c', 'db', 's', 'two')
    );
  });
  it('merges comments into structural actions and suppresses deletion edits', () => {
    const column = { name: 'target', dtype: 'INT' as const };
    const overrides = { target: 'edited' };
    expect(
      mergeCommentActions(
        [{ type: 'recreate_column', column_name: 'target', column }],
        rows,
        overrides
      )[0]?.column?.comment
    ).toBe('edited');
    expect(
      mergeCommentActions(
        [{ type: 'recreate_column', column_name: 'target', column }],
        rows
      )[0]?.column?.comment
    ).toBe('DB');
    expect(
      mergeCommentActions(
        [{ type: 'drop_column', column_name: 'target' }],
        rows,
        overrides
      )
    ).toEqual([{ type: 'drop_column', column_name: 'target' }]);
    expect(mergeCommentActions([], rows, overrides)).toHaveLength(1);
  });
  it('uses DF comments for new columns and preserves explicit clearing', () => {
    const action = {
      type: 'add_column' as const,
      column_name: 'new_target',
      column: { name: 'new_target', dtype: 'INT' as const },
    };
    expect(mergeCommentActions([action], rows)[0]?.column?.comment).toBe(
      'new DF'
    );
    expect(
      mergeCommentActions([action], rows, {}, { new: null })[0]?.column?.comment
    ).toBeNull();
  });
  it('passes creation comments separately from runtime mappings and changes preview keys', () => {
    const dataframeMetadata = {
      columns: [{ name: 'source', dtype: 'INT' as const, comment: 'DF' }],
    };
    expect(
      buildDbColumnsFromColumnMapping({ dataframeMetadata })[0]?.comment
    ).toBe('DF');
    expect(
      buildDbColumnsFromColumnMapping({
        dataframeMetadata,
        commentOverrides: { source: null },
      })[0]?.comment
    ).toBeNull();
    const args = { mode: 'typed' as const, dataframeMetadata, inputValues: {} };
    expect(buildCreateSqlCacheKey(args)).not.toBe(
      buildCreateSqlCacheKey({ ...args, commentOverrides: { source: null } })
    );
  });
  it('keeps unsupported comments out of structural DDL payloads', () => {
    const action = {
      type: 'add_column' as const,
      column_name: 'new_target',
      column: { name: 'new_target', dtype: 'INT' as const, comment: 'DF' },
    };
    expect(
      mergeCommentActions([action], rows, { target: 'edit' }, {}, false)
    ).toEqual([{ ...action, column: { ...action.column, comment: null } }]);
    const dataframeMetadata = {
      columns: [{ name: 'source', dtype: 'INT' as const, comment: 'DF' }],
    };
    expect(
      buildDbColumnsFromColumnMapping({
        dataframeMetadata,
        commentsSupported: false,
      })[0]?.comment
    ).toBeNull();
  });
});
