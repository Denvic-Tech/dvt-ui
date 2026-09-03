import React from 'react';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { useNodeDocumentation } from '@/entities/node/node-documentation';
import { useNodeDocumentationViewer } from '@/entities/node/node-documentation-viewer';

import { IconButton } from '@/shared/ui/primitives';

export const NodeDocumentationViewer = () => {
  const { closeViewer, nodeName, nodeTitle, open, resetViewer } =
    useNodeDocumentationViewer();
  const { documentation, error, isLoading, reload, status } =
    useNodeDocumentation(nodeName, {
      enabled: open,
    });

  const hasContent = Boolean(documentation?.content?.trim());
  const isInitialLoading = isLoading && !documentation;
  const isRefreshing = status === 'loading' && Boolean(documentation);

  return (
    <Dialog
      open={open}
      fullWidth
      maxWidth='md'
      scroll='paper'
      onClose={closeViewer}
      TransitionProps={{
        onExited: resetViewer,
      }}
      PaperProps={{
        sx: {
          maxHeight: 'calc(100vh - 32px)',
          borderRadius: '16px',
        },
      }}
    >
      <Box
        sx={{
          backgroundColor: 'action.hover',
          borderBottom: theme => `1px solid ${theme.palette.divider}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          px: 3,
          py: 2.5,
        }}
      >
        <Box
          sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}
        >
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: '10px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#eef2ff',
              color: '#6366f1',
              flexShrink: 0,
            }}
          >
            <ArticleOutlinedIcon sx={{ fontSize: 18 }} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography component='h2' variant='h6'>
              Документация ноды
            </Typography>
            <Typography
              noWrap
              color='text.secondary'
              component='p'
              title={nodeTitle ?? nodeName ?? ''}
              variant='body2'
              sx={{ mt: 0.5 }}
            >
              {nodeTitle ?? nodeName ?? ''}
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}
        >
          {documentation?.locale ? (
            <Chip
              size='small'
              label={documentation.locale}
              sx={{
                height: 24,
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
              }}
            />
          ) : null}
          <IconButton
            aria-label='Закрыть документацию'
            size='xs'
            variant='ghost'
            onClick={closeViewer}
            sx={{
              width: 28,
              minWidth: 28,
              height: 28,
              minHeight: 28,
              color: '#6b7280',
              '&:hover': {
                backgroundColor: '#f3f4f6',
                color: '#111827',
              },
            }}
          >
            <CloseIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Box>
      </Box>

      <DialogContent
        sx={{
          overflowX: 'hidden',
          px: 4,
          pt: 3,
          pb: 4,
        }}
      >
        {error ? (
          <Box
            sx={theme => ({
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
              border: `1px solid ${theme.palette.error.light}`,
              borderRadius: 2,
              px: 2,
              py: 1.5,
              color: theme.palette.error.main,
              backgroundColor: alpha(theme.palette.error.main, 0.06),
              mb: 2,
            })}
          >
            <Typography>
              {error.message ?? 'Не удалось загрузить документацию ноды'}
            </Typography>
            <Button
              color='inherit'
              size='small'
              variant='outlined'
              onClick={() => void reload({ force: true })}
            >
              Повторить
            </Button>
          </Box>
        ) : null}

        {isInitialLoading ? (
          <Box
            sx={{
              minHeight: 260,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CircularProgress size={28} />
          </Box>
        ) : hasContent ? (
          <Box
            sx={theme => ({
              minHeight: 260,
              color: theme.palette.text.primary,
              fontSize: '0.875rem',
              lineHeight: 1.7,
              wordBreak: 'break-word',
              '& h1, & h2, & h3, & h4, & h5, & h6': {
                margin: 0,
                marginBottom: 1.25,
                color: theme.palette.text.primary,
                fontWeight: 700,
                lineHeight: 1.35,
              },
              '& h1': { fontSize: '1.5rem' },
              '& h2': { fontSize: '1.25rem' },
              '& h3': { fontSize: '1.0625rem' },
              '& h4, & h5, & h6': { fontSize: '0.9375rem' },
              '& p': {
                margin: 0,
                marginBottom: 1.25,
                '&:last-child': {
                  marginBottom: 0,
                },
              },
              '& ul, & ol': {
                margin: 0,
                marginBottom: 1.25,
                paddingLeft: 3,
                listStylePosition: 'outside',
              },
              '& ul': {
                listStyleType: 'disc',
              },
              '& ol': {
                listStyleType: 'decimal',
              },
              '& ul li::marker, & ol li::marker': {
                color: theme.palette.primary.main,
              },
              '& li': {
                marginBottom: 0.5,
              },
              '& code': {
                fontFamily:
                  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                fontSize: '0.8125rem',
                borderRadius: 1,
                padding: '2px 6px',
              },
              '& :not(pre) > code': {
                color: '#5b5bd6',
                backgroundColor: '#f3f1ff',
                border: '1px solid #e1dcff',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: 500,
                padding: '2px 8px',
              },
              '& pre': {
                fontFamily:
                  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                fontSize: '0.8125rem',
                backgroundColor: alpha(theme.palette.grey[500], 0.1),
                borderRadius: 2,
                padding: 1.5,
                overflowX: 'auto',
                margin: '12px 0',
              },
              '& a': {
                color: theme.palette.primary.main,
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline',
                },
              },
              '& blockquote': {
                margin: '12px 0',
                paddingLeft: 1.5,
                borderLeft: `3px solid ${theme.palette.divider}`,
                color: theme.palette.text.secondary,
              },
              '& hr': {
                border: 'none',
                borderTop: `1px solid ${theme.palette.divider}`,
                margin: '16px 0',
              },
            })}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {documentation?.content ?? ''}
            </ReactMarkdown>
          </Box>
        ) : (
          <Box
            sx={{
              minHeight: 260,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              px: 3,
              textAlign: 'center',
            }}
          >
            <Typography color='text.secondary'>
              Для этой ноды пока нет опубликованного содержимого документации.
            </Typography>
          </Box>
        )}

        {isRefreshing ? (
          <Typography variant='caption' color='text.secondary'>
            Обновляем документацию...
          </Typography>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};
