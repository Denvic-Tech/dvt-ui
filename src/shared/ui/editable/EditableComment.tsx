import React, { useLayoutEffect, useRef, useState } from 'react';
import { alpha, Box, styled, Typography } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type Props = {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  minRows?: number;
  maxRows?: number;
  maxLength?: number;
  debounceMs?: number;
  disabled?: boolean;
};

const MAX_EDITOR_VH = 0.52;
type Mode = 'edit' | 'preview';

// ============================================
// Styled Components
// ============================================

const Container = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  flex: 1,
  minHeight: 0,
});

const TopBar = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
});

const ModeTabs = styled(Box)(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: 4,
  borderRadius: 12,
  background: alpha(theme.palette.primary.main, 0.04),
}));

const ModeTabButton = styled('button', {
  shouldForwardProp: prop => prop !== 'active',
})<{ active?: boolean }>(({ theme, active }) => ({
  border: 'none',
  background: active ? alpha(theme.palette.primary.main, 0.12) : 'transparent',
  color: active ? theme.palette.primary.main : theme.palette.text.secondary,
  borderRadius: 10,
  padding: '8px 14px',
  fontSize: '0.875rem',
  fontWeight: active ? 700 : 600,
  fontFamily: 'inherit',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
  '&:hover': {
    background: active
      ? alpha(theme.palette.primary.main, 0.14)
      : alpha(theme.palette.text.primary, 0.05),
  },
}));

