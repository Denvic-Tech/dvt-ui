import { useEffect, useMemo, useState } from 'react';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { Box, Collapse, Dialog, Tooltip, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

import type { ConfirmDialogActionConfig, ConfirmDialogProps } from './types';

type DialogVariant = 'danger' | 'warning' | 'info' | 'success';
type PrimaryVariant = 'danger' | 'primary';
type VisualActionType = 'primary' | 'secondary' | 'text';

interface VisualAction {
  action: ConfirmDialogActionConfig;
  type: VisualActionType;
  primaryVariant: PrimaryVariant;
  originalIndex: number;
}

interface RenderedDialogState {
  actions: ConfirmDialogActionConfig[];
  maxWidth: ConfirmDialogProps['maxWidth'];
  message: string;
  title: string;
}

const StyledDialog = styled(Dialog)(({ theme }) => ({
  zIndex: theme.zIndex.tooltip + 1,
  '& .MuiDialog-paper': {
    width: 320,
    maxWidth: 'calc(100vw - 32px)',
    borderRadius: 16,
    boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
    overflow: 'hidden',
  },
  '& .MuiBackdrop-root': {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    backdropFilter: 'blur(4px)',
  },
}));

const DialogContent = styled(Box)(() => ({
  padding: 24,
  textAlign: 'center',
}));

const IconContainer = styled(Box)<{
  variant: DialogVariant;
}>(({ variant }) => {
  const colors: Record<DialogVariant, { bg: string; color: string }> = {
    danger: { bg: '#fee2e2', color: '#dc2626' },
    warning: { bg: '#fef3c7', color: '#d97706' },
    info: { bg: '#dbeafe', color: '#2563eb' },
    success: { bg: '#d1fae5', color: '#059669' },
  };

  return {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors[variant].bg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
    '& .MuiSvgIcon-root': {
      fontSize: 28,
      color: colors[variant].color,
    },
  };
});

const DialogTitle = styled(Typography)(() => ({
  fontSize: 16,
  fontWeight: 600,
  color: '#111827',
  marginBottom: 4,
  lineHeight: 1.4,
}));

const DialogDescription = styled(Typography)(() => ({
  fontSize: 14,
  fontWeight: 400,
  color: '#6b7280',
  marginBottom: 12,
  lineHeight: 1.5,
  whiteSpace: 'pre-line',
  '& .count': {
    fontWeight: 600,
    color: '#374151',
  },
}));

const ButtonsContainer = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
}));

const ToggleListButton = styled('button')(() => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 4,
  padding: '4px 8px',
  margin: '0 auto 16px',
  fontSize: 12,
  fontWeight: 500,
  fontFamily: 'inherit',
  color: '#6366f1',
  backgroundColor: 'transparent',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
  transition: 'all 150ms ease',
  '&:hover': {
    color: '#4f46e5',
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
  },
  '&:focus-visible': {
    outline: 'none',
    boxShadow: '0 0 0 3px rgba(99, 102, 241, 0.2)',
  },
  '&:disabled': {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  '& .toggle-icon': {
    width: 16,
    height: 16,
    transition: 'transform 200ms ease',
  },
  '&.expanded .toggle-icon': {
    transform: 'rotate(180deg)',
  },
}));

const ItemsListContainer = styled(Box)(() => ({
  maxHeight: 128,
  overflowY: 'auto',
  backgroundColor: '#f9fafb',
  borderRadius: 12,
  marginBottom: 16,
  '&::-webkit-scrollbar': {
    width: 4,
  },
  '&::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    background: '#e5e7eb',
    borderRadius: 2,
  },
}));

const ItemRow = styled(Box)<{ isLast: boolean }>(({ isLast }) => ({
  padding: '8px 12px',
  borderBottom: isLast ? 'none' : '1px solid #f3f4f6',
}));

