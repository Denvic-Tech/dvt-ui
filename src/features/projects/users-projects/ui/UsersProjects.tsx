import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import {
  Box,
  CircularProgress,
  Container,
  Dialog,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from '@mui/material';
import { useSearchParams } from 'react-router-dom';

import { useAlert } from '@/app/notifications';

import { TextInputDialog } from '@/widgets/dialog/text-input-dialog';

import { useOrganizations } from '@/entities/admin/organizations';
import { CreateProjectModal, useProjects } from '@/entities/project/projects';
import { projectsApi } from '@/entities/project/projects/api/projectsApi';
import { normalizeRole, useCurrentUser } from '@/entities/user';

import type {
  OrganizationReadSchema,
  ProjectCreateSchema,
  ProjectFolderItemSchema,
  ProjectFolderReadSchema,
  ProjectItemsPageSchema,
  ProjectLastRunSchema,
  ProjectReadSchema,
  ProjectSearchPageSchema,
  TaskExecutionStatus,
} from '@/shared/gatewayClient';
import { isApiError } from '@/shared/lib/errors';
import { useConfirmDialog } from '@/shared/ui/confirm-dialog';

import { OrganizationSwitcherBar } from './OrganizationSwitcherBar';
import { ProjectContextMenu } from './ProjectContextMenu';
import { ProjectsSearch } from './ProjectsSearch';
import {
  ActionGate,
  BreadcrumbButton,
  BreadcrumbNav,
  BreadcrumbSeparator,
  Checkbox,
  ContentBody,
  ContentHeader,
  EmptyStateContainer,
  EmptyStateIcon,
  EmptyStateText,
  FloatingBar,
  FloatingBarCloseButton,
  FloatingBarCount,
  FloatingBarDeleteButton,
  FolderCard,
  FolderIconBox,
  ItemContent,
  ItemMeta,
  ItemTitle,
  PageEllipsis,
  PageNavIconBtn,
  PageNavWrap,
  PageNumberBtn,
  PageSizeButton,
  PageSizeControl,
  PageSizeLabel,
  PageSizeOption,
  PageSizePopup,
  PageSizeWrap,
  PaginationContainer,
  PaginationDivider,
  PaginationLeft,
  PaginationSummary,
  ProjectCard,
  ProjectIconBox,
  ProjectsPageRoot,
  ProjectsPageShell,
  RowActionButton,
  RowsList,
  RunCirclePlaceholder,
  RunCircleSm,
  RunCirclesRow,
  SectionCount,
  SectionHeaderRow,
  ToolbarContainer,
  ToolbarDropdownBtn,
  ToolbarGhostBtn,
  ToolbarPrimaryBtn,
} from './styles';

type PageSize = 25 | 50 | 100;
type SortValue =
  | 'updated-desc'
  | 'updated-asc'
  | 'created-desc'
  | 'created-asc'
  | 'name-asc'
  | 'name-desc';
type RunStatus = 'SUCCESS' | 'FAILED' | 'RUNNING' | 'TERMINATED';
type RunGroup = {
  status: RunStatus;
  count: number;
  runs: ProjectLastRunSchema[];
};
type SelectedItem = { id: string; type: 'folder' | 'project' };
type DragProjectPayload = {
  type: 'project';
  id: string;
  folder_id?: string | null;
};
type OptimisticProjectMove = {
  projectId: string;
  fromFolderId: string | null;
  targetFolderId: string | null;
};

const PAGE_SIZE_OPTIONS: PageSize[] = [25, 50, 100];
const DEFAULT_PAGE_SIZE: PageSize = 25;
const PROJECTS_PATH_CACHE_KEY = 'dvt.projects.folderPath';

const sortOptions: { value: SortValue; label: string }[] = [
  { value: 'updated-desc', label: 'Обновлён ↓' },
  { value: 'updated-asc', label: 'Обновлён ↑' },
  { value: 'created-desc', label: 'Создан ↓' },
  { value: 'created-asc', label: 'Создан ↑' },
  { value: 'name-asc', label: 'Название А-Я' },
  { value: 'name-desc', label: 'Название Я-А' },
];

const STATUS_CONFIG: Record<
  RunStatus,
  { bg: string; bgHover: string; label: string }
> = {
  SUCCESS: { bg: '#10b981', bgHover: '#059669', label: 'SUCCESS' },
  FAILED: { bg: '#ef4444', bgHover: '#dc2626', label: 'FAILED' },
  RUNNING: { bg: '#6366f1', bgHover: '#4f46e5', label: 'RUNNING' },
  TERMINATED: { bg: '#9ca3af', bgHover: '#6b7280', label: 'TERMINATED' },
};

const selectedKey = (item: SelectedItem) => `${item.type}:${item.id}`;

const parseSelectedKey = (key: string): SelectedItem | null => {
  const [type, id] = key.split(':');
  if ((type !== 'folder' && type !== 'project') || !id) {
    return null;
  }
  return { type, id };
};

const normalizePageSize = (value: string | null): PageSize => {
  const size = Number(value);
  return PAGE_SIZE_OPTIONS.includes(size as PageSize)
    ? (size as PageSize)
    : DEFAULT_PAGE_SIZE;
};

const normalizePage = (value: string | null): number => {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
};

const buildPageRange = (
  current: number,
  total: number
): (number | 'ellipsis')[] => {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | 'ellipsis')[] = [1];
  if (current > 3) {
    pages.push('ellipsis');
  }

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  if (current < total - 2) {
    pages.push('ellipsis');
  }

  pages.push(total);
  return pages;
};

const formatProjectDate = (value: string | null | undefined): string => {
  if (!value) {
    return '-';
  }

  return new Date(value).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const getProjectInitial = (name: string | null | undefined): string => {
  const trimmedName = name?.trim();
  return trimmedName ? trimmedName[0].toUpperCase() : '?';
};

const formatProjectDateTooltip = (value: string | null | undefined): string => {
  if (!value) {
    return 'Дата недоступна';
  }

  return new Date(value).toLocaleString('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

const ITEM_INFO_TOOLTIP_SLOT_PROPS = {
  tooltip: {
    sx: {
      bgcolor: '#111827',
      borderRadius: '12px',
      boxShadow: '0 8px 24px rgba(15, 23, 42, 0.18)',
      color: '#ffffff',
      maxWidth: 320,
      p: 1,
      '& .MuiTypography-root': {
        lineHeight: 1.5,
      },
    },
  },
  arrow: {
    sx: {
      color: '#111827',
    },
  },
};

const ItemInfoTooltipContent: React.FC<{
  name: string;
  author: string;
  organizationName: string;
  createdAt: string | null | undefined;
  updatedAt: string | null | undefined;
}> = ({ name, author, organizationName, createdAt, updatedAt }) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      gap: 0.5,
      p: 0.5,
    }}
  >
    <Typography sx={{ fontSize: 12 }}>
      <b>Название:</b> {name}
    </Typography>
    <Typography sx={{ fontSize: 12 }}>
      <b>Автор:</b> {author}
    </Typography>
    <Typography sx={{ fontSize: 12 }}>
      <b>Организация:</b> {organizationName}
    </Typography>
    <Typography sx={{ fontSize: 12 }}>
      <b>Создан:</b> {formatProjectDateTooltip(createdAt)}
    </Typography>
    <Typography sx={{ fontSize: 12 }}>
      <b>Обновлён:</b> {formatProjectDateTooltip(updatedAt)}
    </Typography>
  </Box>
);

const toTimestamp = (value: string | null | undefined): number => {
  if (!value) {
    return Number.NEGATIVE_INFINITY;
  }
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? Number.NEGATIVE_INFINITY : timestamp;
};

const resolveRunTimestamp = (run: ProjectLastRunSchema): string =>
  run.started_at ?? run.queued_at;

