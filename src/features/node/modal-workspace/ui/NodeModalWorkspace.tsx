import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import CheckRoundedIcon from '@mui/icons-material/CheckRounded';
import ChevronLeftRoundedIcon from '@mui/icons-material/ChevronLeftRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import ErrorOutlineRoundedIcon from '@mui/icons-material/ErrorOutlineRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import {
  Box,
  CircularProgress,
  IconButton,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha, styled } from '@mui/material/styles';

import { useNodeModalWorkspacePreferences } from '@/entities/ui-preferences/model/hooks';

import { usePointerResize } from '@/shared/lib/hooks/usePointerResize';
import { getControlRadius } from '@/shared/ui/primitives/components/theme-style-helpers';

import type {
  NodeModalWorkspacePreview,
  NodeModalWorkspaceProps,
  NodeModalWorkspaceSection,
} from '../model/types';

export const NODE_MODAL_WORKSPACE_NAV_WIDTH = 256;
export const NODE_MODAL_WORKSPACE_MAIN_MIN_WIDTH = 560;
export const NODE_MODAL_WORKSPACE_PREVIEW_DEFAULT_WIDTH = 420;
export const NODE_MODAL_WORKSPACE_PREVIEW_MIN_WIDTH = 320;

const RESIZER_WIDTH = 8;
const PREVIEW_FALLBACK_MAX_WIDTH = 1200;
const DESKTOP_PREVIEW_MIN_WORKSPACE_WIDTH =
  NODE_MODAL_WORKSPACE_NAV_WIDTH +
  NODE_MODAL_WORKSPACE_MAIN_MIN_WIDTH +
  NODE_MODAL_WORKSPACE_PREVIEW_MIN_WIDTH +
  RESIZER_WIDTH;

const CONTENT_WIDTHS = {
  compact: 640,
  regular: 800,
  wide: 1200,
} as const;

const WorkspaceRoot = styled(Box)(({ theme }) => ({
  position: 'relative',
  display: 'flex',
  height: '100%',
  minHeight: 0,
  overflow: 'hidden',
  backgroundColor: theme.palette.background.paper,
}));

const WorkspaceNavigation = styled('nav')(({ theme }) => ({
  width: NODE_MODAL_WORKSPACE_NAV_WIDTH,
  flex: `0 0 ${NODE_MODAL_WORKSPACE_NAV_WIDTH}px`,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  borderRight: `1px solid ${theme.palette.divider}`,
  backgroundColor: alpha(theme.palette.grey[50], 0.82),
}));

const NavigationList = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  padding: '4px 10px 16px',
  overflowY: 'auto',
});

const NavigationItem = styled('button', {
  shouldForwardProp: prop => prop !== 'active' && prop !== 'hasError',
})<{ active: boolean; hasError: boolean }>(({ theme, active, hasError }) => ({
  width: '100%',
  minHeight: 56,
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '9px 12px',
  border: `1px solid ${
    hasError
      ? alpha(theme.palette.error.main, 0.5)
      : active
        ? theme.palette.primary.main
        : 'transparent'
  }`,
  borderRadius: getControlRadius(theme),
  backgroundColor: hasError
    ? alpha(theme.palette.error.main, 0.06)
    : active
      ? alpha(theme.palette.primary.main, 0.08)
      : 'transparent',
  boxShadow: 'none',
  color: hasError
    ? theme.palette.error.main
    : active
      ? theme.palette.primary.main
      : theme.palette.text.primary,
  font: 'inherit',
  textAlign: 'left',
  cursor: 'pointer',
  transition: 'background-color 150ms ease, border-color 150ms ease',
  '&:hover:not(:disabled)': {
    backgroundColor: hasError
      ? alpha(theme.palette.error.main, 0.09)
      : active
        ? alpha(theme.palette.primary.main, 0.12)
        : theme.palette.action.hover,
  },
  '&:focus-visible': {
    outline: `2px solid ${alpha(theme.palette.primary.main, 0.28)}`,
    outlineOffset: 1,
  },
  '&:disabled': {
    color: theme.palette.text.disabled,
    cursor: 'not-allowed',
  },
}));

