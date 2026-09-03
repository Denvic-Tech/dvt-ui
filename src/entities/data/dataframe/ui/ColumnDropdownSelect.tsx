import {
  memo,
  useCallback,
  useDeferredValue,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import {
  alpha,
  Box,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  InputBase,
  Paper,
  Popper,
  Typography,
} from '@mui/material';
import { type SxProps, type Theme } from '@mui/material/styles';
import type * as React from 'react';
import { Virtuoso } from 'react-virtuoso';

import type { Column } from '@/shared/gatewayClient';
import { mergeSx } from '@/shared/ui/primitives/components/control-styles';
import { getRadius } from '@/shared/ui/primitives/components/theme-style-helpers';

import { ColumnOptionRow } from './ColumnOptionRow';

const TAG_START_PADDING = 12;
const TAG_GAP_PX = 4;
const OVERFLOW_TAG_WIDTH = 36;
const DROPDOWN_MAX_HEIGHT = 320;
const DROPDOWN_VIRTUALIZATION_THRESHOLD = 80;
const DROPDOWN_OVERSCAN_PX = 160;

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

type BaseProps = {
  columns: Column[];
  loading?: boolean;
  disabled?: boolean;
  error?: boolean;
  placeholder?: string;
  noOptionText?: string;
  allowNew?: boolean;
  sx?: SxProps<Theme>;
  textFieldSx?: SxProps<Theme>;
  testIds?: {
    root?: string;
    trigger?: string;
    searchInput?: string;
    option?: string;
    clearButton?: string;
  };
};

type SingleProps = BaseProps & {
  multiple?: false;
  value: string;
  onChange: (value: string) => void;
};

type MultipleProps = BaseProps & {
  multiple: true;
  value: string[];
  onChange: (value: string[]) => void;
};

export type ColumnDropdownSelectProps = SingleProps | MultipleProps;

type ColumnDropdownOptionProps = {
  column: Column;
  multiple: boolean;
  selected: boolean;
  onSelect: (columnName: string) => void;
  testId?: string | undefined;
};

const ColumnDropdownOption = memo(
  ({
    column,
    multiple,
    selected,
    onSelect,
    testId,
  }: ColumnDropdownOptionProps) => {
    const handleClick = useCallback(() => {
      onSelect(column.name);
    }, [column.name, onSelect]);

    return (
      <Box
        component='button'
        type='button'
        role='option'
        data-testid={testId ?? 'entities/data/dataframe/column-option'}
        data-column-name={column.name}
        data-column-type={
          Array.isArray(column.dtype)
            ? column.dtype.join(',')
            : String(column.dtype ?? '')
        }
        aria-selected={selected}
        onClick={handleClick}
        sx={theme => ({
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          px: 1,
          py: 0.625,
          mb: 0.25,
          border: 'none',
          borderRadius: '8px',
          bgcolor: selected
            ? alpha(theme.palette.primary.main, 0.1)
            : 'transparent',
          cursor: 'pointer',
          font: 'inherit',
          textAlign: 'left',
          transition: 'background-color 150ms ease',
          '&:hover': {
            bgcolor: selected
              ? alpha(theme.palette.primary.main, 0.14)
              : alpha(theme.palette.text.primary, 0.05),
          },
          '&:last-child': {
            mb: 0,
          },
        })}
      >
        <ColumnOptionRow
          column={column}
          checkbox={multiple}
          selected={selected}
        />
      </Box>
    );
  }
);

ColumnDropdownOption.displayName = 'ColumnDropdownOption';

export function ColumnDropdownSelect(props: ColumnDropdownSelectProps) {
  const {
    value,
    onChange,
    columns,
    multiple = false,
    loading = false,
    disabled = false,
    error = false,
    placeholder,
    noOptionText,
    sx,
    textFieldSx,
    testIds,
  } = props;

  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const popperRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const tagsMeasureRef = useRef<HTMLDivElement | null>(null);
  const triggerControlsRef = useRef<HTMLDivElement | null>(null);
  const [visibleTagCount, setVisibleTagCount] = useState<number | null>(null);
  const listboxId = useId();

  const selectedValues = multiple ? (Array.isArray(value) ? value : []) : [];
  const selectedValueSet = useMemo(() => {
    return new Set(selectedValues);
  }, [selectedValues]);
  const singleValue = !multiple && typeof value === 'string' ? value : '';
  const hasSelection = multiple
    ? selectedValues.length > 0
    : singleValue.trim() !== '';
  const searchableColumns = useMemo(() => {
    return columns.map(column => ({
      column,
      searchText: `${column.name.toLowerCase()} ${String(
        column.dtype ?? ''
      ).toLowerCase()}`,
    }));
  }, [columns]);
  const filteredColumns = useMemo(() => {
    const query = deferredSearchQuery.trim().toLowerCase();
    if (!query) {
      return columns;
    }

    return searchableColumns
      .filter(({ searchText }) => searchText.includes(query))
      .map(({ column }) => column);
  }, [columns, deferredSearchQuery, searchableColumns]);
  const shouldVirtualize =
    filteredColumns.length >= DROPDOWN_VIRTUALIZATION_THRESHOLD;

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

      setOpen(false);
      setSearchQuery('');
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return;
      }

      setOpen(false);
      setSearchQuery('');
      triggerRef.current?.focus();
    };

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleEscape);

    return () => {
      cancelAnimationFrame(focusFrame);
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  useLayoutEffect(() => {
    if (!multiple) {
      return;
    }

    const measureVisibleTags = () => {
      const triggerWidth = triggerRef.current?.offsetWidth ?? 0;
      const measureRoot = tagsMeasureRef.current;

      if (!triggerWidth || !measureRoot || selectedValues.length === 0) {
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

      if (!availableWidth) {
        setVisibleTagCount(1);
        return;
      }

      const tagWidths = Array.from(measureRoot.children).map(child => {
        return (child as HTMLElement).offsetWidth;
      });

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

    const resizeObserver = new ResizeObserver(() => {
      measureVisibleTags();
    });

    resizeObserver.observe(triggerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [hasSelection, multiple, selectedValues]);

  const openDropdown = useCallback(() => {
    if (disabled) {
      return;
    }
    setOpen(true);
  }, [disabled]);

  const closeDropdown = useCallback(() => {
    setOpen(false);
    setSearchQuery('');
  }, []);

  const clearSelection = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();

      if (multiple) {
        (onChange as (value: string[]) => void)([]);
        return;
      }

      (onChange as (value: string) => void)('');
    },
    [multiple, onChange]
  );

  const handleSelect = useCallback(
    (columnName: string) => {
      if (multiple) {
        const nextValue = selectedValueSet.has(columnName)
          ? selectedValues.filter(valueItem => valueItem !== columnName)
          : [...selectedValues, columnName];
        (onChange as (value: string[]) => void)(nextValue);
        return;
      }

      (onChange as (value: string) => void)(columnName);
      closeDropdown();
    },
    [closeDropdown, multiple, onChange, selectedValueSet, selectedValues]
  );

  const removeTag = useCallback(
    (columnName: string, event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      (onChange as (value: string[]) => void)(
        selectedValues.filter(valueItem => valueItem !== columnName)
      );
    },
    [onChange, selectedValues]
  );

  const renderMultipleValue = () => {
    if (selectedValues.length === 0) {
      return (
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
          {placeholder ?? 'Выберите колонки...'}
        </Typography>
      );
    }

    const resolvedVisibleTagCount =
      visibleTagCount == null
        ? selectedValues.length
        : Math.min(visibleTagCount, selectedValues.length);
    const visibleTags = selectedValues.slice(0, resolvedVisibleTagCount);
    const hiddenCount = selectedValues.length - visibleTags.length;

    return (
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
          {visibleTags.map((columnName, index) => (
            <Chip
              key={columnName}
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
                    sx={{
                      fontWeight: 500,
                      opacity: 0.8,
                    }}
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
                    {columnName}
                  </Box>
                </Box>
              }
              size='small'
              onDelete={event => removeTag(columnName, event)}
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
                  '&:hover': {
                    color: theme.palette.primary.main,
                  },
                },
              })}
            />
          ))}

          {hiddenCount > 0 ? (
            <Chip
              label={`+${hiddenCount}`}
              size='small'
              sx={theme => ({
                height: 24,
                borderRadius: getRadius(theme, -8),
                bgcolor: alpha(theme.palette.text.secondary, 0.1),
                color: 'text.secondary',
                fontSize: 12,
                fontWeight: 600,
                flexShrink: 0,
                '& .MuiChip-label': {
                  px: 0.75,
                },
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
          {selectedValues.map((columnName, index) => (
            <Chip
              key={`measure-${columnName}`}
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
                    sx={{
                      fontWeight: 500,
                      opacity: 0.8,
                    }}
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
                    }}
                  >
                    {columnName}
                  </Box>
                </Box>
              }
              size='small'
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
                  mr: 0.5,
                  ml: -0.25,
                },
              })}
            />
          ))}
        </Box>
      </>
    );
  };

  const renderSingleValue = () => {
    if (!singleValue.trim()) {
      return (
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
          {placeholder ?? 'Выберите колонку...'}
        </Typography>
      );
    }

    return (
      <Typography
        sx={{
          display: 'block',
          width: '100%',
          color: 'text.primary',
          fontSize: 13,
          textAlign: 'left',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {singleValue}
      </Typography>
    );
  };

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

  const renderOption = useCallback(
    (column: Column) => {
      const isSelected = multiple
        ? selectedValueSet.has(column.name)
        : singleValue === column.name;

      return (
        <ColumnDropdownOption
          key={column.name}
          column={column}
          multiple={multiple}
          selected={isSelected}
          testId={testIds?.option}
          onSelect={handleSelect}
        />
      );
    },
    [handleSelect, multiple, selectedValueSet, singleValue, testIds?.option]
  );

  return (
    <Box
      ref={rootRef}
      data-testid={testIds?.root ?? 'entities/data/dataframe/column-select'}
      sx={mergeSx({ minWidth: 150, width: '100%' }, sx)}
    >
      <Box
        ref={triggerRef}
        component='button'
        type='button'
        data-testid={
          testIds?.trigger ?? 'entities/data/dataframe/column-select-toggle'
        }
        role='combobox'
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-haspopup='listbox'
        disabled={disabled}
        onMouseDown={event => {
          event.preventDefault();
          if (open) {
            closeDropdown();
            return;
          }
          openDropdown();
        }}
        sx={mergeSx(triggerSx, textFieldSx)}
      >
        <Box sx={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          {multiple ? renderMultipleValue() : renderSingleValue()}
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
          {hasSelection ? (
            <IconButton
              aria-label='Clear'
              data-testid={
                testIds?.clearButton ??
                'entities/data/dataframe/column-select-clear-button'
              }
              size='small'
              onMouseDown={event => event.stopPropagation()}
              onClick={clearSelection}
              sx={{
                p: 0,
                color: 'text.secondary',
                '&:hover': {
                  bgcolor: 'transparent',
                },
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
          minWidth: 320,
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
              inputProps={{
                'data-testid':
                  testIds?.searchInput ??
                  'entities/data/dataframe/column-search-input',
              }}
              value={searchQuery}
              placeholder='Поиск колонки...'
              onChange={event => setSearchQuery(event.target.value)}
              onKeyDown={event => {
                event.stopPropagation();
              }}
              sx={{
                flex: 1,
                fontSize: 13,
              }}
            />
          </Box>

          <Divider />

          <Box
            id={listboxId}
            role='listbox'
            aria-multiselectable={multiple || undefined}
            sx={{
              maxHeight: DROPDOWN_MAX_HEIGHT,
              minHeight: loading ? 64 : undefined,
              overflow: 'hidden',
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
            ) : filteredColumns.length > 0 ? (
              shouldVirtualize ? (
                <Virtuoso
                  data={filteredColumns}
                  style={{ height: DROPDOWN_MAX_HEIGHT - 12 }}
                  overscan={DROPDOWN_OVERSCAN_PX}
                  increaseViewportBy={{
                    top: DROPDOWN_OVERSCAN_PX,
                    bottom: DROPDOWN_OVERSCAN_PX * 2,
                  }}
                  computeItemKey={(_, column) => column.name}
                  itemContent={(_, column) => renderOption(column)}
                />
              ) : (
                <Box
                  sx={{
                    maxHeight: DROPDOWN_MAX_HEIGHT - 12,
                    overflowY: 'auto',
                  }}
                >
                  {filteredColumns.map(renderOption)}
                </Box>
              )
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  py: 3,
                  color: 'text.secondary',
                }}
              >
                <Typography sx={{ fontSize: 13 }}>
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

export default ColumnDropdownSelect;
