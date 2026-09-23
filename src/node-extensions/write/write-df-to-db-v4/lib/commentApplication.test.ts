import { describe, expect, it, vi } from 'vitest';

import {
  type ExtensionState,
  getPendingColumnActions,
  prepareWriteStepOnContinue,
  shouldShowColumnActionsLoadingOverlay,
} from './helpers';

const { apply } = vi.hoisted(() => ({ apply: vi.fn() }));
vi.mock('@/shared/gatewayClient', async importOriginal => ({
  ...(await importOriginal<typeof import('@/shared/gatewayClient')>()),
  client: { utils: { ddl: { applyTableColumnActions: { post: apply } } } },
}));

function setup(confirmed = true) {
  let state: ExtensionState = {
    inputConnectionMetadata: { connection_id: 'c', dialect: 'postgresql' },
    resolvedColumnRows: [{ db_name: 'id', db_comment: 'old', status: 'match' }],
    dbCommentOverrides: { id: 'new' },
    requestColumnActionsConfirm: vi.fn().mockResolvedValue(confirmed),
    applyTableMetadataUpdate: vi.fn(),
    invalidateCatalog: vi.fn(),
  };
  const context = {
    inputValues: { table_name: 'target', schema_name: 'public' },
    sharedState: state,
    setSharedState: (update: (previous: ExtensionState) => ExtensionState) => {
      state = update(state);
    },
  } as Parameters<typeof prepareWriteStepOnContinue>[0];
  return { context, state: () => state };
}

describe('applying column comment drafts', () => {
  it('confirms and applies comment-only changes, refreshing metadata and catalog', async () => {
    const h = setup();
    const table = { name: 'target', columns: [{ name: 'id', comment: 'new' }] };
    apply.mockResolvedValueOnce({ data: { table_metadata: table } });
    expect(
      shouldShowColumnActionsLoadingOverlay({
        ...h.context,
        projectID: 'test',
        nodeMetadataActuality: true,
      })
    ).toBe(true);
    await prepareWriteStepOnContinue(h.context);
    await Promise.resolve();
    expect(apply).toHaveBeenLastCalledWith(
      {
        body: expect.objectContaining({
          actions: [
            { type: 'set_column_comment', column_name: 'id', comment: 'new' },
          ],
        }),
      },
      { silent: true }
    );
    expect(h.state().applyTableMetadataUpdate).toHaveBeenCalledWith(table);
    expect(h.state().invalidateCatalog).toHaveBeenCalled();
    expect(h.state().dbCommentOverrides).toEqual({});
    expect(h.state().lastResolveColumnsKey).toBeNull();
  });

  it('keeps drafts and sends no DDL after cancelling confirmation', async () => {
    apply.mockClear();
    const h = setup(false);
    await expect(prepareWriteStepOnContinue(h.context)).rejects.toThrow(
      'COLUMN_ACTIONS_CANCELLED'
    );
    expect(h.state().dbCommentOverrides).toEqual({ id: 'new' });
    expect(apply).not.toHaveBeenCalled();
  });

  it('refreshes after a partial failure and never automatically reselects structural actions', async () => {
    const h = setup();
    h.context.sharedState!.selectedColumnActions = [
      { type: 'drop_column', column_name: 'other' },
    ];
    apply.mockRejectedValueOnce(new Error('partial DDL failure'));
    await prepareWriteStepOnContinue(h.context);
    await Promise.resolve();
    await Promise.resolve();
    expect(h.state().applyColumnActionsError).toBe('partial DDL failure');
    expect(h.state().dbCommentOverrides).toEqual({ id: 'new' });
    expect(h.state().selectedColumnActions).toEqual([]);
    expect(h.state().suppressDefaultColumnActions).toBe(true);
    expect(h.state().lastResolveColumnsKey).toBeNull();
    expect(h.state().invalidateCatalog).toHaveBeenCalled();
    const refreshed = {
      ...h.state(),
      resolvedColumnRows: [
        { db_name: 'id', db_comment: 'new', status: 'match' as const },
      ],
    };
    expect(getPendingColumnActions(refreshed)).toEqual([]);
  });
});
