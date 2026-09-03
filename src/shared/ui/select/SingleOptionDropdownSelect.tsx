import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import {
  alpha,
  Box,
  Divider,
  InputBase,
  Paper,
  Popper,
  Typography,
} from '@mui/material';
import { type SxProps, type Theme } from '@mui/material/styles';

import { mergeSx } from '@/shared/ui/primitives/components/control-styles';
import { getRadius } from '@/shared/ui/primitives/components/theme-style-helpers';

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

export type SingleOptionDropdownOption = {
  value: string;
  label?: string;
  searchText?: string;
};

export type SingleOptionDropdownSelectProps = {
  ariaLabel?: string;
  value: string;
  onChange: (value: string) => void;
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

export function SingleOptionDropdownSelect({
  ariaLabel,
  value,
  onChange,
  options,
  loading = false,
  disabled = false,
  error = false,
  placeholder,
  noOptionText,
  searchable = false,
  sx,
  textFieldSx,
  optionTextSx,
  popperMinWidth = 280,
}: SingleOptionDropdownSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const popperRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const selectedOption = useMemo(() => {
    return options.find(option => option.value === value) ?? null;
  }, [options, value]);

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
    if (!open) {
      setSearchQuery('');
    }
  }, [open]);

  const triggerSx: SxProps<Theme> = (theme: Theme) => ({
    width: '100%',
    minHeight: 40,
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    px: 1.25,
    pr: 1.5,
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
    color: 'text.primary',
    textAlign: 'left',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'background-color 150ms ease, border-color 150ms ease',
    '&:hover': {
      borderColor: disabled
        ? error
          ? theme.palette.error.main
          : theme.palette.divider
        : alpha(theme.palette.primary.main, 0.34),
    },
  });

  const closeDropdown = useCallback(() => {
    setOpen(false);
    setSearchQuery('');
  }, []);

  return (
    <Box ref={rootRef} sx={mergeSx({ minWidth: 150, width: '100%' }, sx)}>
      <Box
        ref={triggerRef}
        component='button'
        type='button'
        aria-label={ariaLabel}
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
          <Typography
            sx={{
              display: 'block',
              width: '100%',
              color: selectedOption ? 'text.primary' : 'text.secondary',
              opacity: selectedOption ? 1 : 0.72,
              fontSize: 13,
              textAlign: 'left',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {selectedOption?.label ??
              selectedOption?.value ??
              placeholder ??
              'Выберите значение...'}
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            color: 'text.secondary',
            flexShrink: 0,
          }}
        >
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
            </>
          ) : null}

          <Box sx={{ maxHeight: 320, overflowY: 'auto', p: 0.75 }}>
            {loading ? (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  py: 3,
                  color: 'text.secondary',
                }}
              >
                <Typography sx={{ fontSize: 13 }}>Загрузка...</Typography>
              </Box>
            ) : filteredOptions.length > 0 ? (
              filteredOptions.map(option => {
                const isSelected = option.value === value;

                return (
                  <Box
                    key={option.value}
                    component='button'
                    type='button'
                    onClick={() => {
                      onChange(option.value);
                      closeDropdown();
                    }}
                    sx={theme => ({
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                      px: 1.25,
                      py: 0.875,
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
                      transition: 'background-color 150ms ease',
                      '&:hover': {
                        bgcolor: isSelected
                          ? alpha(theme.palette.primary.main, 0.14)
                          : alpha(theme.palette.text.primary, 0.05),
                      },
                      '&:last-child': {
                        mb: 0,
                      },
                    })}
                  >
                    <Typography
                      sx={mergeSx(
                        {
                          minWidth: 0,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontSize: 13,
                          fontWeight: isSelected ? 600 : 500,
                          fontFamily:
                            '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
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

export default SingleOptionDropdownSelect;
