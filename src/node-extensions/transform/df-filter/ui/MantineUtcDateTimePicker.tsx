import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import { IconButton, InputAdornment, TextField, Typography } from '@mui/material';
import { ActionIcon, CheckIcon, MantineProvider, Popover } from '@mantine/core';
import { DatePicker, TimePicker } from '@mantine/dates';
import { useClickOutside } from '@mantine/hooks';
import dayjs, { type Dayjs } from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import utc from 'dayjs/plugin/utc';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';

dayjs.extend(utc);
dayjs.extend(customParseFormat);

const DISPLAY_FORMAT = 'DD.MM.YYYY HH:mm:ss';
const DISPLAY_MASK = 'ДД.ММ.ГГГГ ЧЧ:ММ:СС';
const DISPLAY_MASK_PLACEHOLDERS = '__.__.____ __:__:__';
const DATE_FORMAT = 'YYYY-MM-DD';
const TIME_FORMAT = 'HH:mm:ss';
const MAX_INPUT_DIGITS = 14;
const MASK_DIGIT_POSITIONS = [0, 1, 3, 4, 6, 7, 8, 9, 11, 12, 14, 15, 17, 18];
const MASK_LENGTH = DISPLAY_MASK_PLACEHOLDERS.length;
const DIGIT_KEY_RE = /^\d$/;

interface MantineUtcDateTimePickerProps {
  initialIsoValue?: string | null;
  onPythonDateTimeChange: (isoString: string | null) => void;
  compact?: boolean;
  blurOnEnter?: boolean;
  onApply?: () => void;
}

const parseIsoValue = (value: string | null | undefined): Dayjs | null => {
  if (!value) {
    return null;
  }

  const parsed = dayjs.utc(value);
  return parsed.isValid() ? parsed.millisecond(0) : null;
};

const getInputDigits = (value: string): string =>
  value.replace(/\D/g, '').slice(0, MAX_INPUT_DIGITS);

const createEmptySlots = (): string[] =>
  Array.from({ length: MAX_INPUT_DIGITS }, () => '');

const digitsToSlots = (digits: string): string[] => {
  const slots = createEmptySlots();
  const normalizedDigits = getInputDigits(digits);

  for (let index = 0; index < normalizedDigits.length; index += 1) {
    slots[index] = normalizedDigits[index];
  }

  return slots;
};

const slotsHaveAnyDigit = (slots: string[]): boolean =>
  slots.some(slot => slot.length > 0);

const slotsAreComplete = (slots: string[]): boolean =>
  slots.every(slot => slot.length === 1);

const slotsToCompleteDigits = (slots: string[]): string | null =>
  slotsAreComplete(slots) ? slots.join('') : null;

const parseDisplayDigits = (digits: string): Dayjs | null => {
  if (digits.length !== MAX_INPUT_DIGITS) {
    return null;
  }

  const normalized = `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4, 8)} ${digits.slice(8, 10)}:${digits.slice(10, 12)}:${digits.slice(12, 14)}`;
  const parsed = dayjs.utc(normalized, DISPLAY_FORMAT, true);
  return parsed.isValid() ? parsed.millisecond(0) : null;
};

const formatTimeValue = (value: Dayjs | null): string =>
  value ? value.format(TIME_FORMAT) : '00:00:00';

const formatMaskedInputFromSlots = (slots: string[]): string => {
  if (!slotsHaveAnyDigit(slots)) {
    return '';
  }

  const masked = DISPLAY_MASK_PLACEHOLDERS.split('');
  for (let index = 0; index < MAX_INPUT_DIGITS; index += 1) {
    const maskPosition = MASK_DIGIT_POSITIONS[index];
    const value = slots[index];
    masked[maskPosition] = value || '_';
  }

  return masked.join('');
};

const getDigitsFromDateTime = (value: Dayjs | null): string =>
  value ? value.format('DDMMYYYYHHmmss') : '';

const slotIndexFromCaretForward = (caret: number): number | null => {
  for (let index = 0; index < MAX_INPUT_DIGITS; index += 1) {
    if (MASK_DIGIT_POSITIONS[index] >= caret) {
      return index;
    }
  }

  return null;
};

const slotIndexFromCaretBackward = (caret: number): number | null => {
  for (let index = MAX_INPUT_DIGITS - 1; index >= 0; index -= 1) {
    if (MASK_DIGIT_POSITIONS[index] < caret) {
      return index;
    }
  }

  return null;
};