const NavigationStatus = styled(Box, {
  shouldForwardProp: prop =>
    prop !== 'active' && prop !== 'complete' && prop !== 'hasError',
})<{ active: boolean; complete: boolean; hasError: boolean }>(
  ({ theme, active, complete, hasError }) => ({
    width: 24,
    height: 24,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    backgroundColor: hasError
      ? alpha(theme.palette.error.main, 0.1)
      : active
        ? theme.palette.primary.main
        : complete
          ? '#dcfce7'
          : alpha(theme.palette.grey[400], 0.12),
    color: hasError
      ? theme.palette.error.main
      : active
        ? theme.palette.primary.contrastText
        : complete
          ? '#15803d'
          : theme.palette.text.secondary,
    '& svg': {
      width: 15,
      height: 15,
    },
  })
);

const WorkspaceMain = styled(Box)({
  flex: '1 1 auto',
  minWidth: 0,
  minHeight: 0,
  overflow: 'auto',
  scrollbarGutter: 'stable',
  overscrollBehavior: 'contain',
});

const PreviewPanel = styled(Box)(({ theme }) => ({
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: alpha(theme.palette.grey[50], 0.74),
}));

const CollapsedPreviewRail = styled('button')(({ theme }) => ({
  width: 52,
  flex: '0 0 52px',
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: 0,
  border: 0,
  borderLeft: `1px solid ${theme.palette.divider}`,
  backgroundColor: alpha(theme.palette.grey[50], 0.74),
  color: theme.palette.text.secondary,
  font: 'inherit',
  cursor: 'pointer',
  transition: 'background-color 150ms ease',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
  '&:focus-visible': {
    outline: `2px solid ${alpha(theme.palette.primary.main, 0.3)}`,
    outlineOffset: -2,
  },
}));

const PreviewResizeHandle = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: RESIZER_WIDTH,
  flex: `0 0 ${RESIZER_WIDTH}px`,
  cursor: 'col-resize',
  touchAction: 'none',
  backgroundColor: theme.palette.background.paper,
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '50%',
    width: 1,
    backgroundColor: theme.palette.divider,
  },
  '&:hover::after, &:focus-visible::after': {
    width: 2,
    backgroundColor: theme.palette.primary.main,
  },
  '&:focus-visible': {
    outline: 'none',
  },
}));

const getPreviewBody = (preview: NodeModalWorkspacePreview) => {
  if (preview.state === 'loading') {
    return (
      preview.loadingState ?? (
        <Stack
          alignItems='center'
          justifyContent='center'
          sx={{ minHeight: 220 }}
        >
          <CircularProgress size={26} />
          <Typography variant='body2' color='text.secondary' sx={{ mt: 1.5 }}>
            Загружаем предпросмотр…
          </Typography>
        </Stack>
      )
    );
  }

  if (preview.state === 'error') {
    return (
      preview.errorState ?? (
        <Typography variant='body2' color='error.main'>
          Не удалось загрузить предпросмотр.
        </Typography>
      )
    );
  }

  if (preview.state === 'empty') {
    return (
      preview.emptyState ?? (
        <Typography variant='body2' color='text.secondary'>
          Здесь появится предпросмотр выбранных данных.
        </Typography>
      )
    );
  }

  return preview.content;
};

