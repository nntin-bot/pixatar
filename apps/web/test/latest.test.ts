import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { latest } from '../src/latest';

const later = <T>(value: T, ms: number) => new Promise<T>((resolve) => setTimeout(() => resolve(value), ms));

describe('latest', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('works on the last of a burst of values once the delay passes', async () => {
    const work = vi.fn((v: string) => v.toUpperCase());
    const commit = vi.fn();
    const l = latest(work, commit, 100);
    l.schedule('a');
    l.schedule('ab');
    await vi.advanceTimersByTimeAsync(99);
    l.schedule('abc');
    await vi.advanceTimersByTimeAsync(99);
    expect(work).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(work).toHaveBeenCalledExactlyOnceWith('abc');
    expect(commit).toHaveBeenCalledExactlyOnceWith('ABC');
  });

  it('drops a slow result once a newer value has overtaken it', async () => {
    const commit = vi.fn();
    // the older value takes longer than the newer one
    const l = latest((v: string) => later(v, v === 'old' ? 500 : 10), commit, 0);
    l.schedule('old');
    await vi.advanceTimersByTimeAsync(1);
    l.schedule('new');
    await vi.advanceTimersByTimeAsync(1000);
    expect(commit.mock.calls).toEqual([['new']]);
  });

  it('flush works at once and overtakes a waiting value', async () => {
    const commit = vi.fn();
    const l = latest((v: string) => v, commit, 100);
    l.schedule('waiting');
    l.flush('now');
    await vi.advanceTimersByTimeAsync(0);
    expect(commit.mock.calls).toEqual([['now']]);
    await vi.advanceTimersByTimeAsync(200);
    expect(commit.mock.calls).toEqual([['now']]);
  });

  it('cancel drops what is waiting and what is underway', async () => {
    const commit = vi.fn();
    const l = latest((v: string) => later(v, 50), commit, 10);
    l.schedule('waiting');
    l.cancel();
    l.flush('underway');
    await vi.advanceTimersByTimeAsync(5);
    l.cancel();
    await vi.advanceTimersByTimeAsync(500);
    expect(commit).not.toHaveBeenCalled();
  });
});
