import { memo, useEffect } from 'react';
import { alpha, keyframes, styled } from '@mui/material/styles';

import { useAppSelector } from '@/app/providers/store';

import { useLineageHighlight } from '@/entities/project-editor/lineage-highlight';

const VIEWER_FONT =
  "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const barIn = keyframes`
  from { opacity: 0; transform: translate(-50%, -6px); }
  to { opacity: 1; transform: translateX(-50%); }
`;

const Bar = styled('div')(({ theme }) => ({
  alignItems: 'center',
  animation: `${barIn} .3s cubic-bezier(.2, .7, .3, 1)`,
  backgroundColor: theme.palette.background.paper,
  borderRadius: 12,
  boxShadow: `0 0 0 1px ${alpha(theme.palette.text.primary, 0.1)}, 0 6px 20px -6px rgba(22, 24, 46, 0.14)`,
  color: theme.palette.text.primary,
  display: 'flex',
  fontFamily: VIEWER_FONT,
  fontSize: 13,
  gap: 10,
  height: 40,
  left: '50%',
  maxWidth: 'calc(100% - 32px)',
  padding: '0 6px 0 14px',
  position: 'absolute',
  top: 16,
  transform: 'translateX(-50%)',
  whiteSpace: 'nowrap',
  zIndex: 20,
}));

const Dot = styled('span')(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  borderRadius: '50%',
  flexShrink: 0,
  height: 8,
  width: 8,
}));

const Title = styled('span')({
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  '& b': { fontWeight: 500 },
});

const Muted = styled('span')(({ theme }) => ({
  color: alpha(theme.palette.text.secondary, 0.78),
  flexShrink: 0,
}));

const ExitButton = styled('button')(({ theme }) => ({
  alignItems: 'center',
  backgroundColor: alpha(theme.palette.text.primary, 0.05),
  border: 0,
  borderRadius: 8,
  color: theme.palette.text.secondary,
  cursor: 'pointer',
  display: 'flex',
  flexShrink: 0,
  fontFamily: 'inherit',
  fontSize: 12.5,
  fontWeight: 500,
  gap: 6,
  height: 28,
  padding: '0 10px',
  transition: 'background-color .12s, color .12s',
  '&:hover': {
    backgroundColor: alpha(theme.palette.text.primary, 0.08),
    color: theme.palette.text.primary,
  },
  '&:focus-visible': {
    outline: `2px solid ${alpha(theme.palette.primary.main, 0.4)}`,
    outlineOffset: 1,
  },
  '& kbd': {
    color: alpha(theme.palette.text.secondary, 0.78),
    fontFamily: 'inherit',
    fontSize: 10.5,
  },
}));

const plural = (count: number, forms: [string, string, string]) => {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
    return forms[1];
  }
  return forms[2];
};

const isEditableTarget = (target: EventTarget | null) => {
  const element = target as HTMLElement | null;
  return Boolean(
    element?.isContentEditable ||
    element?.tagName === 'INPUT' ||
    element?.tagName === 'TEXTAREA'
  );
};

/**
 * Открыт ли диалог или меню со своим Esc. Скрытые модалки с `keepMounted`
 * (например, глобальный `ConfirmDialog`) остаются в DOM с `role="dialog"`,
 * поэтому учитываем только видимые (`MuiModal-hidden` у скрытых) и фокус
 * внутри диалога.
 */
const isDialogOpen = (target: EventTarget | null) => {
  const element = target as HTMLElement | null;
  const activeElement = document.activeElement as HTMLElement | null;
  return Boolean(
    element?.closest('[role="dialog"], .MuiDialog-root') ||
    activeElement?.closest('[role="dialog"], .MuiDialog-root') ||
    document.querySelector('.MuiModal-root:not(.MuiModal-hidden)')
  );
};

const LineageHighlightBannerComponent = () => {
  const { highlight, clearHighlight } = useLineageHighlight();
  const projectId = useAppSelector(
    state => state.projects.selectedProject?.id ?? null
  );
  const isActive = Boolean(highlight);

  // Подсветка относится к графу текущего проекта: при смене проекта или
  // уходе из редактора сбрасываем её.
  useEffect(() => clearHighlight, [clearHighlight, projectId]);

  // Esc выходит из режима просмотра цепочки, если не занят полем ввода или
  // открытым диалогом (у них свой Esc).
  useEffect(() => {
    if (!isActive) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key !== 'Escape' ||
        event.defaultPrevented ||
        isEditableTarget(event.target) ||
        isDialogOpen(event.target)
      ) {
        return;
      }
      clearHighlight();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [clearHighlight, isActive]);

  if (!highlight) {
    return null;
  }

  const nodesCount = highlight.nodeIDs.length;

  return (
    <Bar
      role='status'
      data-testid='widgets/project-editor/lineage-highlight-banner'
    >
      <Dot />
      <Title>
        Цепочка до <b>{highlight.nodeName}</b>
      </Title>
      <Muted>
        {highlight.column} · {nodesCount}{' '}
        {plural(nodesCount, ['нода', 'ноды', 'нод'])}
      </Muted>
      <ExitButton type='button' onClick={clearHighlight}>
        Выйти <kbd>Esc</kbd>
      </ExitButton>
    </Bar>
  );
};

export const LineageHighlightBanner = memo(LineageHighlightBannerComponent);
