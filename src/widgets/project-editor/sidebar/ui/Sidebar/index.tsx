import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import SearchIcon from '@mui/icons-material/Search';
import TerminalIcon from '@mui/icons-material/Terminal';
import {
  Box,
  Divider,
  Drawer,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  Paper,
  TextField,
  Tooltip,
} from '@mui/material';
import { alpha, styled, useTheme } from '@mui/material/styles';

import { useAppDispatch, useAppSelector } from '@/app/providers/store';

import { AIAnalysisHistoryList } from '@/widgets/ai-analysis-history';
import { useSidebar } from '@/widgets/project-editor/sidebar';

import { uiLayoutActions } from '@/features/ui-layout';

import { useAdmin } from '@/entities/admin/admin/model/useAdmin';
import { useOrganizations } from '@/entities/admin/organizations';
import { selectIsAIAnalysisEnabled } from '@/entities/config/runtime-config';
import {
  type DBConnectionRecord,
  type DBConnectionScopeOption,
  DBConnectionsManager,
  isFileConnectionType,
} from '@/entities/data/db-connection';
import { useFileStorageManagerViewer } from '@/entities/node/file-storage-manager-viewer';
import { useCurrentProject } from '@/entities/project/projects';
import { NodeLibraryList } from '@/entities/project-editor/node-library';
import { normalizeRole, useCurrentUser } from '@/entities/user';

import { usePointerResize } from '@/shared/lib/hooks/usePointerResize';
import { getRadius } from '@/shared/ui/primitives/components/theme-style-helpers';

import { ActiveNodesSection } from './ActiveNodesSection';
import { FileManagerSection } from './FileManagerSection';
import { categoryItems } from './items';
import { ProjectSettings } from './ProjectSettings';
import { ProjectVariables } from './ProjectVariables';
import { QueueTaskList } from './QueueTaskList';
import type { Category } from './types';

const SIDEBAR_RAIL_BACKGROUND = '#ffffff';
const SIDEBAR_RAIL_COLLAPSED_BACKGROUND = '#ffffff';
const SIDEBAR_CONTENT_BACKGROUND = '#ffffff';
const SIDEBAR_OUTER_SHADOW =
  '0 20px 44px rgba(15, 23, 42, 0.08), 0 6px 18px rgba(15, 23, 42, 0.06)';

const SidebarLayout = styled('div')(({ theme }) => {
  const sidebarRadius = getRadius(theme);

  return {
    position: 'relative',
    display: 'flex',
    height: '100%',
    maxHeight: '100%',
    padding: 0,
    gap: 0,
    boxSizing: 'border-box',
    isolation: 'isolate',
    '&::before': {
      content: '""',
      position: 'absolute',
      inset: 0,
      borderRadius: sidebarRadius,
      boxShadow: SIDEBAR_OUTER_SHADOW,
      pointerEvents: 'none',
      zIndex: 0,
    },
    '& > *': {
      position: 'relative',
      zIndex: 1,
    },
  };
});

const SidebarHeader = styled('div')(({ theme }) => ({
  width: '100%',
  minWidth: 0,
  boxSizing: 'border-box',
  padding: 12,
  borderBottom: `1px solid ${theme.palette.divider}`,
  flexShrink: 0,
}));

const SidebarContent = styled('div')(({ theme }) => ({
  flex: 1,
  minWidth: 0,
  width: '100%',
  overflowY: 'auto',
  overflowX: 'hidden',

  '&::-webkit-scrollbar': {
    width: 6,
  },
  '&::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    background: alpha(theme.palette.text.secondary, 0.18),
  },
  '&::-webkit-scrollbar-thumb:hover': {
    background: alpha(theme.palette.text.secondary, 0.28),
  },
}));

interface SidebarCategoryContentProps {
  activeCategory: Category;
  currentProjectID: string | undefined;
  onOpenFileManager: (connection: DBConnectionRecord) => void;
  onOpenNodes: () => void;
  onResetSearch: () => void;
  searchTerm: string;
  availableUsers: DBConnectionScopeOption[];
  availableOrganizations: DBConnectionScopeOption[];
}

