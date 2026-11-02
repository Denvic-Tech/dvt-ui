import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { Box } from '@mui/material';

export const REVEAL_FIELD_BACKGROUND = '#F6F7FB';

export const hiddenContentSx = {
  filter: 'blur(5px)',
  opacity: 0.7,
  userSelect: 'none',
  pointerEvents: 'none',
} as const;

type RevealOverlayProps = {
  label: string;
  disabled?: boolean;
  onClick: () => void;
};

// Covers a field with REVEAL_FIELD_BACKGROUND and content under hiddenContentSx.
export const RevealOverlay = ({
  label,
  disabled = false,
  onClick,
}: RevealOverlayProps) => (
  <Box
    component='button'
    type='button'
    disabled={disabled}
    onClick={onClick}
    sx={{
      position: 'absolute',
      inset: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 0.875,
      border: 'none',
      borderRadius: '12px',
      bgcolor: 'rgba(246, 247, 251, 0.55)',
      color: 'rgba(27, 31, 42, 0.82)',
      font: 'inherit',
      fontSize: 13.5,
      fontWeight: 600,
      cursor: 'pointer',
      transition: 'background-color 150ms ease, color 150ms ease',
      '&:hover:not(:disabled)': {
        bgcolor: 'rgba(246, 247, 251, 0.7)',
        color: 'rgb(27, 31, 42)',
      },
      '&:disabled': { cursor: 'not-allowed' },
    }}
  >
    <VisibilityOutlinedIcon sx={{ fontSize: 16 }} />
    {label}
  </Box>
);
