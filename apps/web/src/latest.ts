/**
 * Work on the latest of a run of values only: a value waits `delay` ms for the next one, and
 * a result whose value has been overtaken (by a newer value, `flush` or `cancel`) is dropped,
 * so a slow result can never overwrite a newer one.
 */
export interface Latest<T> {
  /** Work on `value` once `delay` ms pass without another. */
  schedule(value: T): void;
  /** Work on `value` now, overtaking anything waiting or underway. */
  flush(value: T): void;
  /** Drop anything waiting or underway. */
  cancel(): void;
}

export function latest<T, R>(work: (value: T) => R | Promise<R>, commit: (result: R) => void, delay: number): Latest<T> {
  let generation = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const cancel = () => {
    generation++;
    clearTimeout(timer);
    timer = undefined;
  };

  const run = async (value: T, mine: number) => {
    const result = await work(value);
    if (mine === generation) commit(result);
  };

  return {
    schedule(value) {
      cancel();
      const mine = generation;
      timer = setTimeout(() => void run(value, mine), delay);
    },
    flush(value) {
      cancel();
      void run(value, generation);
    },
    cancel,
  };
}
