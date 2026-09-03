import React, { useEffect, useState } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import * as S from './styles.ts';

interface CronBuilderProps {
  value: string;
  onChange: (cron: string) => void;
}

type Mode = 'hourly' | 'daily' | 'weekly' | 'custom';

const range = (start: number, end: number) =>
  Array.from({ length: end - start + 1 }, (_, i) => start + i);

const daysOfWeek = [
  { val: 'MON', label: 'Пн' },
  { val: 'TUE', label: 'Вт' },
  { val: 'WED', label: 'Ср' },
  { val: 'THU', label: 'Чт' },
  { val: 'FRI', label: 'Пт' },
  { val: 'SAT', label: 'Сб' },
  { val: 'SUN', label: 'Вс' },
];

export const CronBuilder: React.FC<CronBuilderProps> = ({
  value,
  onChange,
}) => {
  const [mode, setMode] = useState<Mode>('daily');

  // Раздельные состояния для каждого компонента времени
  const [minutes, setMinutes] = useState<number[]>([0]);
  const [hours, setHours] = useState<number[]>([12]);
  const [weekDays, setWeekDays] = useState<string[]>(['MON']);
  const [rawCron, setRawCron] = useState(value);

  // Сборка итоговой строки Cron
  const buildAndPush = (
    currentMode: Mode,
    mins: number[],
    hrs: number[],
    days: string[]
  ) => {
    const fmt = (arr: (number | string)[]) =>
      arr.length === 0
        ? '*'
        : arr.sort((a, b) => Number(a) - Number(b)).join(',');

    let result = '* * * * *';
    switch (currentMode) {
      case 'hourly':
        result = `${fmt(mins)} * * * *`;
        break;
      case 'daily':
        result = `${fmt(mins)} ${fmt(hrs)} * * *`;
        break;
      case 'weekly':
        result = `${fmt(mins)} ${fmt(hrs)} * * ${fmt(days)}`;
        break;
      case 'custom':
        result = rawCron;
        break;
    }
    onChange(result);
  };

  // Обработчики кликов с явным указанием типа
  const handleMinuteClick = (m: number) => {
    const next = [m]; // Single select для простоты
    setMinutes(next);
    buildAndPush(mode, next, hours, weekDays);
  };

  const handleHourClick = (h: number) => {
    const next = [h]; // Single select
    setHours(next);
    buildAndPush(mode, minutes, next, weekDays);
  };

  const handleDayClick = (day: string) => {
    const next = weekDays.includes(day)
      ? weekDays.filter(d => d !== day)
      : [...weekDays, day];
    const finalDays = next.length === 0 ? ['MON'] : next;
    setWeekDays(finalDays);
    buildAndPush(mode, minutes, hours, finalDays);
  };

  const handleModeToggle = (newMode: Mode) => {
    setMode(newMode);
    buildAndPush(newMode, minutes, hours, weekDays);
  };

  return (
    <S.CronContainer>
      <S.TabsContainer>
        <S.Tab
          active={mode === 'hourly'}
          onClick={() => handleModeToggle('hourly')}
        >
          Ежечасно
        </S.Tab>
        <S.Tab
          active={mode === 'daily'}
          onClick={() => handleModeToggle('daily')}
        >
          Ежедневно
        </S.Tab>
        <S.Tab
          active={mode === 'weekly'}
          onClick={() => handleModeToggle('weekly')}
        >
          Еженедельно
        </S.Tab>
        <S.Tab
          active={mode === 'custom'}
          onClick={() => handleModeToggle('custom')}
        >
          Custom
        </S.Tab>
      </S.TabsContainer>

      {/* Выбор времени для Daily и Weekly */}
      {(mode === 'daily' || mode === 'weekly') && (
        <Stack spacing={2}>
          <Box>
            <S.Label>ЧАСЫ</S.Label>
            <S.GridContainer style={{ gridTemplateColumns: 'repeat(8, 1fr)' }}>
              {range(0, 23).map(h => (
                <S.GridItem
                  key={h}
                  selected={hours.includes(h)}
                  onClick={() => handleHourClick(h)}
                >
                  {h.toString().padStart(2, '0')}
                </S.GridItem>
              ))}
            </S.GridContainer>
          </Box>
          <Box>
            <S.Label>МИНУТЫ</S.Label>
            <S.GridContainer style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
              {[0, 15, 30, 45].map(m => (
                <S.GridItem
                  key={m}
                  selected={minutes.includes(m)}
                  onClick={() => handleMinuteClick(m)}
                >
                  {m.toString().padStart(2, '0')}
                </S.GridItem>
              ))}
            </S.GridContainer>
          </Box>
        </Stack>
      )}

      {/* Выбор минуты для Hourly */}
      {mode === 'hourly' && (
        <Box>
          <S.Label>МИНУТА КАЖДОГО ЧАСА</S.Label>
          <S.GridContainer style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
            {range(0, 55)
              .filter(n => n % 5 === 0)
              .map(m => (
                <S.GridItem
                  key={m}
                  selected={minutes.includes(m)}
                  onClick={() => handleMinuteClick(m)}
                >
                  {m.toString().padStart(2, '0')}
                </S.GridItem>
              ))}
          </S.GridContainer>
        </Box>
      )}

      {/* Дни недели для Weekly */}
      {mode === 'weekly' && (
        <Box mt={1}>
          <S.Label>ДНИ НЕДЕЛИ</S.Label>
          <S.GridContainer style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {daysOfWeek.map(d => (
              <S.GridItem
                key={d.val}
                selected={weekDays.includes(d.val)}
                onClick={() => handleDayClick(d.val)}
              >
                {d.label}
              </S.GridItem>
            ))}
          </S.GridContainer>
        </Box>
      )}

      {/* Custom ввод */}
      {mode === 'custom' && (
        <Box>
          <S.Label>CRON ВЫРАЖЕНИЕ</S.Label>
          <S.Input
            value={rawCron}
            onChange={e => {
              setRawCron(e.target.value);
              onChange(e.target.value);
            }}
            placeholder='* * * * *'
          />
        </Box>
      )}

      {/* Превью результата */}
      {mode !== 'custom' && (
        <Box
          sx={{
            mt: 2,
            p: 1.5,
            bgcolor: S.colors.indigo100,
            borderRadius: 2,
            border: `1px dashed ${S.colors.indigo500}`,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <Typography
            variant='caption'
            sx={{
              color: S.colors.indigo600,
              fontWeight: 700,
              fontFamily: 'monospace',
            }}
          >
            Результат: {value}
          </Typography>
        </Box>
      )}
    </S.CronContainer>
  );
};
