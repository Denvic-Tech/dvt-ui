import * as React from 'react';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import { Box, IconButton } from '@mui/material';
import dayjs, { type Dayjs } from 'dayjs';

import {
  EXPIRY_PRESETS,
  type TokenAccessForm,
  type TokenExpiryMode,
} from '../lib/tokenForm';

const WEEK_DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const formatMonth = (month: Dayjs): string => {
  const label = month.locale('ru').format('MMMM YYYY');

  return label.charAt(0).toUpperCase() + label.slice(1);
};

const monthButtonSx = {
  width: 28,
  height: 28,
  borderRadius: '8px',
  color: '#6B7385',
  '&:hover': { bgcolor: '#F1F3F8', color: '#1B1F2A' },
  '&.Mui-disabled': { opacity: 0.35, color: '#6B7385' },
};

type TokenExpiryCalendarProps = {
  form: TokenAccessForm;
  onChange: (form: TokenAccessForm) => void;
  onClose: () => void;
};

export const TokenExpiryCalendar = ({
  form,
  onChange,
  onClose,
}: TokenExpiryCalendarProps) => {
  const today = dayjs();
  const selectedDate = form.expiryMode === 'date' ? form.expiryDate : null;
  const [month, setMonth] = React.useState(() =>
    (selectedDate ?? today).startOf('month')
  );
  const leadingCells = (month.day() + 6) % 7;
  const days = Array.from({ length: month.daysInMonth() }, (_, index) =>
    month.date(index + 1)
  );

  const pick = (
    expiryMode: TokenExpiryMode,
    expiryDate: Dayjs | null = form.expiryDate
  ) => {
    onChange({ ...form, expiryMode, expiryDate });
    onClose();
  };

  return (
    <>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 0.5,
          pb: 1,
          mb: 0.75,
          borderBottom: '1px solid #EEF0F4',
        }}
      >
        {EXPIRY_PRESETS.map(preset => {
          const selected = form.expiryMode === preset.value;

          return (
            <Box
              key={preset.value}
              component='button'
              type='button'
              aria-pressed={selected}
              onClick={() => pick(preset.value)}
              sx={{
                height: 30,
                border: 'none',
                borderRadius: '7px',
                bgcolor: selected ? '#EEF0FF' : '#F5F6FA',
                color: selected ? '#4343D6' : '#3A4152',
                fontFamily: 'inherit',
                fontSize: 12.5,
                fontWeight: selected ? 600 : 500,
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                '&:hover': { bgcolor: selected ? '#EEF0FF' : '#EEF0F4' },
              }}
            >
              {preset.label}
            </Box>
          );
        })}
      </Box>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 0.5,
          color: '#1B1F2A',
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        <IconButton
          disableRipple
          aria-label='Предыдущий месяц'
          disabled={!month.isAfter(today, 'month')}
          onClick={() => setMonth(month.subtract(1, 'month'))}
          sx={monthButtonSx}
        >
          <ChevronLeftRoundedIcon sx={{ fontSize: 18 }} />
        </IconButton>
        <span>{formatMonth(month)}</span>
        <IconButton
          disableRipple
          aria-label='Следующий месяц'
          onClick={() => setMonth(month.add(1, 'month'))}
          sx={monthButtonSx}
        >
          <ChevronRightRoundedIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
          gap: '2px',
        }}
      >
        {WEEK_DAYS.map(weekDay => (
          <Box
            key={weekDay}
            sx={{
              height: 26,
              display: 'grid',
              placeItems: 'center',
              color: '#9AA0AD',
              fontSize: 11,
              fontWeight: 500,
            }}
          >
            {weekDay}
          </Box>
        ))}
        {leadingCells > 0 ? (
          <Box sx={{ gridColumn: `span ${leadingCells}` }} />
        ) : null}
        {days.map(day => {
          const selected = selectedDate?.isSame(day, 'day') === true;

          return (
            <Box
              key={day.date()}
              component='button'
              type='button'
              aria-pressed={selected}
              disabled={!day.isAfter(today, 'day')}
              // The token works until the end of the chosen day.
              onClick={() => pick('date', day.endOf('day'))}
              sx={{
                height: 32,
                p: 0,
                border: 'none',
                borderRadius: '8px',
                bgcolor: selected ? '#5B5BEF' : 'transparent',
                color: selected ? '#fff' : '#1B1F2A',
                fontFamily: 'inherit',
                fontSize: 13,
                fontWeight: selected ? 600 : 500,
                cursor: 'pointer',
                boxShadow: day.isSame(today, 'day')
                  ? 'inset 0 0 0 1px #DDE2EA'
                  : 'none',
                '&:hover': { bgcolor: selected ? '#5B5BEF' : '#F5F6FA' },
                '&:disabled': {
                  bgcolor: 'transparent',
                  color: '#C3C8D2',
                  cursor: 'default',
                },
              }}
            >
              {day.date()}
            </Box>
          );
        })}
      </Box>
    </>
  );
};