const EditorSurface = styled(Box)(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: 14,
  backgroundColor: theme.palette.background.paper,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  minHeight: 0,
  transition: 'all 0.15s ease',
  '&:focus-within': {
    borderColor: theme.palette.primary.main,
    boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.1)}`,
  },
}));

const EditorArea = styled(Box)({
  padding: '16px 18px',
  flex: 1,
  minHeight: 0,
  position: 'relative',
});

const StyledTextarea = styled('textarea')(({ theme }) => ({
  width: '100%',
  resize: 'none',
  border: 'none',
  outline: 'none',
  background: 'transparent',
  fontFamily: 'inherit',
  fontSize: '0.8125rem',
  lineHeight: 1.6,
  color: theme.palette.text.primary,
  display: 'block',
  minHeight: 0,
  '&::placeholder': {
    color: theme.palette.text.secondary,
    opacity: 0.6,
  },
}));

const PreviewArea = styled(Box)(({ theme }) => ({
  overflowY: 'auto',
  overflowX: 'hidden',
  minHeight: 240,
  fontSize: '0.8125rem',
  lineHeight: 1.6,
  color: theme.palette.text.primary,
  width: '100%',
  wordBreak: 'break-word',
  '& h1, & h2, & h3, & h4, & h5, & h6': {
    margin: 0,
    marginBottom: 10,
    color: theme.palette.text.primary,
    fontWeight: 700,
    lineHeight: 1.3,
  },
  '& h1': {
    fontSize: '1.5rem',
  },
  '& h2': {
    fontSize: '1.25rem',
  },
  '& h3': {
    fontSize: '1.0625rem',
  },
  '& h4, & h5, & h6': {
    fontSize: '0.9375rem',
  },
  '& p': {
    margin: 0,
    marginBottom: 8,
    '&:last-child': {
      marginBottom: 0,
    },
  },
  '& strong': {
    fontWeight: 700,
  },
  '& ul, & ol': {
    margin: 0,
    marginBottom: 8,
    paddingLeft: 20,
    listStylePosition: 'outside',
  },
  '& ul': {
    listStyleType: 'disc',
  },
  '& ol': {
    listStyleType: 'decimal',
  },
  '& li': {
    marginBottom: 4,
  },
  '& code': {
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    fontSize: '0.75rem',
    backgroundColor: alpha(theme.palette.grey[500], 0.1),
    borderRadius: 4,
    padding: '2px 6px',
  },
  '& pre': {
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    fontSize: '0.75rem',
    backgroundColor: alpha(theme.palette.grey[500], 0.1),
    borderRadius: 6,
    padding: 12,
    overflowX: 'auto',
    margin: '8px 0',
  },
  '& a': {
    color: theme.palette.primary.main,
    textDecoration: 'none',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  '& blockquote': {
    margin: '8px 0',
    paddingLeft: 12,
    borderLeft: `3px solid ${theme.palette.divider}`,
    color: theme.palette.text.secondary,
  },
  '& hr': {
    border: 'none',
    borderTop: `1px solid ${theme.palette.divider}`,
    margin: '12px 0',
  },
}));

const EmptyPreview = styled(Typography)(({ theme }) => ({
  fontSize: '0.8125rem',
  color: theme.palette.text.disabled,
  fontStyle: 'italic',
}));

const CharCounter = styled(Typography)(({ theme }) => ({
  fontSize: '0.75rem',
  fontWeight: 600,
  color: alpha(theme.palette.text.primary, 0.62),
  fontFamily:
    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
}));

const MarkdownHint = styled(Typography)(({ theme }) => ({
  fontSize: '0.75rem',
  lineHeight: 1.5,
  color: theme.palette.text.secondary,
}));

// ============================================
// Main Component
// ============================================

export const EditableComment: React.FC<Props> = ({
  value,
  onChange,
  placeholder = 'Добавьте комментарий…',
  minRows = 1,
  maxRows = 4,
  maxLength = 1000,
  debounceMs = 400,
  disabled,
}) => {
  const [draft, setDraft] = useState(value ?? '');
  const [focused, setFocused] = useState(false);
  const [mode, setMode] = useState<Mode>(
    (value ?? '').trim().length > 0 ? 'preview' : 'edit'
  );

  const areaRef = useRef<HTMLTextAreaElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (!focused && value !== draft) {
      setDraft(value ?? '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, focused]);

  useLayoutEffect(() => {
    if (disabled) return;
    const handler = setTimeout(() => {
      if (draft !== value) onChange(draft.trimEnd());
    }, debounceMs);
    return () => clearTimeout(handler);
  }, [draft, value, onChange, debounceMs, disabled]);

  const flushOnBlur = () => {
    setFocused(false);
    if (draft !== value) onChange(draft.trimEnd());
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const next = e.target.value.slice(0, maxLength);
    setDraft(next);
  };

  useLayoutEffect(() => {
    if (mode !== 'edit') {
      return;
    }

    const el = areaRef.current;
    if (!el) {
      return;
    }

    const applyHeight = () => {
      el.style.height = 'auto';

      const lineHeight = parseFloat(getComputedStyle(el).lineHeight || '20');
      const minH = lineHeight * minRows + 2;
      const maxHByRows = lineHeight * maxRows + 2;
      const viewportH =
        typeof window !== 'undefined' ? window.innerHeight : 800;
      const maxHByViewport = viewportH * MAX_EDITOR_VH;
      const target = Math.min(
        Math.max(el.scrollHeight, minH),
        Math.max(maxHByRows, maxHByViewport)
      );

      el.style.height = `${target}px`;
      el.style.overflowY = el.scrollHeight > target + 1 ? 'auto' : 'hidden';
    };

    applyHeight();

    const ro = new ResizeObserver(applyHeight);
    ro.observe(el);

    return () => ro.disconnect();
  }, [draft, maxRows, minRows, mode]);

  const previewMaxHeight = `${
    (typeof window !== 'undefined' ? window.innerHeight : 800) * MAX_EDITOR_VH
  }px`;

  return (
    <Container>
      <TopBar>
        <ModeTabs>
          <ModeTabButton
            type='button'
            active={mode === 'edit'}
            onClick={() => setMode('edit')}
          >
            Редактор
          </ModeTabButton>
          <ModeTabButton
            type='button'
            active={mode === 'preview'}
            onClick={() => setMode('preview')}
          >
            Предпросмотр
          </ModeTabButton>
        </ModeTabs>

        <CharCounter>
          {draft.length} / {maxLength}
        </CharCounter>
      </TopBar>

      <EditorSurface>
        <EditorArea>
          {mode === 'edit' ? (
            <StyledTextarea
              ref={areaRef}
              value={draft}
              onChange={handleInput}
              onFocus={() => setFocused(true)}
              onBlur={flushOnBlur}
              placeholder={placeholder}
              disabled={disabled}
            />
          ) : (
            <PreviewArea
              ref={previewRef}
              sx={{
                maxHeight: previewMaxHeight,
              }}
            >
              {draft ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {draft}
                </ReactMarkdown>
              ) : (
                <EmptyPreview>Нет комментария</EmptyPreview>
              )}
            </PreviewArea>
          )}
        </EditorArea>
      </EditorSurface>

      <MarkdownHint>
        Поддерживается Markdown: <strong>**жирный**</strong>, <em>*курсив*</em>,
        # заголовки, - списки
      </MarkdownHint>
    </Container>
  );
};

export default EditableComment;
