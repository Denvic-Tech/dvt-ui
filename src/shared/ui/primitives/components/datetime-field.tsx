import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

import { type InputProps, Input } from './input.tsx';

dayjs.extend(utc);

export interface DateTimeFieldProps
  extends Omit<InputProps, 'onChange' | 'ref' | 'type' | 'value'> {
  onValueChange: (value: string | null) => void;
  step?: number;
  utc?: boolean;
  value?: string | null;
  withSeconds?: boolean;
}

const formatForInput = (
  value: string | null | undefined,
  withSeconds: boolean,
  utcValue: boolean
) => {
  if (!value) {
    return '';
  }

  const parsed = utcValue ? dayjs.utc(value) : dayjs(value);
  return parsed.isValid()
    ? parsed.format(withSeconds ? 'YYYY-MM-DDTHH:mm:ss' : 'YYYY-MM-DDTHH:mm')
    : '';
};

export const DateTimeField = ({
  onValueChange,
  step,
  utc: useUtc = true,
  value,
  withSeconds = true,
  ...props
}: DateTimeFieldProps) => (
  <Input
    inputProps={{ step: step ?? (withSeconds ? 1 : 60) }}
    type='datetime-local'
    value={formatForInput(value, withSeconds, useUtc)}
    onChange={event => {
      const rawValue = event.target.value;

      if (!rawValue) {
        onValueChange(null);
        return;
      }

      const parsed = useUtc ? dayjs.utc(rawValue) : dayjs(rawValue);
      onValueChange(parsed.isValid() ? parsed.toISOString() : null);
    }}
    {...props}
  />
);
