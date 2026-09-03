import { describe, expect, it, vi } from 'vitest';

import {
  buildBeforeFinishInputValues,
  canCommitStepperFinish,
} from '../finish';

describe('buildBeforeFinishInputValues', () => {
  it('preserves extension draft fields stripped by node validation', () => {
    const localInputValues = {
      table_name: 'orders_draft',
      create_table_sql: 'CREATE TABLE orders_draft (id int);',
    } as any;

    expect(
      buildBeforeFinishInputValues(localInputValues, {
        table_name: 'orders',
      } as any)
    ).toEqual({
      table_name: 'orders',
      create_table_sql: 'CREATE TABLE orders_draft (id int);',
    });
  });
});

describe('canCommitStepperFinish', () => {
  it('allows a regular modal save without a step hook', async () => {
    await expect(canCommitStepperFinish(undefined, {})).resolves.toBe(true);
  });

  it('awaits the final step hook with validated input values', async () => {
    const beforeFinish = vi.fn(async () => true);
    const inputValues = { table_name: 'orders' } as any;

    await expect(
      canCommitStepperFinish(beforeFinish, inputValues)
    ).resolves.toBe(true);
    expect(beforeFinish).toHaveBeenCalledWith(inputValues);
  });

  it('stops the modal commit when the final step hook returns false', async () => {
    const beforeFinish = vi.fn(async () => false);

    await expect(
      canCommitStepperFinish(beforeFinish, { table_name: 'orders' } as any)
    ).resolves.toBe(false);
  });
});