const SidebarCategoryContent = memo<SidebarCategoryContentProps>(
  ({
    activeCategory,
    currentProjectID,
    onOpenFileManager,
    onOpenNodes,
    onResetSearch,
    searchTerm,
    availableUsers,
    availableOrganizations,
  }) => {
    switch (activeCategory) {
      case 'nodes':
        return <NodeLibraryList searchTerm={searchTerm} />;

      case 'activeNodes':
        return (
          <ActiveNodesSection
            searchTerm={searchTerm}
            onOpenNodes={onOpenNodes}
            onResetSearch={onResetSearch}
          />
        );

      case 'dbConnections':
        return (
          <DBConnectionsManager
            searchTerm={searchTerm}
            showCreateForm={true}
            availableUsers={availableUsers}
            availableOrganizations={availableOrganizations}
            onConnectionSelect={connection => {
              console.log('Выбрано подключение из sidebar:', connection);
            }}
            onOpenFileManager={onOpenFileManager}
          />
        );

      case 'fileManager':
        return (
          <FileManagerSection
            searchTerm={searchTerm}
            onOpenFileManager={onOpenFileManager}
          />
        );

      case 'queueTaskList':
        return (
          <QueueTaskList projectId={currentProjectID} searchTerm={searchTerm} />
        );

      case 'aiAnalysis':
        return <AIAnalysisHistoryList projectId={currentProjectID} />;

      case 'projectSettings':
        return <ProjectSettings />;

      case 'projectVariables':
        return <ProjectVariables searchTerm={searchTerm} />;

      default:
        return null;
    }
  }
);

SidebarCategoryContent.displayName = 'SidebarCategoryContent';

