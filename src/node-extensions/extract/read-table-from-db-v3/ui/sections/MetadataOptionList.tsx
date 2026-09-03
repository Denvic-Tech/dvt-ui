import React, { useMemo, useState } from 'react';
import SearchIcon from '@mui/icons-material/Search';
import { alpha, Box, styled, Typography } from '@mui/material';

import type { MetadataOption } from '../../lib/helpers';

type MetadataOptionListProps = {
  emptyText: string;
  options: MetadataOption[];
  searchPlaceholder: string;
  selectedValue?: string | null | undefined;
  onSelect: (value: string) => void;
};

const SearchBox = styled(Box)(({ theme }) => ({
  position: 'relative',
  marginBottom: 12,
  '& svg': {
    position: 'absolute',
    left: 10,
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: 18,
    color: theme.palette.text.secondary,
  },
}));

const SearchInput = styled('input')(({ theme }) => ({
  width: '100%',
  padding: '8px 12px 8px 36px',
  borderRadius: 8,
  border: `1px solid ${theme.palette.divider}`,
  outline: 'none',
  fontSize: '0.8125rem',
  color: theme.palette.text.primary,
  backgroundColor: theme.palette.background.paper,
  '&:focus': {
    borderColor: theme.palette.primary.main,
    boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.1)}`,
  },
}));

const ListContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  maxHeight: 320,
  overflow: 'auto',
  paddingRight: 4,
  '&::-webkit-scrollbar': {
    width: 8,
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: alpha(theme.palette.text.secondary, 0.18),
    borderRadius: 999,
  },
}));

const ListButton = styled('button', {
  shouldForwardProp: prop => prop !== 'selected',
})<{ selected?: boolean }>(({ theme, selected }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: `1px solid ${
    selected ? theme.palette.primary.main : theme.palette.divider
  }`,
  cursor: 'pointer',
  backgroundColor: selected
    ? alpha(theme.palette.primary.main, 0.08)
    : theme.palette.background.paper,
  color: selected ? theme.palette.primary.main : theme.palette.text.primary,
  font: 'inherit',
  textAlign: 'left',
  transition: 'all 0.15s ease',
  '&:hover': {
    borderColor: selected
      ? theme.palette.primary.main
      : theme.palette.grey[400],
    backgroundColor: selected
      ? alpha(theme.palette.primary.main, 0.12)
      : alpha(theme.palette.grey[50], 0.9),
  },
}));

const CountChip = styled('span')(({ theme }) => ({
  padding: '2px 8px',
  borderRadius: 999,
  backgroundColor: alpha(theme.palette.text.secondary, 0.08),
  color: theme.palette.text.secondary,
  fontSize: '0.75rem',
  fontWeight: 500,
  flexShrink: 0,
}));

const EmptyState = styled(Box)(({ theme }) => ({
  padding: 24,
  borderRadius: 8,
  border: `1px dashed ${theme.palette.divider}`,
  textAlign: 'center',
  color: theme.palette.text.secondary,
}));

export const MetadataOptionList: React.FC<MetadataOptionListProps> = ({
  emptyText,
  options,
  searchPlaceholder,
  selectedValue,
  onSelect,
}) => {
  const [query, setQuery] = useState('');

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return options;
    }

    return options.filter(option =>
      option.label.toLowerCase().includes(normalizedQuery)
    );
  }, [options, query]);

  return (
    <Box>
      <SearchBox>
        <SearchIcon />
        <SearchInput
          type='text'
          placeholder={searchPlaceholder}
          value={query}
          onChange={event => setQuery(event.target.value)}
        />
      </SearchBox>

      {filteredOptions.length === 0 ? (
        <EmptyState>
          <Typography sx={{ fontSize: '0.8125rem' }}>{emptyText}</Typography>
        </EmptyState>
      ) : (
        <ListContainer>
          {filteredOptions.map(option => (
            <ListButton
              key={option.value}
              type='button'
              selected={option.value === selectedValue}
              onClick={() => onSelect(option.value)}
            >
              <Typography
                sx={{
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontSize: '0.8125rem',
                  fontWeight: option.value === selectedValue ? 600 : 500,
                }}
              >
                {option.label}
              </Typography>
              <CountChip>{option.tableCount}</CountChip>
            </ListButton>
          ))}
        </ListContainer>
      )}
    </Box>
  );
};
