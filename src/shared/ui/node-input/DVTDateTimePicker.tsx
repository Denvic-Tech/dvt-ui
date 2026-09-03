import React, { useEffect, useState } from 'react';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';

import 'dayjs/locale/ru';

dayjs.extend(utc);

interface DVTDateTimePickerProps {
  initialIsoValue?: string | null;
  onPythonDateTimeChange: (isoString: string | null) => void;
  label?: string | null;
  compact?: boolean;
  blurOnEnter?: boolean;
  disabled?: boolean;
}

export const DVTDateTimePicker: React.FC<DVTDateTimePickerProps> = ({
  initialIsoValue = null,
  onPythonDateTimeChange,
  label = 'Дата и время (UTC)',
  compact = false,
  blurOnEnter = false,
  disabled = false,
}) => {
  const parseIsoValue = (value: string | null): Dayjs | null => {
    if (!value) {
      return null;
    }

    const parsed = dayjs.utc(value);
    return parsed.isValid() ? parsed : null;
  };

  const [value, setValue] = useState<Dayjs | null>(
    parseIsoValue(initialIsoValue)
  );

  useEffect(() => {
    setValue(parseIsoValue(initialIsoValue));
  }, [initialIsoValue]);

  const handleEnterKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Enter' || !blurOnEnter) {
      return;
    }

    event.preventDefault();
    const input = event.currentTarget.querySelector('input');
    input?.blur();
  };

  const textFieldProps = {
    fullWidth: true,
    size: 'small' as const,
    ...(compact
      ? {
          ...(label ? { placeholder: label } : {}),
          sx: {
            '& .MuiInputBase-root': {
              height: 30,
              borderRadius: '8px',
              fontSize: 12,
            },
            '& .MuiInputBase-input': {
              py: 0.5,
            },
          },
        }
      : {}),
    ...(blurOnEnter ? { onKeyDown: handleEnterKeyDown } : {}),
  };

  const handleChange = (newValue: Dayjs | null) => {
    setValue(newValue);

    if (newValue === null) {
      onPythonDateTimeChange(null);
      return;
    }

    if (!newValue.isValid()) {
      return;
    }

    onPythonDateTimeChange(newValue.utc().toISOString());
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale='ru'>
      <DateTimePicker
        disabled={disabled}
        views={['year', 'month', 'day', 'hours', 'minutes', 'seconds']}
        label={compact || !label ? undefined : label}
        value={value}
        onChange={handleChange}
        timezone='UTC'
        ampm={false}
        format='DD.MM.YYYY HH:mm:ss'
        timeSteps={{ hours: 1, minutes: 1, seconds: 1 }}
        slotProps={{
          textField: textFieldProps,
          ...(compact
            ? {
                openPickerButton: {
                  sx: {
                    p: 0.5,
                    transition: 'none',
                    '&:hover': {
                      backgroundColor: 'transparent',
                    },
                  },
                },
                openPickerIcon: {
                  sx: {
                    fontSize: 16,
                  },
                },
              }
            : {}),
        }}
      />
    </LocalizationProvider>
  );
};