const selectedSlotRange = (
  selectionStart: number,
  selectionEnd: number
): { start: number; end: number } | null => {
  if (selectionStart >= selectionEnd) {
    return null;
  }

  let startSlot: number | null = null;
  let endSlot: number | null = null;

  for (let index = 0; index < MAX_INPUT_DIGITS; index += 1) {
    const position = MASK_DIGIT_POSITIONS[index];
    if (position >= selectionStart && position < selectionEnd) {
      if (startSlot == null) {
        startSlot = index;
      }
      endSlot = index;
    }
  }

  if (startSlot == null || endSlot == null) {
    return null;
  }

  return { start: startSlot, end: endSlot };
};

const caretPositionForSlotStart = (slotIndex: number): number =>
  MASK_DIGIT_POSITIONS[slotIndex] ?? MASK_LENGTH;

const caretPositionAfterSlot = (slotIndex: number): number =>
  slotIndex + 1 < MAX_INPUT_DIGITS
    ? MASK_DIGIT_POSITIONS[slotIndex + 1]
    : MASK_LENGTH;

export const MantineUtcDateTimePicker: React.FC<
  MantineUtcDateTimePickerProps
> = ({
  initialIsoValue = null,
  onPythonDateTimeChange,
  compact = false,
  blurOnEnter = false,
  onApply,
}) => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const pendingCaretRef = useRef<number | null>(null);
  const [opened, setOpened] = useState(false);
  const [selectedDateTime, setSelectedDateTime] = useState<Dayjs | null>(() =>
    parseIsoValue(initialIsoValue)
  );
  const [inputSlots, setInputSlots] = useState<string[]>(() =>
    digitsToSlots(getDigitsFromDateTime(parseIsoValue(initialIsoValue)))
  );

  useEffect(() => {
    const nextValue = parseIsoValue(initialIsoValue);
    setSelectedDateTime(nextValue);
    setInputSlots(digitsToSlots(getDigitsFromDateTime(nextValue)));
  }, [initialIsoValue]);

  const commitValue = useCallback(
    (value: Dayjs | null) => {
      setSelectedDateTime(value);
      setInputSlots(digitsToSlots(getDigitsFromDateTime(value)));
      onPythonDateTimeChange(value ? value.toISOString() : null);
    },
    [onPythonDateTimeChange]
  );

  const restoreLastValidValue = useCallback(() => {
    setInputSlots(digitsToSlots(getDigitsFromDateTime(selectedDateTime)));
  }, [selectedDateTime]);

  useLayoutEffect(() => {
    const nextCaret = pendingCaretRef.current;
    if (nextCaret == null || !inputRef.current) {
      return;
    }

    pendingCaretRef.current = null;
    inputRef.current.setSelectionRange(nextCaret, nextCaret);
  }, [inputSlots]);

  const closeDropdown = useCallback(() => {
    setOpened(false);
    if (!slotsHaveAnyDigit(inputSlots)) {
      commitValue(null);
      return;
    }

    const completeDigits = slotsToCompleteDigits(inputSlots);
    if (!completeDigits) {
      restoreLastValidValue();
      return;
    }

    const parsed = parseDisplayDigits(completeDigits);
    if (parsed) {
      commitValue(parsed);
      return;
    }

    restoreLastValidValue();
  }, [commitValue, inputSlots, restoreLastValidValue]);

  useClickOutside(closeDropdown, undefined, [
    rootRef.current,
    dropdownRef.current,
  ]);

  const applySlots = useCallback(
    (nextSlots: string[]) => {
      setInputSlots(nextSlots);

      if (!slotsHaveAnyDigit(nextSlots)) {
        setSelectedDateTime(null);
        onPythonDateTimeChange(null);
        return;
      }

      const completeDigits = slotsToCompleteDigits(nextSlots);
      if (!completeDigits) {
        return;
      }

      const parsed = parseDisplayDigits(completeDigits);
      if (!parsed) {
        return;
      }

      setSelectedDateTime(parsed);
      onPythonDateTimeChange(parsed.toISOString());
    },
    [onPythonDateTimeChange]
  );

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      applySlots(digitsToSlots(event.currentTarget.value));
    },
    [applySlots]
  );

  const handleDateChange = useCallback(
    (nextDate: string | null) => {
      if (!nextDate) {
        commitValue(null);
        return;
      }

      const parsedDate = dayjs.utc(nextDate, DATE_FORMAT, true);
      if (!parsedDate.isValid()) {
        return;
      }

      const base = selectedDateTime ?? dayjs.utc().startOf('day');
      commitValue(
        parsedDate
          .hour(base.hour())
          .minute(base.minute())
          .second(base.second())
          .millisecond(0)
      );
    },
    [commitValue, selectedDateTime]
  );

  const handleTimeChange = useCallback(
    (nextTime: string) => {
      if (!nextTime) {
        return;
      }

      const parsedTime = dayjs.utc(nextTime, TIME_FORMAT, true);
      if (!parsedTime.isValid()) {
        return;
      }

      const base = selectedDateTime ?? dayjs.utc().startOf('day');
      commitValue(
        base
          .hour(parsedTime.hour())
          .minute(parsedTime.minute())
          .second(parsedTime.second())
          .millisecond(0)
      );
    },
    [commitValue, selectedDateTime]
  );

  const handleInputKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      const selectionStart = event.currentTarget.selectionStart ?? 0;
      const selectionEnd = event.currentTarget.selectionEnd ?? selectionStart;
      const range = selectedSlotRange(selectionStart, selectionEnd);

      if (DIGIT_KEY_RE.test(event.key)) {
        event.preventDefault();

        const nextSlots = [...inputSlots];
        let slotIndex =
          range?.start ?? slotIndexFromCaretForward(selectionStart) ?? null;
        if (slotIndex == null) {
          return;
        }

        if (range) {
          for (let index = range.start; index <= range.end; index += 1) {
            nextSlots[index] = '';
          }
          slotIndex = range.start;
        }

        nextSlots[slotIndex] = event.key;
        pendingCaretRef.current = caretPositionAfterSlot(slotIndex);
        applySlots(nextSlots);
        return;
      }

      if (event.key === 'Backspace') {
        event.preventDefault();

        const nextSlots = [...inputSlots];
        if (range) {
          for (let index = range.start; index <= range.end; index += 1) {
            nextSlots[index] = '';
          }
          pendingCaretRef.current = caretPositionForSlotStart(range.start);
          applySlots(nextSlots);
          return;
        }

        const slotIndex = slotIndexFromCaretBackward(selectionStart);
        if (slotIndex == null) {
          return;
        }

        nextSlots[slotIndex] = '';
        pendingCaretRef.current = caretPositionForSlotStart(slotIndex);
        applySlots(nextSlots);
        return;
      }

      if (event.key === 'Delete') {
        event.preventDefault();

        const nextSlots = [...inputSlots];
        if (range) {
          for (let index = range.start; index <= range.end; index += 1) {
            nextSlots[index] = '';
          }
          pendingCaretRef.current = caretPositionForSlotStart(range.start);
          applySlots(nextSlots);
          return;
        }

        const slotIndex = slotIndexFromCaretForward(selectionStart);
        if (slotIndex == null) {
          return;
        }

        nextSlots[slotIndex] = '';
        pendingCaretRef.current = caretPositionForSlotStart(slotIndex);
        applySlots(nextSlots);
        return;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        restoreLastValidValue();
        setOpened(false);
        return;
      }

      if (event.key === 'Enter' && blurOnEnter) {
        event.preventDefault();
        closeDropdown();
        onApply?.();
        event.currentTarget.blur();
      }
    },
    [
      applySlots,
      blurOnEnter,
      closeDropdown,
      inputSlots,
      onApply,
      restoreLastValidValue,
    ]
  );

  const muiInputSx = useMemo(
    () => ({
      width: '100%',
      '& .MuiInputBase-root': {
        width: '100%',
        ...(compact
          ? {
              minHeight: 30,
              height: 30,
              borderRadius: '8px',
            }
          : {}),
      },
      '& .MuiInputBase-input': {
        ...(compact
          ? {
              height: '30px',
              boxSizing: 'border-box',
              fontSize: '12px',
              lineHeight: '30px',
              padding: '0 12px',
            }
          : {}),
      },
      '& .MuiFormHelperText-root': {
        ...(compact
          ? {
              marginTop: '4px',
              fontSize: '10px',
              lineHeight: 1.3,
              color: '#9ca3af',
            }
          : {}),
      },
    }),
    [compact]
  );

  return (
    <MantineProvider
      forceColorScheme='light'
      withCssVariables={false}
      withGlobalClasses={false}
    >
      <Popover
        opened={opened}
        withinPortal={false}
        position='bottom-start'
        offset={6}
        shadow='md'
      >
        <Popover.Target>
          <div ref={rootRef}>
            <Typography
              sx={{
                mb: 0.5,
                fontSize: compact ? '10px' : '12px',
                lineHeight: 1.3,
                color: '#9ca3af',
              }}
            >
              {`Формат: ${DISPLAY_MASK}`}
            </Typography>
            <TextField
              inputRef={inputRef}
              value={formatMaskedInputFromSlots(inputSlots)}
              onChange={handleInputChange}
              placeholder={DISPLAY_MASK}
              size='small'
              fullWidth
              autoComplete='off'
              sx={muiInputSx}
              InputProps={{
                endAdornment: (
                  <InputAdornment position='end'>
                    <IconButton
                      size='small'
                      edge='end'
                      aria-label='Открыть календарь'
                      onMouseDown={event => event.preventDefault()}
                      onClick={event => {
                        event.preventDefault();
                        event.stopPropagation();
                        setOpened(prev => !prev);
                      }}
                    >
                      <CalendarMonthOutlinedIcon fontSize='small' />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              inputProps={{
                inputMode: 'numeric',
                onKeyDown: handleInputKeyDown,
                onPaste: event => {
                  event.preventDefault();
                  const pasted = event.clipboardData.getData('text');
                  const digits = getInputDigits(pasted);
                  if (!digits) {
                    return;
                  }

                  const input = event.currentTarget;
                  const selectionStart = input.selectionStart ?? 0;
                  const selectionEnd = input.selectionEnd ?? selectionStart;
                  const range = selectedSlotRange(selectionStart, selectionEnd);
                  const startSlot =
                    range?.start ?? slotIndexFromCaretForward(selectionStart);
                  if (startSlot == null) {
                    return;
                  }

                  const nextSlots = [...inputSlots];
                  if (range) {
                    for (
                      let index = range.start;
                      index <= range.end;
                      index += 1
                    ) {
                      nextSlots[index] = '';
                    }
                  }

                  let slotIndex = startSlot;
                  for (const digit of digits) {
                    if (slotIndex >= MAX_INPUT_DIGITS) {
                      break;
                    }
                    nextSlots[slotIndex] = digit;
                    slotIndex += 1;
                  }

                  pendingCaretRef.current =
                    slotIndex >= MAX_INPUT_DIGITS
                      ? MASK_LENGTH
                      : caretPositionForSlotStart(slotIndex);
                  applySlots(nextSlots);
                },
              }}
            />
          </div>
        </Popover.Target>

        <Popover.Dropdown p={8}>
          <div ref={dropdownRef}>
            <DatePicker
              type='default'
              value={selectedDateTime?.format(DATE_FORMAT) ?? null}
              onChange={handleDateChange}
            />
            <div
              style={{
                marginTop: 8,
                display: 'flex',
                alignItems: 'stretch',
                gap: 8,
              }}
            >
              <TimePicker
                value={formatTimeValue(selectedDateTime)}
                onChange={handleTimeChange}
                withSeconds
                withDropdown={false}
                size='xs'
                style={{ flex: 1 }}
                hoursInputProps={{
                  onKeyDown: event => {
                    if (event.key === 'Enter' && blurOnEnter) {
                      event.preventDefault();
                      closeDropdown();
                      onApply?.();
                    }
                  },
                }}
                minutesInputProps={{
                  onKeyDown: event => {
                    if (event.key === 'Enter' && blurOnEnter) {
                      event.preventDefault();
                      closeDropdown();
                      onApply?.();
                    }
                  },
                }}
                secondsInputProps={{
                  onKeyDown: event => {
                    if (event.key === 'Enter' && blurOnEnter) {
                      event.preventDefault();
                      closeDropdown();
                      onApply?.();
                    }
                  },
                }}
              />
              <ActionIcon
                variant='default'
                size='sm'
                onClick={event => {
                  event.preventDefault();
                  closeDropdown();
                  onApply?.();
                }}
                aria-label='Сохранить дату и закрыть календарь'
                style={{
                  height: 30,
                  minHeight: 30,
                  width: 30,
                  minWidth: 30,
                  alignSelf: 'stretch',
                }}
              >
                <CheckIcon size='56%' />
              </ActionIcon>
            </div>
          </div>
        </Popover.Dropdown>
      </Popover>
    </MantineProvider>
  );
};
