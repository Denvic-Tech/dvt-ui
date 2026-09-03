import React from 'react';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import { ActionButton, SelectionActionBarContainer } from './styles.ts';

interface SelectionActionBarProps {
  count: number;
  copied: boolean;
  onCopy: () => void;
  onClear: () => void;
}

export const SelectionActionBar: React.FC<SelectionActionBarProps> = ({
  count,
  copied,
  onCopy,
  onClear,
}) => (
  <SelectionActionBarContainer>
    <span
      style={{
        color: copied ? '#16a34a' : '#374151',
        fontWeight: 500,
        transition: 'color 200ms ease',
      }}
    >
      {copied ? 'Copied!' : `${count} ${count === 1 ? 'row' : 'rows'} selected`}
    </span>
    <ActionButton onClick={onCopy} title='Copy selected logs' type='button'>
      {copied ? (
        <CheckIcon style={{ color: '#16a34a' }} />
      ) : (
        <ContentCopyIcon />
      )}
    </ActionButton>
    <ActionButton onClick={onClear} title='Clear selection' type='button'>
      <CloseIcon />
    </ActionButton>
  </SelectionActionBarContainer>
);
