import React, { memo, useCallback } from 'react';
import {
  Box,
  IconButton,
  InputAdornment,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';

import SearchIcon from '@mui/icons-material/Search';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import CloseIcon from '@mui/icons-material/Close';

export interface GraphNodeSearchPanelProps {
  open: boolean;
  query: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  matchesCount: number;
  activeIndex: number;
  onQueryChange: (value: string) => void;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
}

const GraphNodeSearchPanel_: React.FC<GraphNodeSearchPanelProps> = ({
  open,
  query,
  inputRef,
  matchesCount,
  activeIndex,
  onQueryChange,
  onPrev,
  onNext,
  onClose,
}) => {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        if (e.shiftKey) {
          onPrev();
        } else {
          onNext();
        }
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        onPrev();
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        onNext();
      }
    },
    [onClose, onNext, onPrev]
  );

  if (!open) return null;

  const hasMatches = matchesCount > 0;
  const canNavigate = matchesCount > 1;
  const counterLabel = hasMatches ? `${activeIndex + 1}/${matchesCount}` : '0';

  return (
    <Paper
      elevation={0}
      sx={theme => ({
        position: 'absolute',
        top: 12,
        right: 12,
        zIndex: theme.zIndex.modal,
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        px: 1,
        py: 0.75,
        borderRadius: theme.shape.borderRadius,
        backgroundColor: alpha(theme.palette.background.paper, 0.78),
        backdropFilter: 'blur(10px)',
        boxShadow:
          '0 2px 8px rgba(15, 23, 42, 0.08)',
      })}
    >
      <TextField
        value={query}
        onChange={e => onQueryChange(e.target.value)}
        placeholder='Поиск по имени или ID'
        size='small'
        variant='standard'
        inputRef={inputRef}
        onKeyDown={handleKeyDown}
        sx={theme => ({
          width: { xs: 240, sm: 300 },
          pt: 0.3,
          pb: 0.1,
          pl: 0.5,
          pr: 0.5,
          '& .MuiOutlinedInput-root': {
            borderRadius: theme.shape.borderRadius,
            borderColor: theme.palette.background.paper,
            bgcolor: 'transparent',
          },
        })}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position='start'>
                <SearchIcon fontSize='small' />
              </InputAdornment>
            ),
            endAdornment: (
              <Typography variant='caption' sx={{ pt: 0.3 }} fontSize={16}>
                {counterLabel}
              </Typography>
            ),
            disableUnderline: true,
          },
        }}
      />

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
        <IconButton
          size='small'
          onClick={onPrev}
          disabled={!canNavigate}
          aria-label='previous match'
        >
          <KeyboardArrowUpIcon fontSize='small' />
        </IconButton>
        <IconButton
          size='small'
          onClick={onNext}
          disabled={!canNavigate}
          aria-label='next match'
        >
          <KeyboardArrowDownIcon fontSize='small' />
        </IconButton>

        <IconButton size='small' onClick={onClose} aria-label='close search'>
          <CloseIcon fontSize='small' />
        </IconButton>
      </Box>
    </Paper>
  );
};

export const GraphNodeSearchPanel = memo(GraphNodeSearchPanel_);