const ItemName = styled(Typography)(() => ({
  fontSize: 12,
  fontWeight: 400,
  color: '#374151',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}));

const PrimaryButton = styled('button')<{ variant: PrimaryVariant }>(({
  variant,
}) => {
  const colors: Record<PrimaryVariant, { bg: string; hover: string }> = {
    danger: { bg: '#ef4444', hover: '#dc2626' },
    primary: { bg: '#6366f1', hover: '#4f46e5' },
  };
  const focusRing =
    variant === 'danger' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(99, 102, 241, 0.3)';

  return {
    width: '100%',
    padding: '10px 16px',
    fontSize: 14,
    fontWeight: 500,
    fontFamily: 'inherit',
    lineHeight: '20px',
    color: '#ffffff',
    backgroundColor: colors[variant].bg,
    border: 'none',
    borderRadius: 12,
    cursor: 'pointer',
    transition: 'all 150ms ease',
    '&:hover': {
      backgroundColor: colors[variant].hover,
    },
    '&:focus-visible': {
      outline: 'none',
      boxShadow: `0 0 0 3px ${focusRing}`,
    },
    '&:active': {
      transform: 'scale(0.98)',
    },
    '&:disabled': {
      opacity: 0.6,
      cursor: 'not-allowed',
      transform: 'none',
    },
  };
});

const SecondaryButton = styled('button')(() => ({
  width: '100%',
  padding: '10px 16px',
  fontSize: 14,
  fontWeight: 500,
  fontFamily: 'inherit',
  lineHeight: '20px',
  color: '#374151',
  backgroundColor: '#f3f4f6',
  border: 'none',
  borderRadius: 12,
  cursor: 'pointer',
  transition: 'all 150ms ease',
  '&:hover': {
    backgroundColor: '#e5e7eb',
  },
  '&:focus-visible': {
    outline: 'none',
    boxShadow: '0 0 0 3px rgba(156, 163, 175, 0.3)',
  },
  '&:active': {
    transform: 'scale(0.98)',
  },
  '&:disabled': {
    opacity: 0.6,
    cursor: 'not-allowed',
    transform: 'none',
  },
}));

const TextButton = styled('button')(() => ({
  width: '100%',
  padding: '10px 16px',
  fontSize: 14,
  fontWeight: 500,
  fontFamily: 'inherit',
  lineHeight: '20px',
  color: '#6b7280',
  backgroundColor: 'transparent',
  border: 'none',
  borderRadius: 12,
  cursor: 'pointer',
  transition: 'all 150ms ease',
  '&:hover': {
    color: '#374151',
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
  },
  '&:focus-visible': {
    outline: 'none',
  },
  '&:active': {
    transform: 'scale(0.98)',
  },
  '&:disabled': {
    opacity: 0.6,
    cursor: 'not-allowed',
    transform: 'none',
  },
}));

const getDefaultIcon = (variant: DialogVariant) => {
  switch (variant) {
    case 'danger':
      return <DeleteIcon />;
    case 'info':
      return <InfoIcon />;
    case 'success':
      return <CheckCircleIcon />;
    case 'warning':
    default:
      return <WarningAmberIcon />;
  }
};

const getPrimaryActionIndex = (actions: ConfirmDialogActionConfig[]) => {
  if (actions.length === 0) return -1;

  const emphasizeIndex = actions.findIndex(action => action.emphasize);
  if (emphasizeIndex >= 0) return emphasizeIndex;

  const coloredIndex = actions.findIndex(
    action => action.color === 'error' || action.color === 'primary'
  );
  if (coloredIndex >= 0) return coloredIndex;

  return actions.length - 1;
};