export const NodeModalWorkspace = ({
  sections,
  activeSectionId,
  onSectionChange,
  contentWidth = 'regular',
  preview,
}: NodeModalWorkspaceProps) => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const navigationItemRefs = useRef(new Map<string, HTMLButtonElement>());
  const [workspaceWidth, setWorkspaceWidth] = useState(0);
  const [isPreviewOpen, setIsPreviewOpen] = useState(true);
  const [localPreviewTabId, setLocalPreviewTabId] = useState(
    preview?.tabs?.[0]?.id ?? ''
  );
  const { previewWidth, setPreviewWidth } = useNodeModalWorkspacePreferences();

  useEffect(() => {
    const element = rootRef.current;
    if (!element) return;

    const updateWidth = () => setWorkspaceWidth(element.clientWidth);
    updateWidth();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateWidth);
      return () => window.removeEventListener('resize', updateWidth);
    }

    const observer = new ResizeObserver(updateWidth);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const firstTabId = preview?.tabs?.[0]?.id;
    if (
      firstTabId &&
      !preview.tabs?.some(tab => tab.id === localPreviewTabId)
    ) {
      setLocalPreviewTabId(firstTabId);
    }
  }, [localPreviewTabId, preview?.tabs]);

  const enabledSections = useMemo(
    () => sections.filter(section => !section.disabled),
    [sections]
  );
  const activeSection =
    sections.find(section => section.id === activeSectionId) ??
    enabledSections[0] ??
    sections[0];
  const requiredSections = sections.filter(section => section.required);
  const completedRequiredCount = requiredSections.filter(
    section => section.complete
  ).length;
  const isPreviewHiddenForWidth = Boolean(
    preview &&
    workspaceWidth > 0 &&
    workspaceWidth < DESKTOP_PREVIEW_MIN_WORKSPACE_WIDTH
  );
  const dynamicPreviewMin = Math.max(
    NODE_MODAL_WORKSPACE_PREVIEW_MIN_WIDTH,
    workspaceWidth > 0 && !isPreviewHiddenForWidth
      ? workspaceWidth -
          NODE_MODAL_WORKSPACE_NAV_WIDTH -
          CONTENT_WIDTHS[contentWidth] -
          RESIZER_WIDTH
      : NODE_MODAL_WORKSPACE_PREVIEW_MIN_WIDTH
  );
  const dynamicPreviewMax = Math.max(
    dynamicPreviewMin,
    workspaceWidth > 0 && !isPreviewHiddenForWidth
      ? workspaceWidth -
          NODE_MODAL_WORKSPACE_NAV_WIDTH -
          NODE_MODAL_WORKSPACE_MAIN_MIN_WIDTH -
          RESIZER_WIDTH
      : PREVIEW_FALLBACK_MAX_WIDTH
  );
  const clampPreviewWidth = useCallback(
    (nextWidth: number) =>
      Math.min(Math.max(nextWidth, dynamicPreviewMin), dynamicPreviewMax),
    [dynamicPreviewMax, dynamicPreviewMin]
  );
  const commitPreviewWidth = useCallback(
    (nextWidth: number) => setPreviewWidth(clampPreviewWidth(nextWidth)),
    [clampPreviewWidth, setPreviewWidth]
  );
  const {
    liveValue: livePreviewWidth,
    setLiveValue: setLivePreviewWidth,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  } = usePointerResize({
    value: previewWidth,
    clamp: clampPreviewWidth,
    getNextValue: ({ currentPointer, startPointer, startValue }) =>
      startValue + startPointer.x - currentPointer.x,
    onCommit: commitPreviewWidth,
    cursor: 'col-resize',
  });

  const selectSection = useCallback(
    (section: NodeModalWorkspaceSection) => {
      if (!section.disabled) onSectionChange(section.id);
    },
    [onSectionChange]
  );

  const handleNavigationKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLElement>) => {
      if (!['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) {
        return;
      }
      if (enabledSections.length === 0) return;

      event.preventDefault();
      const activeIndex = Math.max(
        enabledSections.findIndex(section => section.id === activeSection?.id),
        0
      );
      const targetIndex =
        event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? enabledSections.length - 1
            : event.key === 'ArrowUp'
              ? (activeIndex - 1 + enabledSections.length) %
                enabledSections.length
              : (activeIndex + 1) % enabledSections.length;
      const targetSection = enabledSections[targetIndex];
      onSectionChange(targetSection.id);
      requestAnimationFrame(() =>
        navigationItemRefs.current.get(targetSection.id)?.focus()
      );
    },
    [activeSection?.id, enabledSections, onSectionChange]
  );

  const handleResizeKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLElement>) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;

      event.preventDefault();
      const direction = event.key === 'ArrowLeft' ? 1 : -1;
      const nextWidth = clampPreviewWidth(livePreviewWidth + direction * 16);
      setLivePreviewWidth(nextWidth);
      commitPreviewWidth(nextWidth);
    },
    [
      clampPreviewWidth,
      commitPreviewWidth,
      livePreviewWidth,
      setLivePreviewWidth,
    ]
  );

  const resetPreviewWidth = useCallback(() => {
    const nextWidth = clampPreviewWidth(
      NODE_MODAL_WORKSPACE_PREVIEW_DEFAULT_WIDTH
    );
    setLivePreviewWidth(nextWidth);
    commitPreviewWidth(nextWidth);
  }, [clampPreviewWidth, commitPreviewWidth, setLivePreviewWidth]);

  const selectedPreviewTabId =
    preview?.activeTabId ?? localPreviewTabId ?? preview?.tabs?.[0]?.id ?? '';
  const selectedPreviewTab = preview?.tabs?.find(
    tab => tab.id === selectedPreviewTabId
  );
  const previewBody = preview
    ? getPreviewBody({
        ...preview,
        content: selectedPreviewTab?.content ?? preview.content,
      })
    : null;

  const previewPanel = preview ? (
    <PreviewPanel
      data-testid='features/node/modal-workspace/preview'
      sx={{
        width: livePreviewWidth,
        flex: `0 0 ${livePreviewWidth}px`,
      }}
    >
      <Box
        data-testid='features/node/modal-workspace/preview-header'
        sx={theme => ({
          minHeight: 52,
          px: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          borderBottom: `1px solid ${theme.palette.divider}`,
          boxSizing: 'border-box',
        })}
      >
        <Typography
          variant='overline'
          color='text.secondary'
          sx={{ flex: 1, letterSpacing: '0.12em', lineHeight: 1.2 }}
        >
          {preview.title}
        </Typography>
        {preview.onRefresh ? (
          <Tooltip title='Обновить предпросмотр'>
            <span>
              <IconButton
                size='small'
                aria-label='Обновить предпросмотр'
                disabled={preview.refreshing ?? false}
                onClick={preview.onRefresh}
                sx={{ borderRadius: '6px' }}
              >
                {preview.refreshing ? (
                  <CircularProgress size={16} />
                ) : (
                  <RefreshRoundedIcon fontSize='small' />
                )}
              </IconButton>
            </span>
          </Tooltip>
        ) : null}
        <Tooltip title='Свернуть предпросмотр'>
          <IconButton
            size='small'
            aria-label='Свернуть предпросмотр'
            onClick={() => setIsPreviewOpen(false)}
            sx={{ borderRadius: '6px' }}
          >
            <ChevronRightRoundedIcon fontSize='small' />
          </IconButton>
        </Tooltip>
      </Box>

      {preview.tabs && preview.tabs.length > 0 ? (
        <Tabs
          value={selectedPreviewTabId}
          onChange={(_, nextTabId: string) => {
            setLocalPreviewTabId(nextTabId);
            preview.onTabChange?.(nextTabId);
          }}
          variant='scrollable'
          scrollButtons={false}
          sx={theme => ({
            alignSelf: 'flex-start',
            width: 'fit-content',
            maxWidth: 'calc(100% - 24px)',
            minHeight: 40,
            m: 1.5,
            mb: 0,
            p: 0.5,
            borderRadius: '10px',
            backgroundColor: alpha(theme.palette.grey[100], 0.56),
            '& .MuiTabs-flexContainer': {
              gap: 0.5,
            },
            '& .MuiTabs-indicator': {
              display: 'none',
            },
          })}
        >
          {preview.tabs.map(tab => (
            <Tab
              key={tab.id}
              value={tab.id}
              label={tab.label}
              disableRipple
              sx={theme => ({
                minHeight: 32,
                minWidth: 0,
                px: 1.5,
                py: 0.75,
                borderRadius: '8px',
                color: theme.palette.text.secondary,
                fontSize: 12,
                fontWeight: 550,
                lineHeight: 1.4,
                textTransform: 'none',
                transition:
                  'background-color 150ms ease, box-shadow 150ms ease, color 150ms ease',
                '&.Mui-selected': {
                  color: theme.palette.text.primary,
                  backgroundColor: theme.palette.background.paper,
                  boxShadow: 'none',
                },
                '&:hover': {
                  color: theme.palette.text.primary,
                  backgroundColor: alpha(theme.palette.background.paper, 0.68),
                },
                '&.Mui-selected:hover': {
                  backgroundColor: theme.palette.background.paper,
                },
              })}
            />
          ))}
        </Tabs>
      ) : null}

      <Box
        data-testid='features/node/modal-workspace/preview-content'
        sx={{ flex: 1, minHeight: 0, overflow: 'auto', p: 2 }}
      >
        {previewBody}
      </Box>
    </PreviewPanel>
  ) : null;

  return (
    <WorkspaceRoot ref={rootRef} data-testid='features/node/modal-workspace'>
      <WorkspaceNavigation aria-label='Секции настройки ноды'>
        <Typography
          variant='overline'
          color='text.secondary'
          sx={{ px: 2, pt: 1, pb: 0.5, letterSpacing: '0.14em' }}
        >
          Настройка
        </Typography>
        <NavigationList
          role='tablist'
          aria-orientation='vertical'
          onKeyDown={handleNavigationKeyDown}
        >
          {sections.map((section, index) => {
            const active = section.id === activeSection?.id;
            const item = (
              <NavigationItem
                ref={element => {
                  if (element) {
                    navigationItemRefs.current.set(section.id, element);
                  } else {
                    navigationItemRefs.current.delete(section.id);
                  }
                }}
                key={section.id}
                type='button'
                role='tab'
                id={`node-modal-section-tab-${section.id}`}
                aria-controls={`node-modal-section-panel-${section.id}`}
                aria-selected={active}
                active={active}
                hasError={Boolean(section.error)}
                disabled={section.disabled}
                onClick={() => selectSection(section)}
              >
                <NavigationStatus
                  active={active}
                  complete={Boolean(section.complete)}
                  hasError={Boolean(section.error)}
                >
                  {section.error ? (
                    <ErrorOutlineRoundedIcon />
                  ) : section.complete ? (
                    <CheckRoundedIcon />
                  ) : active ? (
                    section.icon
                  ) : (
                    <Typography component='span' sx={{ fontSize: 11 }}>
                      {index + 1}
                    </Typography>
                  )}
                </NavigationStatus>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      fontSize: 13,
                      fontWeight: active ? 650 : 550,
                      color: section.error
                        ? 'error.main'
                        : active
                          ? 'primary.main'
                          : 'text.primary',
                    }}
                  >
                    {section.label}
                    {section.required ? (
                      <Box component='span' sx={{ color: 'error.main' }}>
                        *
                      </Box>
                    ) : null}
                  </Typography>
                  {section.summary ? (
                    <Typography
                      color={
                        section.disabled
                          ? 'text.disabled'
                          : section.error
                            ? 'error.main'
                            : active
                              ? 'primary.main'
                              : 'text.secondary'
                      }
                      sx={{
                        mt: 0.15,
                        fontSize: 11.5,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {section.summary}
                    </Typography>
                  ) : null}
                </Box>
              </NavigationItem>
            );

            return section.disabled && section.disabledReason ? (
              <Tooltip
                key={section.id}
                title={section.disabledReason}
                placement='right'
              >
                <span>{item}</span>
              </Tooltip>
            ) : (
              item
            );
          })}
        </NavigationList>
        {requiredSections.length > 0 ? (
          <Box
            sx={theme => ({
              mt: 'auto',
              p: 1.5,
              borderTop: `1px solid ${theme.palette.divider}`,
            })}
          >
            <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>
              Обязательные шаги: {completedRequiredCount} /{' '}
              {requiredSections.length}
            </Typography>
            <Box
              sx={theme => ({
                mt: 1,
                height: 3,
                overflow: 'hidden',
                borderRadius: 2,
                backgroundColor: theme.palette.action.hover,
              })}
            >
              <Box
                sx={{
                  width: `${
                    (completedRequiredCount / requiredSections.length) * 100
                  }%`,
                  height: '100%',
                  backgroundColor: '#5ec269',
                  transition: 'width 180ms ease',
                }}
              />
            </Box>
          </Box>
        ) : null}
      </WorkspaceNavigation>

      <WorkspaceMain
        role='tabpanel'
        id={`node-modal-section-panel-${activeSection?.id ?? 'empty'}`}
        aria-labelledby={`node-modal-section-tab-${activeSection?.id ?? 'empty'}`}
        data-testid='features/node/modal-workspace/main'
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: CONTENT_WIDTHS[contentWidth],
            height: '100%',
            minHeight: '100%',
            ml: 0,
            mr: 'auto',
            px: 2.5,
            pt: 0,
            pb: 2,
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {activeSection?.content}
        </Box>
      </WorkspaceMain>

      {preview && isPreviewOpen && !isPreviewHiddenForWidth ? (
        <>
          <PreviewResizeHandle
            role='separator'
            tabIndex={0}
            aria-label='Изменить ширину предпросмотра'
            aria-orientation='vertical'
            aria-valuemin={dynamicPreviewMin}
            aria-valuemax={dynamicPreviewMax}
            aria-valuenow={livePreviewWidth}
            onKeyDown={handleResizeKeyDown}
            onDoubleClick={resetPreviewWidth}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          />
          {previewPanel}
        </>
      ) : null}

      {preview && !isPreviewOpen && !isPreviewHiddenForWidth ? (
        <CollapsedPreviewRail
          type='button'
          aria-label='Открыть предпросмотр'
          onClick={() => setIsPreviewOpen(true)}
          data-testid='features/node/modal-workspace/preview-collapsed'
        >
          <ChevronLeftRoundedIcon sx={{ mt: 1.75, fontSize: 18 }} />
          <Typography
            component='span'
            color='inherit'
            sx={{
              mt: 1.5,
              fontSize: 10,
              fontWeight: 500,
              lineHeight: 1,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              writingMode: 'vertical-rl',
            }}
          >
            Предпросмотр
          </Typography>
        </CollapsedPreviewRail>
      ) : null}
    </WorkspaceRoot>
  );
};
