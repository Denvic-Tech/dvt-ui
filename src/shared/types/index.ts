export type StateSetter<T> = (value: T | ((prev: T) => T)) => void;

export type AllKeysOptional<T> = keyof T extends never
  ? true
  : {
        [K in keyof T]-?: {} extends Pick<T, K> ? true : false;
      }[keyof T] extends true
    ? true
    : false;