const inferDialogVariant = ({
  title,
  message,
  primaryAction,
}: {
  title: string;
  message: string;
  primaryAction: ConfirmDialogActionConfig | undefined;
}): DialogVariant => {
  if (!primaryAction) return 'warning';

  if (primaryAction.color === 'error') return 'danger';

  const context = `${title} ${message} ${primaryAction.label}`.toLowerCase();
  if (context.includes('удал') || context.includes('delete')) {
    return 'danger';
  }
  if (context.includes('сохран')) {
    return 'warning';
  }
  if (
    context.includes('активир') ||
    context.includes('разблок') ||
    context.includes('включ')
  ) {
    return 'success';
  }
  if (primaryAction.color === 'primary') {
    return 'info';
  }

  return 'warning';
};

const parseMessageParts = (message: string) => {
  const lines = message
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

  const itemLines = lines
    .filter(line => /^[•*-]\s+/.test(line))
    .map(line => line.replace(/^[•*-]\s+/, '').trim())
    .filter(Boolean);

  if (itemLines.length === 0) {
    return {
      description: message,
      items: [] as string[],
    };
  }

  const description = lines
    .filter(line => !/^[•*-]\s+/.test(line))
    .join('\n')
    .trim();

  return {
    description,
    items: itemLines,
  };
};

const inferItemsLabel = (title: string, items: string[]) => {
  const hasFileContext =
    title.toLowerCase().includes('файл') ||
    items.some(item => item.toLowerCase().includes('файл'));

  if (hasFileContext) {
    return items.length === 1 ? 'файл' : 'файлов';
  }

  return items.length === 1 ? 'элемент' : 'элементов';
};

const getActionTestId = (
  action: ConfirmDialogActionConfig,
  type: VisualActionType
) => {
  if (action.id === 'confirm' || type === 'primary') {
    return 'shared/ui/confirm-dialog/confirm-button';
  }

  if (action.id === 'cancel') {
    return 'shared/ui/confirm-dialog/cancel-button';
  }

  return 'shared/ui/confirm-dialog/action-button';
};