export const Sidebar: React.FC = () => {
  const theme = useTheme();
  const sidebarRadius = getRadius(theme);

  const [activeCategory, setActiveCategory] = useState<Category>('nodes');
  const [searchTerm, setSearchTerm] = useState('');

  const dispatch = useAppDispatch();
  const sidebar = useSidebar();
  const { currentProject } = useCurrentProject();
  const { user } = useCurrentUser();
  const currentRole = normalizeRole(user?.role);
  const { users, usersLoading, loadUsers } = useAdmin();
  const { organizations, organizationsLoading, loadOrganizations } =
    useOrganizations();
  const isAIAnalysisEnabled = useAppSelector(selectIsAIAnalysisEnabled);
  const visibleCategoryItems = useMemo(
    () =>
      Object.entries(categoryItems).filter(
        ([key]) => key !== 'aiAnalysis' || isAIAnalysisEnabled
      ),
    [isAIAnalysisEnabled]
  );

  useEffect(() => {
    if (!isAIAnalysisEnabled && activeCategory === 'aiAnalysis') {
      setActiveCategory('nodes');
    }
  }, [activeCategory, isAIAnalysisEnabled]);

  useEffect(() => {
    if (activeCategory !== 'dbConnections') {
      return;
    }

    if (
      (currentRole === 'admin' || currentRole === 'superadmin') &&
      !usersLoading &&
      users.length === 0
    ) {
      void loadUsers();
    }

    if (
      (currentRole === 'admin' || currentRole === 'superadmin') &&
      !organizationsLoading &&
      organizations.length === 0
    ) {
      void loadOrganizations();
    }
  }, [
    activeCategory,
    currentRole,
    loadOrganizations,
    loadUsers,
    organizations.length,
    organizationsLoading,
    users.length,
    usersLoading,
  ]);

  const availableUsers = useMemo<DBConnectionScopeOption[]>(
    () =>
      users
        .filter(
          (
            item
          ): item is typeof item & {
            id: string;
            email: string;
            user_name?: string | null;
          } => typeof item.id === 'string' && item.id.length > 0
        )
        .map(item => ({
          value: item.id,
          label: item.user_name || item.email || item.id,
          description:
            item.email && item.email !== item.user_name ? item.email : null,
        })),
    [users]
  );

  const availableOrganizations = useMemo<DBConnectionScopeOption[]>(
    () =>
      organizations
        .filter(
          (
            item
          ): item is typeof item & {
            id: string;
            name?: string | null;
          } => typeof item.id === 'string' && item.id.length > 0
        )
        .map(item => ({
          value: item.id,
          label: item.name || item.id,
        })),
    [organizations]
  );

  const { openViewer: openFileStorageManagerViewer } =
    useFileStorageManagerViewer();

  const {
    liveValue: localContentWidth,
    handlePointerDown: handleResizeStart,
    handlePointerMove: handleResizeMove,
    handlePointerUp: handleResizeEnd,
  } = usePointerResize({
    value: sidebar.categoriesContentWidth,
    clamp: nextWidth => Math.min(Math.max(nextWidth, 240), 640),
    getNextValue: ({ currentPointer, startPointer, startValue }) =>
      startValue + (currentPointer.x - startPointer.x),
    onCommit: sidebar.setCategoriesContentWidth,
    cursor: 'col-resize',
  });

  const handleCategoryChange = useCallback(
    (category: Category) => {
      setActiveCategory(category);
      setSearchTerm('');
      sidebar.setExpanded(true);
    },
    [sidebar]
  );

  const handleOpenNodes = useCallback(
    () => handleCategoryChange('nodes'),
    [handleCategoryChange]
  );

  const handleResetSearch = useCallback(() => setSearchTerm(''), []);

  const handleCategoryClick = (category: Category) => {
    if (activeCategory !== category) {
      handleCategoryChange(category);
      return;
    }

    if (!sidebar.expanded) {
      sidebar.setExpanded(true);
      return;
    }

    sidebar.setExpanded(false);
  };

  const handleOpenConsole = () => {
    dispatch(uiLayoutActions.toggleConsole());
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value.toLowerCase());
  };

  const handleOpenFileManager = useCallback(
    (connection: DBConnectionRecord) => {
      if (!isFileConnectionType(connection.type)) {
        return;
      }

      openFileStorageManagerViewer(connection.id);
    },
    [openFileStorageManagerViewer]
  );

  const renderSidebarContent = useCallback(
    () => (
      <SidebarCategoryContent
        activeCategory={activeCategory}
        currentProjectID={currentProject?.id}
        onOpenFileManager={handleOpenFileManager}
        onOpenNodes={handleOpenNodes}
        onResetSearch={handleResetSearch}
        searchTerm={searchTerm}
        availableUsers={availableUsers}
        availableOrganizations={availableOrganizations}
      />
    ),
    [
      activeCategory,
      availableOrganizations,
      availableUsers,
      currentProject?.id,
      handleOpenFileManager,
      handleOpenNodes,
      handleResetSearch,
      searchTerm,
    ]
  );

  const railWidth = sidebar.categoriesWidth;
  const contentWidth = Math.min(Math.max(localContentWidth, 240), 640);

  return (
    <SidebarLayout>
      <Drawer
        variant='permanent'
        anchor='left'
        sx={{
          width: railWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: railWidth,
            boxSizing: 'border-box',
            position: 'relative',
            overflowX: 'hidden',
            overflowY: 'hidden',
            border: 0,
            bgcolor: sidebar.expanded
              ? SIDEBAR_RAIL_BACKGROUND
              : SIDEBAR_RAIL_COLLAPSED_BACKGROUND,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            borderRadius: sidebar.expanded
              ? `${sidebarRadius} 0 0 ${sidebarRadius}`
              : sidebarRadius,
            boxShadow: 'none',
            '&::after': sidebar.expanded
              ? {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  bottom: 0,
                  width: '1px',
                  backgroundColor: theme.palette.divider,
                  pointerEvents: 'none',
                }
              : undefined,
            transition: theme =>
              theme.transitions.create('border-radius', {
                duration: 220,
                easing: theme.transitions.easing.easeInOut,
              }),
          },
        }}
      >
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <List sx={{ py: 1.25 }}>
            {visibleCategoryItems.map(([key, item]) => (
              <Tooltip title={item.label} placement='right' key={key}>
                <ListItem
                  disablePadding
                  sx={{
                    display: 'block',
                    position: 'relative',
                    mb: 0.5,
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      left: 0,
                      top: 6,
                      bottom: 6,
                      width: 3,
                      borderRadius: '0 999px 999px 0',
                      backgroundColor: 'primary.main',
                      opacity: activeCategory === key ? 1 : 0,
                      transition: 'opacity 150ms ease',
                    },
                  }}
                >
                  <ListItemButton
                    data-testid={
                      key === 'queueTaskList'
                        ? 'widgets/project-editor/sidebar/task-queue-tab'
                        : key === 'activeNodes'
                          ? 'widgets/project-editor/sidebar/active-nodes-tab'
                          : 'widgets/project-editor/sidebar/category-tab'
                    }
                    data-sidebar-category={key}
                    selected={activeCategory === key}
                    disableRipple
                    disableTouchRipple
                    onClick={() => handleCategoryClick(key as Category)}
                    sx={{
                      width: 38,
                      height: 38,
                      minHeight: 38,
                      p: 0,
                      mx: 'auto',
                      borderRadius: theme => getRadius(theme, -8),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition:
                        'background-color 150ms ease, color 150ms ease',

                      '&.Mui-selected': {
                        bgcolor: theme =>
                          alpha(theme.palette.primary.main, 0.1),
                        '&:hover': {
                          bgcolor: theme =>
                            alpha(theme.palette.primary.main, 0.13),
                        },
                      },
                      '&:hover': {
                        bgcolor: theme =>
                          alpha(theme.palette.primary.main, 0.08),
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 'auto',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: theme =>
                          activeCategory === key
                            ? theme.palette.primary.main
                            : key === 'aiAnalysis'
                              ? theme.palette.primary.main
                              : theme.palette.text.secondary,
                        opacity:
                          activeCategory === key
                            ? 1
                            : key === 'aiAnalysis'
                              ? 1
                              : 0.72,
                        '& svg': {
                          fontSize: 22,
                        },
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                  </ListItemButton>
                </ListItem>
              </Tooltip>
            ))}
          </List>

          <Box sx={{ mt: 'auto', pb: 1 }}>
            <Divider sx={{ mx: 1.5, borderColor: 'divider' }} />
            <List sx={{ pt: 1 }}>
              <Tooltip title='Консоль' placement='right'>
                <ListItem disablePadding sx={{ display: 'block' }}>
                  <ListItemButton
                    disableRipple
                    disableTouchRipple
                    onClick={handleOpenConsole}
                    sx={{
                      minHeight: 38,
                      width: 38,
                      height: 38,
                      justifyContent: 'center',
                      px: 0,
                      borderRadius: theme => getRadius(theme, -8),
                      mx: 'auto',
                      transition: 'background-color 150ms ease',
                      '&:hover': {
                        bgcolor: theme =>
                          alpha(theme.palette.primary.main, 0.08),
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 0,
                        justifyContent: 'center',
                        color: 'text.secondary',
                        opacity: 0.72,
                        '& svg': {
                          fontSize: 20,
                        },
                      }}
                    >
                      <TerminalIcon />
                    </ListItemIcon>
                  </ListItemButton>
                </ListItem>
              </Tooltip>
            </List>
          </Box>
        </Box>
      </Drawer>

      <Box
        aria-hidden={!sidebar.expanded}
        sx={{
          width: sidebar.expanded ? contentWidth : 0,
          minWidth: 0,
          height: '100%',
          flexShrink: 0,
          overflow: 'hidden',
          opacity: sidebar.expanded ? 1 : 0,
          pointerEvents: sidebar.expanded ? 'auto' : 'none',
          transition: theme =>
            theme.transitions.create(['width', 'opacity'], {
              duration: 220,
              easing: theme.transitions.easing.easeInOut,
            }),
        }}
      >
        <Paper
          elevation={0}
          sx={{
            position: 'relative',
            width: contentWidth,
            minWidth: contentWidth,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            boxSizing: 'border-box',
            borderRadius: `0 ${sidebarRadius} ${sidebarRadius} 0`,
            boxShadow: 'none',
            bgcolor: SIDEBAR_CONTENT_BACKGROUND,
            border: 0,
            overflow: 'hidden',
          }}
        >
          <SidebarHeader>
            <TextField
              fullWidth
              variant='outlined'
              size='small'
              slotProps={{
                htmlInput: {
                  'data-testid':
                    'widgets/project-editor/sidebar/node-palette-search-input',
                  'data-sidebar-category': activeCategory,
                },
                input: {
                  startAdornment: (
                    <InputAdornment position='start'>
                      <SearchIcon fontSize='small' />
                    </InputAdornment>
                  ),
                },
              }}
              placeholder={`Поиск (${activeCategory})...`}
              value={searchTerm}
              onChange={handleSearchChange}
              sx={{
                boxShadow: 'none',
                '& .MuiOutlinedInput-root': {
                  backgroundColor: theme =>
                    alpha(theme.palette.text.secondary, 0.06),
                  fontSize: 13,
                  color: 'text.primary',
                  boxShadow: 'none',
                },
                '& .MuiOutlinedInput-input': {
                  padding: '8px 12px',
                  '&:focus': {
                    outline: 'none',
                  },
                  '&::placeholder': {
                    color: 'text.secondary',
                    opacity: 0.78,
                  },
                },
                '& .MuiInputAdornment-root': {
                  color: 'text.secondary',
                  opacity: 0.78,
                },
              }}
            />
          </SidebarHeader>
          <SidebarContent>{renderSidebarContent()}</SidebarContent>

          <Box
            onPointerDown={handleResizeStart}
            onPointerMove={handleResizeMove}
            onPointerUp={handleResizeEnd}
            aria-label='Resize sidebar'
            sx={{
              position: 'absolute',
              top: 0,
              right: -4,
              bottom: 0,
              width: 8,
              cursor: 'col-resize',
              zIndex: theme => theme.zIndex.appBar + 1,
              '&:hover': {
                backgroundColor: theme =>
                  alpha(theme.palette.primary.main, 0.1),
              },
            }}
          />
        </Paper>
      </Box>
    </SidebarLayout>
  );
};
