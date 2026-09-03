import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import {
  alpha,
  Box,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  InputBase,
  Paper,
  Popper,
  Stack,
  Typography,
} from '@mui/material';
import { type SxProps, type Theme } from '@mui/material/styles';

import { mergeSx } from '@/shared/ui/primitives/components/control-styles';
import { getRadius } from '@/shared/ui/primitives/components/theme-style-helpers';

import type { SingleOptionDropdownOption } from './SingleOptionDropdownSelect';

const TAG_START_PADDING = 12;
const TAG_GAP_PX = 4;
const OVERFLOW_TAG_WIDTH = 36;
const DROPDOWN_MAX_HEIGHT = 320;

const ChevronDownIcon = ({ open }: { open: boolean }) => (
  <svg
    width='16'
    height='16'
    viewBox='0 0 16 16'
    fill='none'
    style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
  >
    <path
      d='M4 6l4 4 4-4'
      stroke='currentColor'
      strokeWidth='1.6'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

export type MultiOptionDropdownSelectProps = {
  ariaLabel?: string;
  value: string[];
  onChange: (value: string[]) => void;
  options: SingleOptionDropdownOption[];
  loading?: boolean;
  disabled?: boolean;
  error?: boolean;
  placeholder?: string;
  noOptionText?: string;
  searchable?: boolean;
  sx?: SxProps<Theme>;
  textFieldSx?: SxProps<Theme>;
  optionTextSx?: SxProps<Theme>;
  popperMinWidth?: number;
};

export function MultiOptionDropdownSelect({
  ariaLabel,
  value,
  onChange,
  options,
  loading = false,
  disabled = false,
  error = false,
  placeholder,
  noOptionText,
  searchable = true,
  sx,
  textFieldSx,
  optionTextSx,
  popperMinWidth = 320,
}: MultiOptionDropdownSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const popperRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const tagsMeasureRef = useRef<HTMLDivElement | null>(null);
  const triggerControlsRef = useRef<HTMLDivElement | null>(null);
  const [visibleTagCount, setVisibleTagCount] = useState<number | null>(null);

  const selectedValueSet = useMemo(() => new Set(value), [value]);
  const optionByValue = useMemo(
    () => new Map(options.map(option => [option.value, option])),
    [options]
  );
  const filteredOptions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return options;
    }

    return options.filter(option => {
      const label = (option.label ?? option.value).toLowerCase();
      const meta = (option.searchText ?? option.value).toLowerCase();
      return label.includes(query) || meta.includes(query);
    });
  }, [options, searchQuery]);

  const closeDropdown = useCallback(() => {
    setOpen(false);
    setSearchQuery('');
  }, []);

  useLayoutEffect(() => {
    const measureVisibleTags = () => {
      const triggerWidth = triggerRef.current?.offsetWidth ?? 0;
      const measureRoot = tagsMeasureRef.current;

      if (!triggerWidth || !measureRoot || value.length === 0) {
        setVisibleTagCount(null);
        return;
      }

      const availableWidth = Math.max(
        triggerWidth -
          TAG_START_PADDING -
          (triggerControlsRef.current?.offsetWidth ?? 24) -
          12,
        0
      );
      const tagWidths = Array.from(measureRoot.children).map(
        child => (child as HTMLElement).offsetWidth
      );

      let usedWidth = 0;
      let nextVisibleCount = 0;

      for (let index = 0; index < tagWidths.length; index += 1) {
        const remainingCount = tagWidths.length - (index + 1);
        const nextTagWidth =
          tagWidths[index] + (nextVisibleCount > 0 ? TAG_GAP_PX : 0);
        const overflowWidth =
          remainingCount > 0 ? OVERFLOW_TAG_WIDTH + TAG_GAP_PX : 0;

        if (usedWidth + nextTagWidth + overflowWidth > availableWidth) {
          break;
        }

        usedWidth += nextTagWidth;
        nextVisibleCount += 1;
      }

      setVisibleTagCount(nextVisibleCount > 0 ? nextVisibleCount : 1);
    };

    measureVisibleTags();

    if (typeof ResizeObserver === 'undefined' || !triggerRef.current) {
      return;
    }

    const resizeObserver = new ResizeObserver(measureVisibleTags);
    resizeObserver.observe(triggerRef.current);

    return () => resizeObserver.disconnect();
  }, [optionByValue, value]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const focusFrame = requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (
        target &&
        (rootRef.current?.contains(target) ||
          popperRef.current?.contains(target))
      ) {
        return;
      }

      closeDropdown();
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return;
      }

      closeDropdown();
      triggerRef.current?.focus();
    };

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleEscape);

    return () => {
      cancelAnimationFrame(focusFrame);
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [closeDropdown, open]);

  const toggleValue = useCallback(
    (optionValue: string) => {
      onChange(
        selectedValueSet.has(optionValue)
          ? value.filter(currentValue => currentValue !== optionValue)
          : [...value, optionValue]
      );
    },
    [onChange, selectedValueSet, value]
  );

  const clearSelection = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      onChange([]);
    },
    [onChange]
  );

  const triggerSx: SxProps<Theme> = (theme: Theme) => ({
    width: '100%',
    minHeight: 40,
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    px: 1.25,
    pr: 1.75,
    border: `1px solid ${
      error ? theme.palette.error.main : theme.palette.divider
    }`,
    borderColor: open
      ? error
        ? theme.palette.error.main
        : theme.palette.primary.main
      : error
        ? theme.palette.error.main
        : theme.palette.divider,
    borderRadius: getRadius(theme, -8),
    bgcolor: alpha(
      theme.palette.background.paper,
      theme.palette.mode === 'light' ? 0.94 : 0.72
    ),
    boxShadow: 'none',
    color: 'text.primary',
    textAlign: 'left',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition:
      'background-color 150ms ease, border-color 150ms ease, box-shadow 150ms ease',
    '&:hover': {
      borderColor: disabled
        ? error
          ? theme.palette.error.main
          : theme.palette.divider
        : alpha(theme.palette.primary.main, 0.34),
    },
  });

  return (
    <Box ref={rootRef} sx={mergeSx({ minWidth: 150, width: '100%' }, sx)}>
      <Box
        ref={triggerRef}
        component='button'
        type='button'
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup='listbox'
        disabled={disabled}
        onMouseDown={event => {
          event.preventDefault();
          if (open) {
            closeDropdown();
            return;
          }
          setOpen(true);
        }}
        sx={mergeSx(triggerSx, textFieldSx)}
      >
        <Box sx={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          {value.length > 0 ? (
            <>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  minWidth: 0,
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                }}
              >
                {value
                  .slice(
                    0,
                    visibleTagCount == null
                      ? value.length
                      : Math.min(visibleTagCount, value.length)
                  )
                  .map((selectedValue, index) => (
                    <Chip
                      key={selectedValue}
                      label={
                        <Box
                          component='span'
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 0.625,
                            maxWidth: '100%',
                            minWidth: 0,
                          }}
                        >
                          <Box
                            component='span'
                            sx={{ fontWeight: 500, opacity: 0.8 }}
                          >
                            {index + 1}
                          </Box>
                          <Box
                            component='span'
                            sx={{
                              display: 'block',
                              flex: 1,
                              minWidth: 0,
                              maxWidth: '100%',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {optionByValue.get(selectedValue)?.label ??
                              selectedValue}
                          </Box>
                        </Box>
                      }
                      size='small'
                      onDelete={event => {
                        event.stopPropagation();
                        toggleValue(selectedValue);
                      }}
                      onMouseDown={event => event.stopPropagation()}
                      deleteIcon={<CloseRoundedIcon sx={{ fontSize: 14 }} />}
                      sx={theme => ({
                        maxWidth: 150,
                        height: 24,
                        borderRadius: '5px',
                        bgcolor: alpha(theme.palette.primary.main, 0.12),
                        color: theme.palette.primary.main,
                        fontSize: 12,
                        fontWeight: 600,
                        flexShrink: 0,
                        '& .MuiChip-label': {
                          display: 'block',
                          maxWidth: '100%',
                          px: 0.75,
                          overflow: 'hidden',
                        },
                        '& .MuiChip-deleteIcon': {
                          color: alpha(theme.palette.primary.main, 0.72),
                          mr: 0.5,
                          ml: -0.25,
                          '&:hover': { color: theme.palette.primary.main },
                        },
                      })}
                    />
                  ))}

                {visibleTagCount != null && value.length > visibleTagCount ? (
                  <Chip
                    label={`+${value.length - visibleTagCount}`}
                    size='small'
                    sx={theme => ({
                      height: 24,
                      borderRadius: getRadius(theme, -8),
                      bgcolor: alpha(theme.palette.text.secondary, 0.1),
                      color: 'text.secondary',
                      fontSize: 12,
                      fontWeight: 600,
                      flexShrink: 0,
                      '& .MuiChip-label': { px: 0.75 },
                    })}
                  />
                ) : null}
              </Box>

              <Box
                ref={tagsMeasureRef}
                aria-hidden
                sx={{
                  position: 'absolute',
                  visibility: 'hidden',
                  pointerEvents: 'none',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: `${TAG_GAP_PX}px`,
                  height: 0,
                  overflow: 'hidden',
                }}
              >
                {value.map((selectedValue, index) => (
                  <Chip
                    key={`measure-${selectedValue}`}
                    label={`${index + 1}  ${
                      optionByValue.get(selectedValue)?.label ?? selectedValue
                    }`}
                    size='small'
                    deleteIcon={<CloseRoundedIcon sx={{ fontSize: 14 }} />}
                    sx={{
                      maxWidth: 150,
                      height: 24,
                      borderRadius: '5px',
                      fontSize: 12,
                      fontWeight: 600,
                      flexShrink: 0,
                      '& .MuiChip-label': { px: 0.75 },
                    }}
                  />
                ))}
              </Box>
            </>
          ) : (
            <Typography
              sx={{
                display: 'block',
                width: '100%',
                color: 'text.secondary',
                opacity: 0.72,
                fontSize: 13,
                textAlign: 'left',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {loading
                ? 'Загрузка...'
                : (placeholder ?? 'Выберите значения...')}
            </Typography>
          )}
        </Box>

        <Box
          ref={triggerControlsRef}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            color: 'text.secondary',
            flexShrink: 0,
          }}
        >
          {value.length > 0 ? (
            <IconButton
              aria-label='Очистить'
              size='small'
              onMouseDown={event => event.stopPropagation()}
              onClick={clearSelection}
              sx={{
                p: 0,
                color: 'text.secondary',
                '&:hover': { bgcolor: 'transparent' },
              }}
            >
              <CloseRoundedIcon sx={{ fontSize: 16 }} />
            </IconButton>
          ) : null}
          <ChevronDownIcon open={open} />
        </Box>
      </Box>

      <Popper
        open={open}
        anchorEl={triggerRef.current}
        placement='bottom-start'
        sx={{
          zIndex: theme => theme.zIndex.modal,
          width: triggerRef.current?.offsetWidth ?? undefined,
          minWidth: popperMinWidth,
        }}
      >
        <Paper
          ref={popperRef}
          elevation={0}
          sx={theme => ({
            mt: 0.75,
            overflow: 'hidden',
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: getRadius(theme, -4),
            boxShadow: 'none',
            backgroundImage: 'none',
          })}
        >
          {searchable ? (
            <>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 1.25,
                  py: 1,
                  bgcolor: 'background.paper',
                }}
              >
                <SearchRoundedIcon
                  sx={{ fontSize: 18, color: 'text.secondary', flexShrink: 0 }}
                />
                <InputBase
                  inputRef={searchInputRef}
                  value={searchQuery}
                  placeholder='Поиск...'
                  onChange={event => setSearchQuery(event.target.value)}
                  onKeyDown={event => event.stopPropagation()}
                  sx={{ flex: 1, fontSize: 13 }}
                />
              </Box>
              <Divider />
            </>
          ) : null}

          <Box
            role='listbox'
            aria-multiselectable='true'
            sx={{
              maxHeight: DROPDOWN_MAX_HEIGHT,
              minHeight: loading ? 64 : undefined,
              overflowY: 'auto',
              p: 0.75,
            }}
          >
            {loading ? (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  py: 3,
                }}
              >
                <CircularProgress size={20} />
              </Box>
            ) : filteredOptions.length > 0 ? (
              filteredOptions.map(option => {
                const isSelected = selectedValueSet.has(option.value);

                return (
                  <Box
                    key={option.value}
                    component='button'
                    type='button'
                    role='option'
                    aria-selected={isSelected}
                    onClick={() => toggleValue(option.value)}
                    sx={theme => ({
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.75,
                      px: 1,
                      py: 0.625,
                      mb: 0.25,
                      border: 'none',
                      borderRadius: '8px',
                      bgcolor: isSelected
                        ? alpha(theme.palette.primary.main, 0.1)
                        : 'transparent',
                      color: 'text.primary',
                      cursor: 'pointer',
                      font: 'inherit',
                      textAlign: 'left',
                      '&:hover': {
                        bgcolor: isSelected
                          ? alpha(theme.palette.primary.main, 0.14)
                          : alpha(theme.palette.text.primary, 0.05),
                      },
                      '&:last-child': { mb: 0 },
                    })}
                  >
                    <Checkbox
                      checked={isSelected}
                      size='small'
                      tabIndex={-1}
                      disableRipple
                      icon={
                        <Stack
                          sx={theme => ({
                            width: 16,
                            height: 16,
                            borderRadius: '5px',
                            border: `1px solid ${theme.palette.grey[400]}`,
                            bgcolor: theme.palette.background.paper,
                            boxShadow: 'none',
                          })}
                        />
                      }
                      checkedIcon={
                        <Stack
                          sx={theme => ({
                            width: 16,
                            height: 16,
                            borderRadius: '5px',
                            border: `1px solid ${theme.palette.primary.main}`,
                            bgcolor: theme.palette.primary.main,
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: 'none',
                          })}
                        >
                          <CheckRoundedIcon
                            sx={theme => ({
                              fontSize: 14,
                              color: theme.palette.common.white,
                            })}
                          />
                        </Stack>
                      }
                      sx={{
                        p: 0,
                        mr: 0.5,
                        boxShadow: 'none',
                        pointerEvents: 'none',
                        '&:hover': { bgcolor: 'transparent' },
                      }}
                    />
                    <Typography
                      sx={mergeSx(
                        {
                          flex: 1,
                          minWidth: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontFamily:
                            '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                          fontSize: '0.75rem',
                          fontWeight: 500,
                        },
                        optionTextSx
                      )}
                    >
                      {option.label ?? option.value}
                    </Typography>
                  </Box>
                );
              })
            ) : (
              <Box sx={{ py: 3, textAlign: 'center' }}>
                <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>
                  {noOptionText ?? 'Ничего не найдено'}
                </Typography>
              </Box>
            )}
          </Box>
        </Paper>
      </Popper>
    </Box>
  );
}

export default MultiOptionDropdownSelect;