export const ConfirmDialog = ({
  open,
  title,
  message,
  actions,
  maxWidth,
  onAction,
  onClose,
  onExited,
  busy = false,
}: ConfirmDialogProps) => {
  const [isListExpanded, setIsListExpanded] = useState(false);
  const [renderedState, setRenderedState] = useState<RenderedDialogState>({
    actions,
    maxWidth,
    message,
    title,
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    setRenderedState({
      actions,
      maxWidth,
      message,
      title,
    });
  }, [actions, maxWidth, message, open, title]);

  const renderedActions = renderedState.actions;
  const renderedMessage = renderedState.message;
  const renderedTitle = renderedState.title;
  const renderedMaxWidth = renderedState.maxWidth;

  const primaryActionIndex = useMemo(
    () => getPrimaryActionIndex(renderedActions),
    [renderedActions]
  );

  const messageParts = useMemo(
    () => parseMessageParts(renderedMessage),
    [renderedMessage]
  );
  const hasItems = messageParts.items.length > 0;
  const inferredItemsLabel = useMemo(
    () => inferItemsLabel(renderedTitle, messageParts.items),
    [messageParts.items, renderedTitle]
  );

  useEffect(() => {
    if (open) {
      setIsListExpanded(false);
    }
  }, [open, message, title]);

  const visualActions = useMemo<VisualAction[]>(() => {
    const orderByType: Record<VisualActionType, number> = {
      primary: 0,
      secondary: 1,
      text: 2,
    };

    return renderedActions
      .map((action, index) => {
        let type: VisualActionType = 'secondary';

        if (index === primaryActionIndex) {
          type = 'primary';
        } else if (renderedActions.length >= 3 && action.id === 'cancel') {
          type = 'text';
        }

        const primaryVariant: PrimaryVariant =
          action.color === 'error' ? 'danger' : 'primary';

        return {
          action,
          type,
          primaryVariant,
          originalIndex: index,
        };
      })
      .sort((left, right) => {
        const byType = orderByType[left.type] - orderByType[right.type];
        if (byType !== 0) return byType;
        return left.originalIndex - right.originalIndex;
      });
  }, [primaryActionIndex, renderedActions]);

  const dialogVariant = useMemo(() => {
    const primaryAction =
      primaryActionIndex >= 0 ? renderedActions[primaryActionIndex] : undefined;

    return inferDialogVariant({
      title: renderedTitle,
      message: renderedMessage,
      primaryAction,
    });
  }, [primaryActionIndex, renderedActions, renderedMessage, renderedTitle]);

  return (
    <StyledDialog
      open={open}
      data-testid='shared/ui/confirm-dialog/dialog'
      onClose={(_event, reason) => {
        if (!reason || busy) return;
        onClose();
      }}
      keepMounted
      TransitionProps={{
        onExited: () => {
          onExited?.();
        },
      }}
      maxWidth={renderedMaxWidth}
    >
      <DialogContent>
        <IconContainer variant={dialogVariant}>
          {getDefaultIcon(dialogVariant)}
        </IconContainer>

        <DialogTitle>{renderedTitle}</DialogTitle>

        {!!renderedMessage && (
          <DialogDescription>
            {hasItems ? (
              <>
                <span className='count'>
                  {messageParts.items.length} {inferredItemsLabel}
                </span>{' '}
                {messageParts.description || 'будут обработаны'}
              </>
            ) : (
              renderedMessage
            )}
          </DialogDescription>
        )}

        {hasItems && (
          <>
            <ToggleListButton
              type='button'
              onClick={() => setIsListExpanded(expanded => !expanded)}
              className={isListExpanded ? 'expanded' : ''}
              disabled={busy}
            >
              {isListExpanded ? 'Скрыть список' : 'Показать список'}
              <KeyboardArrowDownIcon className='toggle-icon' />
            </ToggleListButton>

            <Collapse in={isListExpanded}>
              <ItemsListContainer>
                {messageParts.items.map((item, index) => (
                  <ItemRow
                    key={`${item}-${index}`}
                    isLast={index === messageParts.items.length - 1}
                  >
                    <Tooltip
                      title={item}
                      placement='top'
                      arrow
                      enterDelay={250}
                    >
                      <Box sx={{ width: '100%' }}>
                        <ItemName>• {item}</ItemName>
                      </Box>
                    </Tooltip>
                  </ItemRow>
                ))}
              </ItemsListContainer>
            </Collapse>
          </>
        )}

        {visualActions.length > 0 && (
          <ButtonsContainer>
            {visualActions.map(
              ({ action, type, primaryVariant, originalIndex }) => {
                const key = `${action.id}-${originalIndex}`;
                const disabled = busy || (action.disabled ?? false);

                if (type === 'primary') {
                  return (
                    <PrimaryButton
                      key={key}
                      type='button'
                      data-testid={getActionTestId(action, type)}
                      data-action-id={action.id}
                      variant={primaryVariant}
                      onClick={() => onAction(action.id)}
                      disabled={disabled}
                      autoFocus={action.autoFocus ?? false}
                    >
                      {action.label}
                    </PrimaryButton>
                  );
                }

                if (type === 'secondary') {
                  return (
                    <SecondaryButton
                      key={key}
                      type='button'
                      data-testid={getActionTestId(action, type)}
                      data-action-id={action.id}
                      onClick={() => onAction(action.id)}
                      disabled={disabled}
                      autoFocus={action.autoFocus ?? false}
                    >
                      {action.label}
                    </SecondaryButton>
                  );
                }

                return (
                  <TextButton
                    key={key}
                    type='button'
                    data-testid={getActionTestId(action, type)}
                    data-action-id={action.id}
                    onClick={() => onAction(action.id)}
                    disabled={disabled}
                    autoFocus={action.autoFocus ?? false}
                  >
                    {action.label}
                  </TextButton>
                );
              }
            )}
          </ButtonsContainer>
        )}
      </DialogContent>
    </StyledDialog>
  );
};
