import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import { Box } from '@mui/material';

import { useAlert } from '@/app/notifications';

import { copyTextToClipboard } from '@/shared/lib/clipboard';

const COPY_BUTTON_CLASS = 'mcp-copy-button';

// Put on the field that hosts a hover-only CopyIconButton.
export const copyHostSx = {
  position: 'relative',
  [`&:hover .${COPY_BUTTON_CLASS}`]: { opacity: 1 },
} as const;

type CopyIconButtonProps = {
  text: string;
  label: string;
  alwaysVisible?: boolean;
  // Stays in the corner of the field, but does not wait for hover to appear.
  persistent?: boolean;
  top?: number;
};

export const CopyIconButton = ({
  text,
  label,
  alwaysVisible = false,
  persistent = false,
  top = 8,
}: CopyIconButtonProps) => {
  const { showNotification } = useAlert();
  const size = alwaysVisible ? 24 : 30;

  const handleCopy = async () => {
    const result = await copyTextToClipboard(text);

    if (result !== 'copied') {
      showNotification({
        type: 'error',
        title: 'Не удалось скопировать',
        group: 'mcp-copy',
      });
    }
  };

  return (
    <Box
      component='button'
      type='button'
      className={COPY_BUTTON_CLASS}
      aria-label={label}
      onClick={() => void handleCopy()}
      sx={{
        width: size,
        height: size,
        flex: `0 0 ${size}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: 'none',
        borderRadius: alwaysVisible ? '6px' : '7px',
        bgcolor: 'transparent',
        color: '#8C93A3',
        cursor: 'pointer',
        transition:
          'opacity 150ms ease, background-color 500ms ease, color 150ms ease, transform 200ms ease',
        ...(alwaysVisible
          ? {}
          : {
              position: 'absolute',
              top,
              right: 8,
              opacity: persistent ? 1 : 0,
              '&:focus-visible': { opacity: 1 },
            }),
        '&:hover': { bgcolor: '#EEF0F4', color: '#3A4152' },
        '&:active': {
          bgcolor: '#DCDDFB',
          color: '#4343D6',
          transform: 'scale(0.9)',
          transition: 'background-color 0s, transform 50ms ease',
        },
      }}
    >
      <ContentCopyOutlinedIcon sx={{ fontSize: alwaysVisible ? 13 : 15 }} />
    </Box>
  );
};