const normalizeRunStatus = (
  status: TaskExecutionStatus | null | undefined
): RunStatus => {
  switch (status) {
    case 'SUCCESS':
      return 'SUCCESS';
    case 'ERROR':
      return 'FAILED';
    case 'CANCELLED':
    case 'CANCEL_REQUESTED':
      return 'TERMINATED';
    case 'QUEUED':
    case 'ASSIGNED':
    case 'PENDING':
    case 'STARTED':
    case 'RUNNING':
      return 'RUNNING';
    default:
      return 'TERMINATED';
  }
};

const sortRunsNewestFirst = (
  runs: ProjectLastRunSchema[] | null | undefined
): ProjectLastRunSchema[] =>
  [...(runs ?? [])].sort(
    (left, right) =>
      toTimestamp(resolveRunTimestamp(right)) -
      toTimestamp(resolveRunTimestamp(left))
  );

const groupRuns = (runs: ProjectLastRunSchema[]): RunGroup[] => {
  const groups: RunGroup[] = [];

  for (const run of runs) {
    const status = normalizeRunStatus(run.status);
    const lastGroup = groups[groups.length - 1];

    if (lastGroup && lastGroup.status === status) {
      lastGroup.count += 1;
      lastGroup.runs.push(run);
      continue;
    }

    groups.push({ status, count: 1, runs: [run] });
  }

  return groups;
};

const getDisplayRunGroups = (runs: ProjectLastRunSchema[] | null | undefined) =>
  groupRuns(sortRunsNewestFirst(runs)).slice(0, 10).reverse();

const formatDuration = (
  start: string | null | undefined,
  end: string | null | undefined,
  fallbackEndMs?: number
): string | null => {
  if (!start) {
    return null;
  }

  const startMs = new Date(start).getTime();
  if (Number.isNaN(startMs)) {
    return null;
  }

  const endMs =
    end == null
      ? fallbackEndMs
      : Number.isNaN(new Date(end).getTime())
        ? null
        : new Date(end).getTime();
  if (endMs == null) {
    return null;
  }

  const durationMs = endMs - startMs;
  if (durationMs < 0) {
    return null;
  }

  if (durationMs < 1000) {
    return `${durationMs}мс`;
  }

  if (durationMs < 60000) {
    return `${(durationMs / 1000).toFixed(1)}с`;
  }

  const minutes = Math.floor(durationMs / 60000);
  const seconds = Math.floor((durationMs % 60000) / 1000);

  return `${minutes}м ${seconds}с`;
};

const formatRunDateTime = (value: string | null | undefined): string => {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date
    .toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    .replace(',', '');
};

const getErrorStatus = (error: unknown): number | undefined => {
  if (isApiError(error)) {
    return error.payload.status;
  }

  return (error as { response?: { status?: number } })?.response?.status;
};

const showProjectError = (
  showAlert: ReturnType<typeof useAlert>['showAlert'],
  error: unknown,
  fallback: string
) => {
  const status = getErrorStatus(error);
  const message =
    status === 409
      ? 'Папка не пуста, сначала переместите содержимое'
      : status === 400
        ? 'Нельзя переместить папку внутрь самой себя'
        : ((isApiError(error) ? error.payload.message : undefined) ?? fallback);

  showAlert({
    type: 'error',
    message,
  });
};

const getOrganizationProjectsCount = (
  organization: OrganizationReadSchema
): number => organization.projects_count ?? 0;

const isOrganizationActive = (organization: OrganizationReadSchema): boolean =>
  organization.is_active !== false;

const selectOrganizationWithMostProjects = (
  organizations: OrganizationReadSchema[]
): string | null => {
  let nextOrganization: OrganizationReadSchema | null = null;

  for (const organization of organizations) {
    if (!organization.id) {
      continue;
    }

    if (
      nextOrganization == null ||
      getOrganizationProjectsCount(organization) >
        getOrganizationProjectsCount(nextOrganization)
    ) {
      nextOrganization = organization;
    }
  }

  return nextOrganization?.id ?? null;
};

const FolderSvg: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='1.8'
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <path d='M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z' />
  </svg>
);

const FolderPlusSvg = () => (
  <svg
    width='14'
    height='14'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <path d='M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z' />
    <path d='M12 10v6M9 13h6' />
  </svg>
);

const HomeSvg: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <path d='M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' />
  </svg>
);

const ChevronRightSvg = () => (
  <svg
    width='14'
    height='14'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <path d='m9 18 6-6-6-6' />
  </svg>
);

const ChevronLeftSvg = () => (
  <svg
    width='14'
    height='14'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <path d='m15 18-6-6 6-6' />
  </svg>
);

const ChevronDownSvg = () => (
  <svg
    width='14'
    height='14'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <path d='m6 9 6 6 6-6' />
  </svg>
);

const SortSvg = () => (
  <svg
    width='13'
    height='13'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <path d='m21 16-4 4-4-4M17 20V4M3 8l4-4 4 4M7 4v16' />
  </svg>
);

const PlusSvg = () => (
  <svg
    width='14'
    height='14'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2.2'
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <path d='M12 5v14M5 12h14' />
  </svg>
);

const MoreVertSvg = () => (
  <svg
    width='14'
    height='14'
    viewBox='0 0 24 24'
    fill='none'
    stroke='currentColor'
    strokeWidth='2'
    strokeLinecap='round'
    strokeLinejoin='round'
  >
    <circle cx='12' cy='5' r='1.5' />
    <circle cx='12' cy='12' r='1.5' />
    <circle cx='12' cy='19' r='1.5' />
  </svg>
);

