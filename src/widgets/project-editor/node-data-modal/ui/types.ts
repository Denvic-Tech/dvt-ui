import type { RawNodeInputValues } from '@/shared/lib/node-input-values';

export type IsValid = () => boolean | Promise<boolean>;
export type AnyDict = Partial<RawNodeInputValues>;
export type Setter<T> = (value: T | ((prev: T) => T)) => void;
export type StepperBeforeFinishHandler<T extends AnyDict = AnyDict> = (
  validatedInputValues: T
) => boolean | void | Promise<boolean | void>;
