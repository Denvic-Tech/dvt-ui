import Box from '@mui/material/Box';
import ListItemIcon from '@mui/material/ListItemIcon';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import { type SxProps, type Theme } from '@mui/material/styles';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { Button } from './button.tsx';
import { mergeSx } from './control-styles.ts';
import { Input } from './input.tsx';
import { Popover } from './popover.tsx';
import {
  getControlHeight,
  getRadius,
} from './theme-style-helpers.ts';

export interface ComboboxOption {
  description?: string;
  disabled?: boolean;
  icon?: ReactNode;
  keywords?: string[];
  label: string;
  value: string;
}

export interface ComboboxProps {
  emptyText?: string;
  multiple?: boolean;
  onValueChange: (value: string | string[]) => void;
  options: ComboboxOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  sx?: SxProps<Theme>;
  value: string | string[] | null | undefined;
}

const normalize = (value: string | string[] | null | undefined): string[] =>
  Array.isArray(value) ? value : value ? [value] : [];

export const Combobox = ({
  emptyText = 'Nothing found.',
  multiple = false,
  onValueChange,
  options,
  placeholder = 'Select option',
  searchPlaceholder = 'Search...',
  sx,
  value,
}: ComboboxProps) => {
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!open) {
      setQuery('');
    }
  }, [open]);

  const selectedValues = normalize(value);
  const selectedOptions = useMemo(
    () =>
      options.filter(option =>
        selectedValues.some(selectedValue => selectedValue === option.value)
      ),
    [options, selectedValues]
  );

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return options;
    }

    return options.filter(option => {
      const haystack = [
        option.label,
        option.value,
        option.description,
        ...(option.keywords ?? []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [options, query]);

  const buttonLabel = multiple
    ? selectedOptions.length > 0
      ? selectedOptions.map(option => option.label).join(', ')
      : placeholder
    : (selectedOptions[0]?.label ?? placeholder);

  const handleSelect = (nextValue: string) => {
    if (multiple) {
      const next = selectedValues.includes(nextValue)
        ? selectedValues.filter(valueItem => valueItem !== nextValue)
        : [...selectedValues, nextValue];
      onValueChange(next);
      return;
    }

    onValueChange(nextValue);
    setOpen(false);
  };

  return (
    <>
      <Button
        ref={triggerRef}
        aria-expanded={open}
        sx={mergeSx(
          {
            alignItems: 'center',
            gap: 1,
            justifyContent: 'space-between',
            minHeight: getControlHeight(),
            px: 1.75,
            width: '100%',
          },
          sx
        )}
        variant='outline'
        onClick={() => setOpen(current => !current)}
      >
        <Typography
          component='span'
          sx={{
            flex: 1,
            minWidth: 0,
            overflow: 'hidden',
            textAlign: 'left',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {buttonLabel}
        </Typography>
        <ChevronsUpDown size={16} />
      </Button>
      <Popover
        anchorEl={triggerRef.current}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
        contentSx={{ p: 2, width: triggerRef.current?.offsetWidth ?? 320 }}
        open={open}
        paperSx={{ mt: 0.75 }}
        transformOrigin={{ horizontal: 'left', vertical: 'top' }}
        onClose={() => setOpen(false)}
      >
        <Box sx={{ display: 'grid', gap: 2 }}>
          <Input
            autoFocus
            placeholder={searchPlaceholder}
            startAdornment={<Search size={16} />}
            value={query}
            onChange={event => setQuery(event.target.value)}
          />
          <Box sx={{ maxHeight: 256, overflowY: 'auto' }}>
            {filteredOptions.length === 0 ? (
              <Typography color='text.secondary' sx={{ px: 1, py: 1.5 }}>
                {emptyText}
              </Typography>
            ) : (
              filteredOptions.map(option => {
                const selected = selectedValues.includes(option.value);

                return (
                  <MenuItem
                    key={option.value}
                    selected={selected}
                    sx={theme => ({
                      alignItems: 'flex-start',
                      borderRadius: getRadius(theme, 2),
                      gap: 1,
                      py: 1.25,
                    })}
                    {...(option.disabled ? { disabled: true } : {})}
                    onClick={() => handleSelect(option.value)}
                  >
                    <ListItemIcon sx={{ minWidth: 24, mt: 0.25 }}>
                      {selected ? (
                        <Check size={16} />
                      ) : option.icon ? (
                        option.icon
                      ) : null}
                    </ListItemIcon>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontSize: 14 }}>{option.label}</Typography>
                      {option.description ? (
                        <Typography
                          color='text.secondary'
                          sx={{ fontSize: 12, lineHeight: 1.5 }}
                        >
                          {option.description}
                        </Typography>
                      ) : null}
                    </Box>
                  </MenuItem>
                );
              })
            )}
          </Box>
        </Box>
      </Popover>
    </>
  );
};