const useProjectsItems = (
  enabled: boolean,
  folderId: string | null,
  organizationId: string | null,
  page: number,
  pageSize: PageSize
) => {
  const [data, setData] = useState<ProjectItemsPageSchema | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    projectsApi
      .getItems({
        folderId,
        organizationId,
        limit: pageSize,
        offset: (page - 1) * pageSize,
        includeLastRuns: true,
      })
      .then(response => {
        if (!cancelled) {
          setData(response);
        }
      })
      .catch(nextError => {
        if (!cancelled) {
          setError(nextError);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, folderId, organizationId, page, pageSize, version]);

  const refresh = useCallback(() => {
    setVersion(current => current + 1);
  }, []);

  return {
    items: data?.items ?? [],
    total: data?.total ?? 0,
    pageCount: Math.max(1, Math.ceil((data?.total ?? 0) / pageSize)),
    isLoading,
    error,
    refresh,
  };
};

const useProjectSearch = (
  enabled: boolean,
  name: string,
  organizationId: string | null,
  page: number,
  pageSize: PageSize
) => {
  const [data, setData] = useState<ProjectSearchPageSchema | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const trimmedName = name.trim();

    if (!enabled || !trimmedName) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    const timeoutId = window.setTimeout(() => {
      setIsLoading(true);
      setError(null);

      projectsApi
        .search({
          name: trimmedName,
          organizationId,
          itemType: 'all',
          limit: pageSize,
          offset: (page - 1) * pageSize,
          includeLastRuns: true,
        })
        .then(response => {
          if (!cancelled) {
            setData(response);
          }
        })
        .catch(nextError => {
          if (!cancelled) {
            setError(nextError);
          }
        })
        .finally(() => {
          if (!cancelled) {
            setIsLoading(false);
          }
        });
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [enabled, name, organizationId, page, pageSize, version]);

  const refresh = useCallback(() => {
    setVersion(current => current + 1);
  }, []);

  return {
    items: data?.items ?? [],
    total: data?.total ?? 0,
    pageCount: Math.max(1, Math.ceil((data?.total ?? 0) / pageSize)),
    isLoading,
    error,
    refresh,
  };
};

const readCachedPath = (): ProjectFolderReadSchema[] => {
  try {
    const raw = window.sessionStorage.getItem(PROJECTS_PATH_CACHE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeCachedPath = (path: ProjectFolderReadSchema[]) => {
  try {
    window.sessionStorage.setItem(
      PROJECTS_PATH_CACHE_KEY,
      JSON.stringify(path)
    );
  } catch {
    // Session storage can be unavailable in privacy modes.
  }
};

const RunHistoryRow: React.FC<{
  runs: ProjectLastRunSchema[] | null | undefined;
  onOpen: (group: RunGroup) => void;
}> = ({ runs, onOpen }) => {
  const groups = getDisplayRunGroups(runs);

  if (groups.length === 0) {
    return (
      <Tooltip title='Нет запусков' arrow placement='top'>
        <RunCirclePlaceholder aria-label='Проект не запускался' />
      </Tooltip>
    );
  }

  return (
    <RunCirclesRow>
      {groups.map((group, index) => {
        const statusConfig = STATUS_CONFIG[group.status];
        return (
          <RunCircleSm
            key={`${group.status}-${index}`}
            type='button'
            statusColor={statusConfig.bg}
            statusColorHover={statusConfig.bgHover}
            isRunning={group.status === 'RUNNING'}
            onClick={event => {
              event.stopPropagation();
              onOpen(group);
            }}
            aria-label={`Run details: ${statusConfig.label}`}
          >
            {group.count > 1 ? group.count : null}
          </RunCircleSm>
        );
      })}
    </RunCirclesRow>
  );
};

const RunDetailsDialog: React.FC<{
  group: RunGroup | null;
  onClose: () => void;
  openedAtMs: number | null;
}> = ({ group, onClose, openedAtMs }) => {
  if (!group) {
    return null;
  }

  const statusConfig = STATUS_CONFIG[group.status];

  return (
    <Dialog
      open={Boolean(group)}
      onClose={onClose}
      fullWidth
      PaperProps={{
        sx: {
          width: '100%',
          maxWidth: 480,
          borderRadius: '16px',
          bgcolor: '#ffffff',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.15)',
          overflow: 'hidden',
          m: 2.5,
        },
      }}
      BackdropProps={{
        sx: {
          bgcolor: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(4px)',
        },
      }}
    >
      <Box>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1.5,
            px: 2.5,
            py: 2,
            borderBottom: '1px solid #f3f4f6',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Box
              component='span'
              sx={{
                px: 1.25,
                py: 0.5,
                borderRadius: '8px',
                bgcolor: statusConfig.bg,
                color: '#ffffff',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 0.4,
                lineHeight: 1.3,
                textTransform: 'uppercase',
                flexShrink: 0,
              }}
            >
              {statusConfig.label}
            </Box>
            {group.count > 1 ? (
              <Typography
                sx={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}
              >
                × {group.count} подряд
              </Typography>
            ) : null}
          </Box>
          <RowActionButton type='button' onClick={onClose} aria-label='Закрыть'>
            <CloseIcon />
          </RowActionButton>
        </Box>

        <Box
          sx={{
            maxHeight: 400,
            overflowY: 'auto',
            p: 1.5,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
          }}
        >
          {group.runs.map(run => {
            const runStatus = normalizeRunStatus(run.status);
            const duration = formatDuration(
              run.started_at ?? run.queued_at,
              run.finished_at,
              openedAtMs ?? undefined
            );

            return (
              <Box
                key={run.task_id}
                sx={{
                  p: 1.5,
                  bgcolor: '#f9fafb',
                  border: '1px solid #f3f4f6',
                  borderRadius: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.75,
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <Typography
                    title={run.task_id}
                    sx={{
                      minWidth: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#6b7280',
                      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                    }}
                  >
                    {run.task_id}
                  </Typography>
                  {duration ? (
                    <Typography
                      sx={{
                        flexShrink: 0,
                        fontSize: 11,
                        color: '#059669',
                        fontWeight: 600,
                        fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                      }}
                    >
                      {duration}
                    </Typography>
                  ) : null}
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    gap: 1.5,
                    fontSize: 11,
                    color: '#6b7280',
                    flexWrap: 'wrap',
                  }}
                >
                  <Box>
                    <Box sx={{ color: '#9ca3af', mb: 0.25 }}>Started:</Box>
                    <Box sx={{ color: '#111827', fontWeight: 500 }}>
                      {formatRunDateTime(run.started_at ?? run.queued_at)}
                    </Box>
                  </Box>
                  <Box>
                    <Box sx={{ color: '#9ca3af', mb: 0.25 }}>Finished:</Box>
                    <Box sx={{ color: '#111827', fontWeight: 500 }}>
                      {formatRunDateTime(run.finished_at)}
                    </Box>
                  </Box>
                </Box>

                {runStatus === 'FAILED' && run.message ? (
                  <Box
                    sx={{
                      mt: 0.5,
                      p: 1,
                      bgcolor: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: '8px',
                      fontSize: 11,
                      color: '#dc2626',
                      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                      lineHeight: 1.5,
                      wordBreak: 'break-word',
                    }}
                  >
                    {run.message}
                  </Box>
                ) : null}

                {runStatus === 'TERMINATED' && run.termination_reason ? (
                  <Box sx={{ fontSize: 11, color: '#9ca3af' }}>
                    Reason:{' '}
                    <Box
                      component='span'
                      sx={{ color: '#6b7280', fontWeight: 500 }}
                    >
                      {run.termination_reason}
                    </Box>
                  </Box>
                ) : null}
              </Box>
            );
          })}
        </Box>
      </Box>
    </Dialog>
  );
};

export const UsersProjects: React.FC = () => {
  const {
    createNewProject,
    duplicateProject,
    removeProject,
    removeProjects,
    updateProjectName,
    moveProjectToFolder,
    createFolder,
    updateFolder,
    removeFolder,
  } = useProjects();
  const { user: currentUser } = useCurrentUser();
  const {
    organizations,
    organizationsError,
    organizationsLoading,
    loadOrganizations,
  } = useOrganizations();
  const { confirm } = useConfirmDialog();
  const { showAlert } = useAlert();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentUserRole = normalizeRole(currentUser?.role);
  const isSuperadmin = currentUserRole === 'superadmin';
  const canViewAuthor =
    currentUserRole === 'admin' || currentUserRole === 'superadmin';
  const canViewOrganization = isSuperadmin;

  const folderId = searchParams.get('folder');
  const organizationIdParam = searchParams.get('organization_id');
  const page = normalizePage(searchParams.get('page'));
  const pageSize = normalizePageSize(searchParams.get('size'));
  const activeOrganizations = useMemo(
    () => organizations.filter(isOrganizationActive),
    [organizations]
  );
  const activeOrganizationIds = useMemo(
    () => new Set(activeOrganizations.map(organization => organization.id)),
    [activeOrganizations]
  );

  const [selectedViewOrganizationId, setSelectedViewOrganizationId] = useState<
    string | null
  >(null);
  const defaultViewOrganizationId = useMemo(
    () => selectOrganizationWithMostProjects(activeOrganizations),
    [activeOrganizations]
  );
  const resolvedOrganizationIdFromUrl = isSuperadmin
    ? organizationIdParam && activeOrganizationIds.has(organizationIdParam)
      ? organizationIdParam
      : null
    : null;
  const effectiveOrganizationId = isSuperadmin
    ? (resolvedOrganizationIdFromUrl ??
      selectedViewOrganizationId ??
      defaultViewOrganizationId)
    : null;
  const shouldLoadProjectsItems =
    !isSuperadmin || effectiveOrganizationId != null;
  const canManageProjects =
    !isSuperadmin || currentUser?.organization_id === effectiveOrganizationId;
  const createActionsDisabled = isSuperadmin && !canManageProjects;
  const createActionsDisabledTitle = createActionsDisabled
    ? 'Недоступно при просмотре другой организации'
    : undefined;

  const {
    items,
    total: itemsTotal,
    pageCount: itemsPageCount,
    isLoading: isItemsLoading,
    error: itemsError,
    refresh: refreshItems,
  } = useProjectsItems(
    shouldLoadProjectsItems,
    folderId,
    effectiveOrganizationId,
    page,
    pageSize
  );

  const [openModal, setOpenModal] = useState(false);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [renameProjectOpen, setRenameProjectOpen] = useState(false);
  const [renameProjectId, setRenameProjectId] = useState<string | null>(null);
  const [renameProjectName, setRenameProjectName] = useState('');
  const [renameFolderOpen, setRenameFolderOpen] = useState(false);
  const [renameFolder, setRenameFolder] =
    useState<ProjectFolderReadSchema | null>(null);
  const [search, setSearch] = useState('');
  const [sortValue, setSortValue] = useState<SortValue>('updated-desc');
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);
  const [pageSizeOpen, setPageSizeOpen] = useState(false);
  const pageSizeControlRef = useRef<HTMLDivElement | null>(null);
  const [actionsAnchorEl, setActionsAnchorEl] = useState<null | HTMLElement>(
    null
  );
  const [actionsProject, setActionsProject] =
    useState<ProjectReadSchema | null>(null);
  const [folderActionsAnchorEl, setFolderActionsAnchorEl] =
    useState<null | HTMLElement>(null);
  const [actionsFolder, setActionsFolder] =
    useState<ProjectFolderReadSchema | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const [dragOverBreadcrumbId, setDragOverBreadcrumbId] = useState<
    string | null
  >(null);
  const [draggedProject, setDraggedProject] =
    useState<DragProjectPayload | null>(null);
  const [optimisticProjectMoves, setOptimisticProjectMoves] = useState<
    OptimisticProjectMove[]
  >([]);
  const [folderPath, setFolderPath] =
    useState<ProjectFolderReadSchema[]>(readCachedPath);
  const [runDetailsGroup, setRunDetailsGroup] = useState<RunGroup | null>(null);
  const [runDetailsOpenedAtMs, setRunDetailsOpenedAtMs] = useState<
    number | null
  >(null);

  const trimmedSearch = search.trim();
  const [isGlobalSearch, setIsGlobalSearch] = useState(false);
  const isGlobalSearchEnabled =
    isGlobalSearch && (!isSuperadmin || effectiveOrganizationId != null);
  const {
    items: searchItems,
    total: searchTotal,
    pageCount: searchPageCount,
    isLoading: isSearchLoading,
    error: searchError,
    refresh: refreshSearch,
  } = useProjectSearch(
    isGlobalSearchEnabled,
    trimmedSearch,
    isSuperadmin ? effectiveOrganizationId : null,
    page,
    pageSize
  );
  const sourceItems = useMemo<ProjectFolderItemSchema[]>(
    () => (isGlobalSearch ? searchItems : items),
    [isGlobalSearch, items, searchItems]
  );
  const total = isGlobalSearch ? searchTotal : itemsTotal;
  const pageCount = isGlobalSearch ? searchPageCount : itemsPageCount;
  const isOrganizationSelectionLoading =
    isSuperadmin && organizationsLoading && effectiveOrganizationId == null;
  const isLoading =
    isOrganizationSelectionLoading ||
    (isGlobalSearch ? isSearchLoading : isItemsLoading);

  const refreshVisibleData = useCallback(() => {
    refreshItems();
    refreshSearch();
  }, [refreshItems, refreshSearch]);

  useEffect(() => {
    setOptimisticProjectMoves(prevMoves =>
      prevMoves.filter(move =>
        sourceItems.some(item => {
          const project = item.project;
          return (
            project?.id === move.projectId &&
            (project.folder_id ?? null) === move.fromFolderId
          );
        })
      )
    );
  }, [sourceItems]);

  useEffect(() => {
    if (!pageSizeOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!pageSizeControlRef.current?.contains(event.target as Node)) {
        setPageSizeOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [pageSizeOpen]);

  useEffect(() => {
    if (!isSuperadmin) {
      return;
    }

    void loadOrganizations();
  }, [isSuperadmin, loadOrganizations]);

  useEffect(() => {
    if (!isSuperadmin) {
      setSelectedViewOrganizationId(null);
      return;
    }

    setSelectedViewOrganizationId(current => {
      if (
        organizationIdParam &&
        activeOrganizationIds.has(organizationIdParam)
      ) {
        return organizationIdParam;
      }

      if (current && activeOrganizationIds.has(current)) {
        return current;
      }

      return defaultViewOrganizationId;
    });
  }, [
    defaultViewOrganizationId,
    activeOrganizationIds,
    isSuperadmin,
    organizationIdParam,
  ]);

  useEffect(() => {
    if (!organizationsError) {
      return;
    }

    showProjectError(
      showAlert,
      organizationsError,
      'Не удалось загрузить организации'
    );
  }, [organizationsError, showAlert]);

  useEffect(() => {
    if (!itemsError) {
      return;
    }

    showProjectError(showAlert, itemsError, 'Не удалось загрузить проекты');
  }, [itemsError, showAlert]);

  useEffect(() => {
    if (!searchError) {
      return;
    }

    const status = getErrorStatus(searchError);
    showProjectError(
      showAlert,
      searchError,
      status === 422
        ? 'Введите непустой текст для полного поиска'
        : 'Не удалось выполнить полный поиск'
    );
  }, [searchError, showAlert]);

  useEffect(() => {
    if (!trimmedSearch && isGlobalSearch) {
      setIsGlobalSearch(false);
    }
  }, [isGlobalSearch, trimmedSearch]);

  useEffect(() => {
    const folders = items
      .filter(
        (
          item
        ): item is ProjectFolderItemSchema & {
          folder: ProjectFolderReadSchema;
        } => item.type === 'folder' && item.folder != null
      )
      .map(item => item.folder);

    setFolderPath(prevPath => {
      const cache = new Map(prevPath.map(folder => [folder.id, folder]));
      folders.forEach(folder => cache.set(folder.id, folder));

      if (!folderId) {
        const nextPath: ProjectFolderReadSchema[] = [];
        writeCachedPath(nextPath);
        return nextPath;
      }

      const currentPath = prevPath.filter(folder => folder.id !== folderId);
      const currentFolder = cache.get(folderId);
      const nextPath = currentFolder
        ? [...currentPath, currentFolder]
        : currentPath.length > 0
          ? currentPath
          : [
              {
                id: folderId,
                name: 'Текущая папка',
                parent_id: null,
                user_id: '',
                organization_id: '',
                is_deleted: false,
                created_at: '',
                updated_at: '',
              },
            ];

      writeCachedPath(nextPath);
      return nextPath;
    });
  }, [folderId, items]);

  const organizationsMap = useMemo(() => {
    const map = new Map<string, string>();

    organizations.forEach(organization => {
      if (organization.id) {
        map.set(organization.id, organization.name);
      }
    });

    return map;
  }, [organizations]);

  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filteredItems = sourceItems.filter(item => {
      const folder = item.folder;
      const project = item.project;
      const name = folder?.name ?? project?.name ?? '';

      if (query && !name.toLowerCase().includes(query)) {
        return false;
      }

      if (
        project?.id &&
        optimisticProjectMoves.some(
          move =>
            move.projectId === project.id &&
            (project.folder_id ?? null) === move.fromFolderId
        )
      ) {
        return false;
      }

      return true;
    });

    const getItemName = (item: ProjectFolderItemSchema) =>
      item.folder?.name ?? item.project?.name ?? '';
    const getItemCreated = (item: ProjectFolderItemSchema) =>
      item.folder?.created_at ?? item.project?.created_at ?? '';
    const getItemUpdated = (item: ProjectFolderItemSchema) =>
      item.folder?.updated_at ??
      item.project?.updated_at ??
      item.project?.created_at ??
      '';

    return [...filteredItems].sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }

      switch (sortValue) {
        case 'name-asc':
          return getItemName(a).localeCompare(getItemName(b), 'ru', {
            sensitivity: 'base',
          });
        case 'name-desc':
          return getItemName(b).localeCompare(getItemName(a), 'ru', {
            sensitivity: 'base',
          });
        case 'created-asc':
          return getItemCreated(a).localeCompare(getItemCreated(b));
        case 'created-desc':
          return getItemCreated(b).localeCompare(getItemCreated(a));
        case 'updated-asc':
          return getItemUpdated(a).localeCompare(getItemUpdated(b));
        case 'updated-desc':
        default:
          return getItemUpdated(b).localeCompare(getItemUpdated(a));
      }
    });
  }, [optimisticProjectMoves, search, sourceItems, sortValue]);

  const folderItems = useMemo(
    () =>
      visibleItems
        .filter(item => item.type === 'folder' && item.folder)
        .map(item => item.folder as ProjectFolderReadSchema),
    [visibleItems]
  );

  const projectItems = useMemo(
    () =>
      visibleItems
        .filter(item => item.type === 'project' && item.project)
        .map(item => item.project as ProjectReadSchema),
    [visibleItems]
  );

  const hasSelection = selectedKeys.length > 0;
  const currentSortLabel =
    sortOptions.find(option => option.value === sortValue)?.label ??
    'Обновлён ↓';
  const fromItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const toItem = Math.min(total, (page - 1) * pageSize + visibleItems.length);

  const updateUrl = useCallback(
    ({
      nextFolderId = folderId,
      nextOrganizationId = effectiveOrganizationId,
      nextPage = page,
      nextPageSize = pageSize,
    }: {
      nextFolderId?: string | null;
      nextOrganizationId?: string | null;
      nextPage?: number;
      nextPageSize?: PageSize;
    }) => {
      const params = new URLSearchParams();
      if (nextFolderId) {
        params.set('folder', nextFolderId);
      }
      if (isSuperadmin && nextOrganizationId) {
        params.set('organization_id', nextOrganizationId);
      }
      if (nextPage > 1) {
        params.set('page', String(nextPage));
      }
      params.set('size', String(nextPageSize));
      setSearchParams(params);
    },
    [
      effectiveOrganizationId,
      folderId,
      isSuperadmin,
      page,
      pageSize,
      setSearchParams,
    ]
  );

  const handleSelectOrganization = useCallback(
    (organizationId: string) => {
      if (organizationId === effectiveOrganizationId) {
        return;
      }

      setSelectedViewOrganizationId(organizationId);
      setSelectedKeys([]);
      setFolderPath([]);
      writeCachedPath([]);
      updateUrl({
        nextFolderId: null,
        nextPage: 1,
        nextOrganizationId: organizationId,
      });
    },
    [effectiveOrganizationId, updateUrl]
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value);
      if (isGlobalSearch) {
        setIsGlobalSearch(false);
        setSelectedKeys([]);
        if (page !== 1) {
          updateUrl({ nextPage: 1 });
        }
      }
    },
    [isGlobalSearch, page, updateUrl]
  );

  const handleClearSearch = useCallback(() => {
    setSearch('');
    setIsGlobalSearch(false);
    setSelectedKeys([]);
  }, []);

  const handleToggleGlobalSearch = useCallback(() => {
    if (isGlobalSearch) {
      setIsGlobalSearch(false);
      setSelectedKeys([]);
      return;
    }

    if (!trimmedSearch) {
      return;
    }

    setIsGlobalSearch(true);
    setSelectedKeys([]);
    if (page !== 1) {
      updateUrl({ nextPage: 1 });
    }
  }, [isGlobalSearch, page, trimmedSearch, updateUrl]);

  const navigateToFolder = useCallback(
    (nextFolderId: string | null, folder?: ProjectFolderReadSchema) => {
      if (folder) {
        setFolderPath(prevPath => {
          const existingIndex = prevPath.findIndex(
            item => item.id === folder.id
          );
          const nextPath =
            existingIndex >= 0
              ? prevPath.slice(0, existingIndex + 1)
              : [...prevPath, folder];
          writeCachedPath(nextPath);
          return nextPath;
        });
      }

      updateUrl({ nextFolderId, nextPage: 1 });
      setIsGlobalSearch(false);
      setSelectedKeys([]);
    },
    [updateUrl]
  );

  const handleCreateProject = async (projectData: ProjectCreateSchema) => {
    if (projectData.name.trim() === '') {
      return;
    }

    const createdProject = await createNewProject({
      ...projectData,
      folder_id: folderId,
    }).unwrap();
    setOpenModal(false);
    window.location.assign(`/project-editor/${createdProject.id}`);
  };

  const handleCreateFolder = async (name: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setCreateFolderOpen(false);
      return;
    }

    try {
      await createFolder({ name: trimmedName, parent_id: folderId });
      setCreateFolderOpen(false);
      refreshVisibleData();
    } catch (nextError) {
      showProjectError(showAlert, nextError, 'Не удалось создать папку');
    }
  };

  const handleOpenProject = useCallback((projectId: string) => {
    window.location.assign(`/project-editor/${projectId}`);
  }, []);

  const toggleSelection = useCallback((item: SelectedItem) => {
    const key = selectedKey(item);
    setSelectedKeys(prevSelected =>
      prevSelected.includes(key)
        ? prevSelected.filter(selected => selected !== key)
        : [...prevSelected, key]
    );
  }, []);

  const handleToggleSelect =
    (item: SelectedItem) => (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      toggleSelection(item);
    };

  const handleBulkDelete = async () => {
    if (selectedKeys.length === 0) {
      return;
    }

    const selectedItems = selectedKeys
      .map(parseSelectedKey)
      .filter((item): item is SelectedItem => item != null);
    const projectIds = selectedItems
      .filter(item => item.type === 'project')
      .map(item => item.id);
    const isConfirmed = await confirm({
      title: 'Удалить выбранное',
      message: `Вы точно хотите удалить ${selectedItems.length} выбранных элемент(ов)? Это действие необратимо.`,
      confirmLabel: 'Удалить',
      cancelLabel: 'Отмена',
      confirmColor: 'error',
      maxWidth: 'xs',
    });

    if (!isConfirmed) {
      return;
    }

    try {
      if (projectIds.length > 0) {
        await removeProjects(projectIds).unwrap();
      }

      setSelectedKeys([]);
      refreshVisibleData();
    } catch (nextError) {
      showProjectError(showAlert, nextError, 'Не удалось удалить выбранное');
      refreshVisibleData();
    }
  };

  const handleActionsMenuOpen =
    (project: ProjectReadSchema) =>
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      setActionsAnchorEl(event.currentTarget);
      setActionsProject(project);
    };

  const handleActionsMenuClose = () => {
    setActionsAnchorEl(null);
    setActionsProject(null);
  };

  const handleFolderActionsMenuOpen =
    (folder: ProjectFolderReadSchema) =>
    (event: React.MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      setFolderActionsAnchorEl(event.currentTarget);
      setActionsFolder(folder);
    };

  const handleFolderActionsMenuClose = () => {
    setFolderActionsAnchorEl(null);
    setActionsFolder(null);
  };

  const handleOpenRenameDialog = (projectId: string, projectName: string) => {
    setRenameProjectId(projectId);
    setRenameProjectName(projectName);
    setRenameProjectOpen(true);
  };

  const handleCloseRenameDialog = () => {
    setRenameProjectOpen(false);
    setRenameProjectId(null);
    setRenameProjectName('');
  };

  const handleConfirmRename = async (newName: string) => {
    if (!renameProjectId) {
      return;
    }

    const trimmedName = newName.trim();
    if (!trimmedName || trimmedName === renameProjectName.trim()) {
      handleCloseRenameDialog();
      return;
    }

    await updateProjectName(renameProjectId, trimmedName);
    refreshVisibleData();
    handleCloseRenameDialog();
  };

  const handleRenameFromMenu = () => {
    if (!actionsProject) {
      return;
    }

    handleOpenRenameDialog(actionsProject.id, actionsProject.name);
    handleActionsMenuClose();
  };

  const handleDuplicateFromMenu = async () => {
    if (!actionsProject) {
      return;
    }

    const projectId = actionsProject.id;
    handleActionsMenuClose();
    await duplicateProject(projectId);
    refreshVisibleData();
  };

  const handleDeleteProject = async (
    projectId: string,
    projectName: string
  ) => {
    const isConfirmed = await confirm({
      title: 'Удалить проект',
      message: `Вы точно хотите удалить проект "${projectName}"? Это действие необратимо.`,
      confirmLabel: 'Удалить',
      cancelLabel: 'Отмена',
      confirmColor: 'error',
      maxWidth: 'xs',
    });

    if (isConfirmed) {
      await removeProject(projectId);
      refreshVisibleData();
    }
  };

  const handleDeleteFromMenu = async () => {
    if (!actionsProject) {
      return;
    }

    const projectId = actionsProject.id;
    const projectName = actionsProject.name;
    handleActionsMenuClose();
    await handleDeleteProject(projectId, projectName);
  };

  const handleRenameFolderFromMenu = () => {
    if (!actionsFolder) {
      return;
    }
    setRenameFolder(actionsFolder);
    setRenameFolderOpen(true);
    handleFolderActionsMenuClose();
  };

  const handleConfirmRenameFolder = async (newName: string) => {
    if (!renameFolder) {
      return;
    }

    const trimmedName = newName.trim();
    if (!trimmedName || trimmedName === renameFolder.name.trim()) {
      setRenameFolderOpen(false);
      setRenameFolder(null);
      return;
    }

    try {
      await updateFolder(renameFolder.id, { name: trimmedName });
      refreshVisibleData();
      setFolderPath(prevPath => {
        const nextPath = prevPath.map(folder =>
          folder.id === renameFolder.id
            ? { ...folder, name: trimmedName }
            : folder
        );
        writeCachedPath(nextPath);
        return nextPath;
      });
    } catch (nextError) {
      showProjectError(showAlert, nextError, 'Не удалось переименовать папку');
    } finally {
      setRenameFolderOpen(false);
      setRenameFolder(null);
    }
  };

  const handleDeleteFolderFromMenu = async () => {
    if (!actionsFolder) {
      return;
    }

    const folder = actionsFolder;
    handleFolderActionsMenuClose();
    const isConfirmed = await confirm({
      title: 'Удалить папку',
      message: `Вы точно хотите удалить папку "${folder.name}"? Папка должна быть пустой.`,
      confirmLabel: 'Удалить',
      cancelLabel: 'Отмена',
      confirmColor: 'error',
      maxWidth: 'xs',
    });

    if (!isConfirmed) {
      return;
    }

    try {
      await removeFolder(folder.id);
      if (folder.id === folderId) {
        navigateToFolder(null);
      } else {
        refreshVisibleData();
      }
    } catch (nextError) {
      showProjectError(showAlert, nextError, 'Не удалось удалить папку');
    }
  };

  const parseDragPayload = (
    event: React.DragEvent
  ): DragProjectPayload | null => {
    try {
      const raw = event.dataTransfer.getData('application/dvt-item');
      if (!raw) {
        return null;
      }
      const payload = JSON.parse(raw) as DragProjectPayload;
      return payload.type === 'project' && payload.id ? payload : null;
    } catch {
      return null;
    }
  };

  const getActiveDragProject = (event: React.DragEvent) =>
    parseDragPayload(event) ?? draggedProject;

  const canDropProjectToFolder = (
    payload: DragProjectPayload | null,
    targetFolderId: string | null
  ) => Boolean(payload && (payload.folder_id ?? null) !== targetFolderId);

  const handleProjectDragStart =
    (project: ProjectReadSchema) => (event: React.DragEvent) => {
      const payload: DragProjectPayload = {
        type: 'project',
        id: project.id,
        folder_id: project.folder_id ?? null,
      };

      setDraggedProject(payload);
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData(
        'application/dvt-item',
        JSON.stringify(payload)
      );
      event.dataTransfer.setData('text/plain', project.name);
    };

  const handleProjectDragEnd = () => {
    setDraggedProject(null);
    setDragOverFolderId(null);
    setDragOverBreadcrumbId(null);
  };

  const handleFolderDragLeave = (
    event: React.DragEvent,
    folderIdToLeave: string
  ) => {
    const nextTarget = event.relatedTarget as Node | null;
    if (nextTarget && event.currentTarget.contains(nextTarget)) {
      return;
    }

    setDragOverFolderId(current =>
      current === folderIdToLeave ? null : current
    );
  };

  const moveProject = async (
    projectId: string,
    fromFolderId: string | null,
    nextFolderId: string | null
  ) => {
    setOptimisticProjectMoves(prev => [
      ...prev.filter(move => move.projectId !== projectId),
      {
        projectId,
        fromFolderId,
        targetFolderId: nextFolderId,
      },
    ]);

    try {
      await moveProjectToFolder(projectId, nextFolderId).unwrap();
      refreshVisibleData();
    } catch (nextError) {
      setOptimisticProjectMoves(prev =>
        prev.filter(move => move.projectId !== projectId)
      );
      showProjectError(showAlert, nextError, 'Не удалось переместить проект');
    }
  };

  const handleDropProjectToFolder =
    (targetFolderId: string | null) => async (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      setDragOverFolderId(null);
      setDragOverBreadcrumbId(null);
      const payload = getActiveDragProject(event);
      setDraggedProject(null);

      if (!payload || !canDropProjectToFolder(payload, targetFolderId)) {
        return;
      }

      await moveProject(payload.id, payload.folder_id ?? null, targetFolderId);
    };

  const handleOpenRunGroup = (group: RunGroup) => {
    setRunDetailsGroup(group);
    setRunDetailsOpenedAtMs(Date.now());
  };

  const handleCloseRunGroup = () => {
    setRunDetailsGroup(null);
    setRunDetailsOpenedAtMs(null);
  };

  return (
    <Container
      maxWidth='xl'
      sx={{
        mt: 2,
        mb: 0,
        height: 'calc(100vh - 128px)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <ProjectsPageShell>
        <ProjectsPageRoot>
          {canViewOrganization ? (
            <OrganizationSwitcherBar
              organizations={activeOrganizations}
              selectedOrganizationId={effectiveOrganizationId}
              onSelectOrganization={handleSelectOrganization}
            />
          ) : null}

          <ToolbarContainer>
            <ProjectsSearch
              value={search}
              scope={isGlobalSearch ? 'global' : 'local'}
              onChange={handleSearchChange}
              onGlobalSearch={handleToggleGlobalSearch}
              onClear={handleClearSearch}
            />

            <ToolbarDropdownBtn
              type='button'
              isActive={sortValue !== 'updated-desc'}
              onClick={event => setSortAnchorEl(event.currentTarget)}
            >
              <SortSvg />
              {currentSortLabel}
              <ChevronDownSvg />
            </ToolbarDropdownBtn>

            <ActionGate
              disabled={createActionsDisabled}
              title={createActionsDisabledTitle}
              style={{ marginLeft: 'auto' }}
            >
              <ToolbarGhostBtn
                type='button'
                disabled={createActionsDisabled}
                onClick={() => setCreateFolderOpen(true)}
              >
                <FolderPlusSvg />
                Новая папка
              </ToolbarGhostBtn>
            </ActionGate>

            <ActionGate
              disabled={createActionsDisabled}
              title={createActionsDisabledTitle}
            >
              <ToolbarPrimaryBtn
                type='button'
                data-testid='features/projects/users-projects/project-create-button'
                disabled={createActionsDisabled}
                onClick={() => setOpenModal(true)}
              >
                <PlusSvg />
                Создать проект
              </ToolbarPrimaryBtn>
            </ActionGate>
          </ToolbarContainer>

          <Menu
            anchorEl={sortAnchorEl}
            open={Boolean(sortAnchorEl)}
            onClose={() => setSortAnchorEl(null)}
            MenuListProps={{ disablePadding: true }}
            slotProps={{
              paper: {
                elevation: 0,
                sx: {
                  mt: 1,
                  borderRadius: 2,
                  minWidth: 220,
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)',
                  overflow: 'hidden',
                },
              },
            }}
          >
            {sortOptions.map(option => (
              <MenuItem
                key={option.value}
                onClick={() => {
                  setSortValue(option.value);
                  setSortAnchorEl(null);
                }}
                sx={{ fontSize: 13, gap: 1.5, minWidth: 220 }}
              >
                <Box sx={{ width: 18 }}>
                  {sortValue === option.value ? (
                    <CheckIcon sx={{ fontSize: 16 }} />
                  ) : null}
                </Box>
                {option.label}
              </MenuItem>
            ))}
          </Menu>

          <ContentHeader>
            <BreadcrumbNav aria-label='Path'>
              <BreadcrumbButton
                type='button'
                isLast={!folderId}
                aria-current={!folderId ? 'page' : undefined}
                onClick={() => navigateToFolder(null)}
                onDragOver={event => {
                  const payload = getActiveDragProject(event);
                  if (canDropProjectToFolder(payload, null)) {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = 'move';
                    setDragOverBreadcrumbId('root');
                  }
                }}
                onDragLeave={() => setDragOverBreadcrumbId(null)}
                onDrop={handleDropProjectToFolder(null)}
                aria-dropeffect='move'
                style={{
                  outline:
                    dragOverBreadcrumbId === 'root'
                      ? '1.5px dashed #6366f1'
                      : undefined,
                }}
              >
                <HomeSvg />
                Все проекты
              </BreadcrumbButton>

              {folderPath.map((folder, index) => {
                const isLast = index === folderPath.length - 1;
                return (
                  <React.Fragment key={folder.id}>
                    <BreadcrumbSeparator>/</BreadcrumbSeparator>
                    <BreadcrumbButton
                      type='button'
                      isLast={isLast}
                      aria-current={isLast ? 'page' : undefined}
                      onClick={() => navigateToFolder(folder.id, folder)}
                      onDragOver={event => {
                        const payload = getActiveDragProject(event);
                        if (canDropProjectToFolder(payload, folder.id)) {
                          event.preventDefault();
                          event.dataTransfer.dropEffect = 'move';
                          setDragOverBreadcrumbId(folder.id);
                        }
                      }}
                      onDragLeave={() => setDragOverBreadcrumbId(null)}
                      onDrop={handleDropProjectToFolder(folder.id)}
                      aria-dropeffect='move'
                      style={{
                        outline:
                          dragOverBreadcrumbId === folder.id
                            ? '1.5px dashed #6366f1'
                            : undefined,
                      }}
                    >
                      {folder.name}
                    </BreadcrumbButton>
                  </React.Fragment>
                );
              })}
            </BreadcrumbNav>
          </ContentHeader>

          <ContentBody>
            {isLoading ? (
              <Box
                sx={{
                  minHeight: 220,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CircularProgress size={28} />
              </Box>
            ) : visibleItems.length === 0 ? (
              <EmptyStateContainer>
                <EmptyStateIcon>
                  <FolderSvg size={28} />
                </EmptyStateIcon>
                <EmptyStateText>
                  {isGlobalSearch
                    ? 'В полном поиске ничего не найдено'
                    : search.trim()
                      ? 'Ничего не найдено'
                      : 'Папка пуста'}
                </EmptyStateText>
                <ActionGate
                  disabled={createActionsDisabled}
                  title={createActionsDisabledTitle}
                >
                  <ToolbarPrimaryBtn
                    type='button'
                    data-testid='features/projects/users-projects/project-create-button'
                    disabled={createActionsDisabled}
                    onClick={() => setOpenModal(true)}
                  >
                    <PlusSvg />
                    Создать проект
                  </ToolbarPrimaryBtn>
                </ActionGate>
              </EmptyStateContainer>
            ) : (
              <>
                {folderItems.length > 0 ? (
                  <SectionHeaderRow>
                    Папки <SectionCount>{folderItems.length}</SectionCount>
                  </SectionHeaderRow>
                ) : null}

                {folderItems.length > 0 ? (
                  <RowsList data-testid='features/projects/users-projects/folder-list'>
                    {folderItems.map(folder => {
                      const folderOrganizationName = folder.organization_id
                        ? (organizationsMap.get(folder.organization_id) ?? '-')
                        : '-';
                      const folderAuthor =
                        (
                          folder as ProjectFolderReadSchema & {
                            user_email?: string | null;
                          }
                        ).user_email ??
                        folder.user_id ??
                        '-';
                      const updatedAt = folder.updated_at ?? folder.created_at;
                      const createdAt = folder.created_at;

                      return (
                        <FolderCard
                          key={folder.id}
                          isDropTarget={dragOverFolderId === folder.id}
                          onClick={() => {
                            navigateToFolder(folder.id, folder);
                          }}
                          onDragOver={event => {
                            const payload = getActiveDragProject(event);
                            if (canDropProjectToFolder(payload, folder.id)) {
                              event.preventDefault();
                              event.dataTransfer.dropEffect = 'move';
                              setDragOverFolderId(folder.id);
                            }
                          }}
                          onDragLeave={event =>
                            handleFolderDragLeave(event, folder.id)
                          }
                          onDrop={handleDropProjectToFolder(folder.id)}
                          aria-dropeffect='move'
                        >
                          <FolderIconBox>
                            <FolderSvg />
                          </FolderIconBox>

                          <ItemContent>
                            <Tooltip
                              title={
                                <ItemInfoTooltipContent
                                  name={folder.name}
                                  author={folderAuthor}
                                  organizationName={folderOrganizationName}
                                  createdAt={createdAt}
                                  updatedAt={updatedAt}
                                />
                              }
                              arrow
                              placement='top'
                              slotProps={ITEM_INFO_TOOLTIP_SLOT_PROPS}
                            >
                              <ItemTitle
                                type='button'
                                onClick={event => {
                                  event.stopPropagation();
                                  navigateToFolder(folder.id, folder);
                                }}
                              >
                                {folder.name}
                              </ItemTitle>
                            </Tooltip>
                            <ItemMeta>
                              {canViewAuthor ? (
                                <span data-meta='author'>{folderAuthor}</span>
                              ) : null}
                              {canViewAuthor ? (
                                <span data-meta='separator' aria-hidden='true'>
                                  •
                                </span>
                              ) : null}
                              <span>
                                Обновлён {formatProjectDate(updatedAt)}
                              </span>
                            </ItemMeta>
                          </ItemContent>

                          <RowActionButton
                            type='button'
                            onClick={handleFolderActionsMenuOpen(folder)}
                            aria-label={`Действия для папки ${folder.name}`}
                          >
                            <MoreVertSvg />
                          </RowActionButton>
                        </FolderCard>
                      );
                    })}
                  </RowsList>
                ) : null}

                {projectItems.length > 0 ? (
                  <SectionHeaderRow>
                    Проекты <SectionCount>{projectItems.length}</SectionCount>
                  </SectionHeaderRow>
                ) : null}

                {projectItems.length > 0 ? (
                  <RowsList data-testid='features/projects/users-projects/project-list-row'>
                    {projectItems.map(project => {
                      const isSelected = selectedKeys.includes(
                        selectedKey({ type: 'project', id: project.id })
                      );
                      const organizationName =
                        project.organization_id != null
                          ? (organizationsMap.get(project.organization_id) ??
                            '-')
                          : '-';
                      const updatedAt =
                        project.updated_at ?? project.created_at;
                      const createdAt = project.created_at;

                      return (
                        <ProjectCard
                          key={project.id}
                          data-testid='features/projects/users-projects/project-row'
                          data-project-id={project.id}
                          data-project-name={project.name}
                          isSelected={isSelected}
                          draggable
                          onDragStart={handleProjectDragStart(project)}
                          onDragEnd={handleProjectDragEnd}
                          onClick={() => {
                            if (hasSelection) {
                              toggleSelection({
                                type: 'project',
                                id: project.id,
                              });
                              return;
                            }
                            handleOpenProject(project.id);
                          }}
                        >
                          <Checkbox
                            type='button'
                            isChecked={isSelected}
                            onClick={handleToggleSelect({
                              type: 'project',
                              id: project.id,
                            })}
                            aria-label={
                              isSelected
                                ? `Снять выбор с проекта ${project.name}`
                                : `Выбрать проект ${project.name}`
                            }
                          >
                            {isSelected ? <CheckIcon /> : null}
                          </Checkbox>

                          <ProjectIconBox>
                            {getProjectInitial(project.name)}
                          </ProjectIconBox>

                          <ItemContent>
                            <Tooltip
                              title={
                                <ItemInfoTooltipContent
                                  name={project.name}
                                  author={project.user_email ?? '-'}
                                  organizationName={organizationName}
                                  createdAt={createdAt}
                                  updatedAt={updatedAt}
                                />
                              }
                              arrow
                              placement='top'
                              slotProps={ITEM_INFO_TOOLTIP_SLOT_PROPS}
                            >
                              <ItemTitle
                                type='button'
                                isProject
                                onClick={event => {
                                  event.stopPropagation();
                                  handleOpenProject(project.id);
                                }}
                              >
                                {project.name}
                              </ItemTitle>
                            </Tooltip>
                            <ItemMeta>
                              {canViewAuthor ? (
                                <span data-meta='author'>
                                  {project.user_email ?? '-'}
                                </span>
                              ) : null}
                              {canViewAuthor ? (
                                <span data-meta='separator' aria-hidden='true'>
                                  •
                                </span>
                              ) : null}
                              <span>
                                Обновлён {formatProjectDate(updatedAt)}
                              </span>
                            </ItemMeta>
                          </ItemContent>

                          <RunHistoryRow
                            runs={project.last_runs}
                            onOpen={handleOpenRunGroup}
                          />

                          <RowActionButton
                            type='button'
                            data-testid='features/projects/users-projects/project-actions-button'
                            data-project-id={project.id}
                            data-project-name={project.name}
                            onClick={handleActionsMenuOpen(project)}
                            aria-label={`Действия для проекта ${project.name}`}
                          >
                            <MoreVertSvg />
                          </RowActionButton>
                        </ProjectCard>
                      );
                    })}
                  </RowsList>
                ) : null}
              </>
            )}
          </ContentBody>

          <PaginationContainer>
            <PaginationLeft>
              {total > PAGE_SIZE_OPTIONS[0] ? (
                <PageSizeWrap>
                  <PageSizeLabel>Элементов на странице:</PageSizeLabel>
                  <PageSizeControl ref={pageSizeControlRef}>
                    <PageSizeButton
                      type='button'
                      onClick={() => setPageSizeOpen(value => !value)}
                    >
                      {pageSize} <ChevronDownSvg />
                    </PageSizeButton>
                    {pageSizeOpen ? (
                      <PageSizePopup>
                        {PAGE_SIZE_OPTIONS.map(size => (
                          <PageSizeOption
                            key={size}
                            type='button'
                            isActive={size === pageSize}
                            onClick={() => {
                              updateUrl({ nextPage: 1, nextPageSize: size });
                              setPageSizeOpen(false);
                            }}
                          >
                            {size}
                          </PageSizeOption>
                        ))}
                      </PageSizePopup>
                    ) : null}
                  </PageSizeControl>
                </PageSizeWrap>
              ) : null}

              {total > PAGE_SIZE_OPTIONS[0] ? <PaginationDivider /> : null}
              <PaginationSummary>
                Показано{' '}
                <b>
                  {fromItem}-{toItem}
                </b>{' '}
                из <b>{total}</b>
              </PaginationSummary>
            </PaginationLeft>

            {pageCount > 1 ? (
              <PageNavWrap aria-label='Pagination'>
                <PageNavIconBtn
                  type='button'
                  disabled={page <= 1}
                  onClick={() => updateUrl({ nextPage: page - 1 })}
                  aria-label='Предыдущая страница'
                >
                  <ChevronLeftSvg />
                </PageNavIconBtn>

                {buildPageRange(page, pageCount).map((entry, index) =>
                  entry === 'ellipsis' ? (
                    <PageEllipsis key={`ellipsis-${index}`}>...</PageEllipsis>
                  ) : (
                    <PageNumberBtn
                      key={entry}
                      type='button'
                      isActive={entry === page}
                      aria-label={`Page ${entry}`}
                      aria-current={entry === page ? 'page' : undefined}
                      onClick={() => updateUrl({ nextPage: entry })}
                    >
                      {entry}
                    </PageNumberBtn>
                  )
                )}

                <PageNavIconBtn
                  type='button'
                  disabled={page >= pageCount}
                  onClick={() => updateUrl({ nextPage: page + 1 })}
                  aria-label='Следующая страница'
                >
                  <ChevronRightSvg />
                </PageNavIconBtn>
              </PageNavWrap>
            ) : null}
          </PaginationContainer>
        </ProjectsPageRoot>
      </ProjectsPageShell>

      <ProjectContextMenu
        anchorEl={actionsAnchorEl}
        open={Boolean(actionsAnchorEl)}
        onClose={handleActionsMenuClose}
        onRename={handleRenameFromMenu}
        onCopy={handleDuplicateFromMenu}
        onDelete={handleDeleteFromMenu}
      />

      <ProjectContextMenu
        anchorEl={folderActionsAnchorEl}
        open={Boolean(folderActionsAnchorEl)}
        onClose={handleFolderActionsMenuClose}
        onRename={handleRenameFolderFromMenu}
        onDelete={handleDeleteFolderFromMenu}
        renameDescription='Изменить название папки'
        deleteDescription='Удалить папку'
      />

      {hasSelection && (
        <FloatingBar>
          <FloatingBarCount>{selectedKeys.length} выбрано</FloatingBarCount>
          <FloatingBarDeleteButton type='button' onClick={handleBulkDelete}>
            <DeleteOutlineRoundedIcon />
            Удалить
          </FloatingBarDeleteButton>
          <FloatingBarCloseButton
            type='button'
            onClick={() => setSelectedKeys([])}
          >
            <CloseIcon />
          </FloatingBarCloseButton>
        </FloatingBar>
      )}

      <CreateProjectModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        onCreate={handleCreateProject}
      />

      <TextInputDialog
        open={createFolderOpen}
        title='Новая папка'
        label='Название папки'
        initialValue=''
        confirmLabel='Создать'
        cancelLabel='Отмена'
        maxWidth='xs'
        onClose={() => setCreateFolderOpen(false)}
        onConfirm={handleCreateFolder}
      />

      <TextInputDialog
        open={renameProjectOpen}
        title='Переименовать проект'
        label='Новое название проекта'
        initialValue={renameProjectName}
        confirmLabel='Сохранить'
        cancelLabel='Отмена'
        maxWidth='xs'
        onClose={handleCloseRenameDialog}
        onConfirm={handleConfirmRename}
      />

      <TextInputDialog
        open={renameFolderOpen}
        title='Переименовать папку'
        label='Новое название папки'
        initialValue={renameFolder?.name ?? ''}
        confirmLabel='Сохранить'
        cancelLabel='Отмена'
        maxWidth='xs'
        onClose={() => {
          setRenameFolderOpen(false);
          setRenameFolder(null);
        }}
        onConfirm={handleConfirmRenameFolder}
      />

      <RunDetailsDialog
        group={runDetailsGroup}
        onClose={handleCloseRunGroup}
        openedAtMs={runDetailsOpenedAtMs}
      />
    </Container>
  );
};
