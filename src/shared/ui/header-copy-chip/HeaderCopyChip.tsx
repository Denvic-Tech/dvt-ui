import * as React from 'react';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import { ButtonBase, styled } from '@mui/material';

import { copyTextToClipboard } from '@/shared/lib/clipboard';

const MONO_FONT_FAMILY =
  '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

// How long the button shows the check after a copy.
const COPIED_FEEDBACK_MS = 1500;

const ChipRoot = styled('div')({
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  minWidth: 0,
  height: 30,
  paddingLeft: 12,
  paddingRight: 3,
  borderRadius: 8,
  backgroundColor: '#F5F6FA',
});

const ChipLabel = styled('span')({
  flexShrink: 0,
  fontSize: 13,
  color: '#6B7385',
  whiteSpace: 'nowrap',
});

const ChipValue = styled('span')({
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontFamily: MONO_FONT_FAMILY,
  fontSize: 12.5,
  color: '#3A4152',
});

const ChipCopyButton = styled(ButtonBase)({
  width: 24,
  height: 24,
  flex: '0 0 24px',
  borderRadius: 6,
  color: '#8C93A3',
  transition:
    'background-color 500ms ease, color 150ms ease, transform 200ms ease',
  '&:hover': { backgroundColor: '#EEF0F4', color: '#3A4152' },
  '&:active': {
    backgroundColor: '#DCDDFB',
    color: '#4343D6',
    transform: 'scale(0.9)',
    transition: 'background-color 0s, transform 50ms ease',
  },
  '&.Mui-focusVisible': { boxShadow: '0 0 0 2px #A5B4FC' },
});

const CopiedIcon = () => (
  <svg width='14' height='14' viewBox='0 0 16 16' fill='none' aria-hidden>
    <path
      d='M3.5 8.5l3 3 6-7'
      stroke='#1E9E63'
      strokeWidth='1.8'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

type HeaderCopyChipProps = {
  label: string;
  // The full value: copied and shown on hover.
  value: string;
  // A shorter form of the value to show in the chip.
  displayValue?: string | undefined;
  copyLabel: string;
  onCopyError?: (() => void) | undefined;
};

// «Label value [copy]» chip for the page header, e.g. the MCP server address.
export const HeaderCopyChip = ({
  label,
  value,
  displayValue,
  copyLabel,
  onCopyError,
}: HeaderCopyChipProps) => {
  const [copied, setCopied] = React.useState(false);
  const resetTimerRef = React.useRef<number | null>(null);

  React.useEffect(
    () => () => {
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current);
      }
    },
    []
  );

  const handleCopy = async () => {
    const result = await copyTextToClipboard(value);

    if (result !== 'copied') {
      onCopyError?.();
      return;
    }

    setCopied(true);
    if (resetTimerRef.current !== null) {
      window.clearTimeout(resetTimerRef.current);
    }
    resetTimerRef.current = window.setTimeout(() => {
      setCopied(false);
      resetTimerRef.current = null;
    }, COPIED_FEEDBACK_MS);
  };

  return (
    <ChipRoot>
      <ChipLabel>{label}</ChipLabel>
      <ChipValue title={value}>{displayValue ?? value}</ChipValue>
      <ChipCopyButton
        disableRipple
        aria-label={copyLabel}
        title={copyLabel}
        onClick={() => void handleCopy()}
      >
        {copied ? (
          <CopiedIcon />
        ) : (
          <ContentCopyOutlinedIcon sx={{ fontSize: 13 }} />
        )}
      </ChipCopyButton>
    </ChipRoot>
  );
};
