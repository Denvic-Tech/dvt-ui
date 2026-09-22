import { useId, useRef, useState } from 'react';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { Box, Popover, TextField, Typography } from '@mui/material';

import { Button as PrimitiveButton } from '@/shared/ui/primitives';

import { normalizeComment } from '../lib/columnComments';

type Props = {
  name: string;
  value: string | null;
  baseline?: string | null;
  sourceComment?: string | null;
  disabled?: boolean;
  disabledReason?: string;
  onChange: (value: string | null) => void;
  onReset?: () => void;
};

export function ColumnCommentEditor({
  name,
  value,
  baseline,
  sourceComment,
  disabled,
  disabledReason,
  onChange,
  onReset,
}: Props) {
  const commentRef = useRef<HTMLSpanElement>(null);
  const titleId = useId();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [restoreFromSource, setRestoreFromSource] = useState(false);
  const [text, setText] = useState('');
  const hasChanges = normalizeComment(text) !== normalizeComment(value);
  const dirty =
    baseline !== undefined &&
    normalizeComment(value) !== normalizeComment(baseline);
  const close = () => setAnchorEl(null);
  return (
    <Box sx={{ minWidth: 0 }}>
      <Box
        component='span'
        sx={{ display: 'block' }}
        onMouseEnter={event => {
          const comment = commentRef.current;
          const isClipped =
            comment &&
            (comment.scrollWidth > comment.clientWidth ||
              comment.scrollHeight > comment.clientHeight);
          event.currentTarget.title = isClipped ? (value ?? '') : '';
        }}
        onMouseLeave={event => {
          event.currentTarget.removeAttribute('title');
        }}
      >
        <PrimitiveButton
          variant='ghost'
          size='sm'
          fullWidth
          disableRipple
          disabled={Boolean(disabled)}
          aria-label={`Комментарий колонки ${name}`}
          aria-description={disabled ? disabledReason : undefined}
          onClick={event => {
            setText(value ?? '');
            setRestoreFromSource(false);
            setAnchorEl(event.currentTarget);
          }}
          sx={{
            justifyContent: 'space-between',
            gap: 1,
            minWidth: 0,
            px: 1,
            py: 0.5,
            border: '1px solid transparent',
            borderRadius: '8px',
            textAlign: 'left',
            color: 'text.secondary',
            '&:hover, &.Mui-focusVisible': {
              bgcolor: 'action.hover',
              borderColor: 'divider',
              '& .comment-edit-icon': { opacity: 1 },
            },
            '&.Mui-focusVisible': {
              outline: '2px solid',
              outlineColor: 'primary.main',
              outlineOffset: 2,
            },
            '&.Mui-disabled': { color: 'text.secondary' },
            '@media (hover: none)': {
              '& .comment-edit-icon': { opacity: 1 },
            },
          }}
        >
          <Typography
            ref={commentRef}
            component='span'
            sx={{
              minWidth: 0,
              fontSize: 14,
              lineHeight: '20px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              color: value ? 'inherit' : 'text.disabled',
            }}
          >
            {value || '—'}
            {dirty && (
              <Box
                component='span'
                aria-label='Комментарий изменён'
                sx={{ color: 'primary.main', ml: 0.5 }}
              >
                •
              </Box>
            )}
          </Typography>
          {!disabled && (
            <EditOutlinedIcon
              className='comment-edit-icon'
              sx={{
                fontSize: 14,
                flexShrink: 0,
                color: 'text.disabled',
                opacity: 0,
                transition: 'opacity 120ms ease',
              }}
            />
          )}
        </PrimitiveButton>
      </Box>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={close}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        slotProps={{
          paper: {
            role: 'dialog',
            'aria-labelledby': titleId,
            sx: {
              mt: 1,
              width: 420,
              maxWidth: 'calc(100vw - 32px)',
              borderRadius: '16px',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 12px 32px rgba(20, 20, 40, 0.16)',
              overflow: 'hidden',
            },
          },
        }}
      >
        <Box sx={{ px: 2, pt: 1.25, pb: 2 }}>
          <Box
            id={titleId}
            sx={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 1.25,
              mb: 1.25,
            }}
          >
            <Typography
              component='span'
              sx={{
                fontFamily: theme => theme.typography.fontFamily,
                fontSize: 13,
                fontWeight: 600,
                overflowWrap: 'anywhere',
              }}
            >
              {name}
            </Typography>
            <Typography
              component='span'
              sx={{
                fontFamily: theme => theme.typography.fontFamily,
                fontSize: 12,
                fontWeight: 500,
                color: 'text.disabled',
                whiteSpace: 'nowrap',
              }}
            >
              комментарий в БД
            </Typography>
          </Box>
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={3}
            maxRows={8}
            value={text}
            onChange={event => {
              setText(event.target.value);
              setRestoreFromSource(false);
            }}
            slotProps={{ htmlInput: { 'aria-label': 'Комментарий' } }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                p: '12px 14px',
                alignItems: 'flex-start',
                fontSize: 14,
                lineHeight: '22px',
              },
              '& .MuiInputBase-inputMultiline': {
                p: 0,
                minHeight: 0,
              },
            }}
          />
        </Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            px: 1.5,
            py: 1,
            '& .MuiButton-root': {
              minHeight: 30,
              py: 0.25,
              borderRadius: '8px',
            },
            '& .MuiButton-text:hover': {
              color: 'text.primary',
            },
            bgcolor: 'action.hover',
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          <PrimitiveButton
            variant='ghost'
            size='sm'
            disabled={sourceComment == null && !onReset}
            onClick={() => {
              setText(sourceComment ?? '');
              setRestoreFromSource(Boolean(onReset));
            }}
            sx={{ color: 'text.secondary' }}
          >
            Из DF
          </PrimitiveButton>
          <PrimitiveButton
            variant='ghost'
            size='sm'
            onClick={() => {
              setText('');
              setRestoreFromSource(false);
            }}
            sx={{ color: 'text.secondary' }}
          >
            Очистить
          </PrimitiveButton>
          <Box sx={{ flex: 1 }} />
          <PrimitiveButton
            variant='ghost'
            size='sm'
            onClick={close}
            sx={{ color: 'text.secondary' }}
          >
            Отмена
          </PrimitiveButton>
          <PrimitiveButton
            variant={hasChanges ? 'default' : 'secondary'}
            size='sm'
            disabled={!hasChanges}
            onClick={() => {
              if (restoreFromSource && onReset) {
                onReset();
              } else {
                onChange(normalizeComment(text));
              }
              close();
            }}
            sx={{
              border: 0,
              borderRadius: '8px',
              '&.Mui-disabled': {
                border: 0,
                boxShadow: 'none',
                bgcolor: 'action.hover',
                color: 'text.secondary',
              },
              ...(hasChanges && {
                background: theme => theme.palette.primary.main,
                color: 'primary.contrastText',
                boxShadow: 'none',
                '&:hover': {
                  background: theme => theme.palette.primary.dark,
                  boxShadow: 'none',
                },
              }),
            }}
          >
            Сохранить
          </PrimitiveButton>
        </Box>
      </Popover>
    </Box>
  );
}
