import { describe, expect, it, vi } from 'vitest';

import { createExclusiveConfirm } from '../exclusiveConfirm';

const createDeferred = () => {
  let resolve!: (value: boolean) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<boolean>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

describe('createExclusiveConfirm', () => {
  it('drops repeated requests while a confirmation is open', async () => {
    const runExclusive = createExclusiveConfirm();
    const first = createDeferred();
    const openFirst = vi.fn(() => first.promise);
    const openRepeated = vi.fn(() => Promise.resolve(true));

    const firstResult = runExclusive(openFirst);
    const repeatedResults = await Promise.all(
      Array.from({ length: 20 }, () => runExclusive(openRepeated))
    );

    expect(openFirst).toHaveBeenCalledTimes(1);
    expect(openRepeated).not.toHaveBeenCalled();
    expect(repeatedResults.every(result => result === false)).toBe(true);

    first.resolve(true);
    await expect(firstResult).resolves.toBe(true);
  });

  it('allows a new confirmation after the previous one is closed', async () => {
    const runExclusive = createExclusiveConfirm();

    await expect(runExclusive(() => Promise.resolve(false))).resolves.toBe(
      false
    );
    await expect(runExclusive(() => Promise.resolve(true))).resolves.toBe(true);
  });

  it('releases the lock when the confirmation fails', async () => {
    const runExclusive = createExclusiveConfirm();
    const failing = createDeferred();

    const failed = runExclusive(() => failing.promise);
    failing.reject(new Error('dialog provider missing'));
    await expect(failed).rejects.toThrow('dialog provider missing');

    await expect(runExclusive(() => Promise.resolve(true))).resolves.toBe(true);
  });
});
