import * as React from 'react';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { Box, InputBase } from '@mui/material';

import { type ResourceSelection, toggleResourceItem } from '../lib/tokenForm';

const optionSx = {
  width: '100%',
  height: 34,
  display: 'flex',
  alignItems: 'center',
  gap: 1.25,
  px: 1.25,
  border: 'none',
  borderRadius: '7px',
  bgcolor: 'transparent',
  color: '#1B1F2A',
  fontFamily: 'inherit',
  fontSize: 14,
  textAlign: 'left',
  cursor: 'pointer',
  '&:hover': { bgcolor: '#F5F6FA' },
};

const messageSx = { p: 1.25, color: '#9AA0AD', fontSize: 13 };

const CheckMark = ({ checked }: { checked: boolean }) => (
  <Box
    component='span'
    sx={{
      width: 16,
      height: 16,
      flex: '0 0 16px',
      display: 'grid',
      placeItems: 'center',
      boxSizing: 'border-box',
      border: '1.5px solid',
      borderColor: checked ? '#5B5BEF' : '#C9CEDA',
      borderRadius: '4px',
      bgcolor: checked ? '#5B5BEF' : 'transparent',
      color: '#fff',
      transition: 'background-color 120ms ease, border-color 120ms ease',
    }}
  >
    {checked ? <CheckRoundedIcon sx={{ fontSize: 12 }} /> : null}
  </Box>
);

type TokenResourcePickerProps = {
  allLabel: string;
  searchPlaceholder: string;
  options: Array<{ value: string; label: string }>;
  loading: boolean;
  selection: ResourceSelection;
  onChange: (selection: ResourceSelection) => void;
};

export const TokenResourcePicker = ({
  allLabel,
  searchPlaceholder,
  options,
  loading,
  selection,
  onChange,
}: TokenResourcePickerProps) => {
  const [query, setQuery] = React.useState('');
  const isAll = selection.mode === 'all';
  const normalizedQuery = query.trim().toLowerCase();
  const visibleOptions = options.filter(option =>
    option.label.toLowerCase().includes(normalizedQuery)
  );
  const allIds = options.map(option => option.value);

  return (
    <>
      <Box
        component='label'
        sx={{
          height: 34,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 1.25,
          mb: 0.5,
          borderRadius: '8px',
          bgcolor: '#F5F6FA',
          color: '#8C93A3',
        }}
      >
        <SearchRoundedIcon sx={{ fontSize: 15 }} />
        <InputBase
          autoFocus
          value={query}
          placeholder={searchPlaceholder}
          inputProps={{ 'aria-label': searchPlaceholder }}
          onChange={event => setQuery(event.target.value)}
          sx={{
            flex: 1,
            minWidth: 0,
            color: '#1B1F2A',
            fontSize: 13,
            '& input': { p: 0 },
          }}
        />
      </Box>

      <Box
        component='button'
        type='button'
        role='checkbox'
        aria-checked={isAll}
        onClick={() => onChange({ mode: isAll ? 'selected' : 'all', ids: [] })}
        sx={{ ...optionSx, fontWeight: 500 }}
      >
        <CheckMark checked={isAll} />
        {allLabel}
      </Box>

      <Box sx={{ height: '1px', mx: 0.25, my: 0.5, bgcolor: '#EEF0F4' }} />

      <Box
        sx={{
          maxHeight: 204,
          overflowY: 'auto',
          scrollbarWidth: 'thin',
          scrollbarColor: '#D3D8E2 transparent',
        }}
      >
        {visibleOptions.map(option => {
          const checked = isAll || selection.ids.includes(option.value);

          return (
            <Box
              key={option.value}
              component='button'
              type='button'
              role='checkbox'
              aria-checked={checked}
              title={option.label}
              onClick={() =>
                onChange(toggleResourceItem(selection, option.value, allIds))
              }
              sx={optionSx}
            >
              <CheckMark checked={checked} />
              <Box
                component='span'
                sx={{
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {option.label}
              </Box>
            </Box>
          );
        })}
        {visibleOptions.length === 0 ? (
          <Box sx={messageSx}>
            {loading ? 'Загрузка…' : 'Ничего не найдено'}
          </Box>
        ) : null}
      </Box>
    </>
  );
};
