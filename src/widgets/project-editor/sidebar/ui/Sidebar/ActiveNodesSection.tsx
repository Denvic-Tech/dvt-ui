import { type MouseEvent, useCallback, useMemo } from 'react';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import TuneRoundedIcon from '@mui/icons-material/TuneRounded';
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';

import { useAppSelector } from '@/app/providers/store';

import { useRequestGraphNodeFocus } from '@/features/project-editor/focus-node';
import { useSelectNode } from '@/features/project-editor/select-node';
import { useNodeDataModalUI } from '@/features/ui-layout';

import { selectNodeDefinitionsMap } from '@/entities/node/node-definition';
import {
  type CustomNodeType,
  selectGraphLoading,
  selectGraphNodesRaw,
} from '@/entities/project-editor/graph';
import {
  getCategoryColor,
  getNodeCategoryColor,
  NodeLibraryIcon,
  NodeLibraryIconAccent,
} from '@/entities/project-editor/node-library';

import { buildActiveNodeSearchText } from './activeNodeSearch';

interface ActiveNodesSectionProps {
  searchTerm?: string;
  onOpenNodes?: () => void;
  onResetSearch?: () => void;
}

const EMPTY_SKELETON_OPACITIES = [0.68, 0.38, 0.14];

const getNodeTitle = (
  node: CustomNodeType,
  definition: ReturnType<typeof selectNodeDefinitionsMap>[string] | undefined
) =>
  node.data.displayName ||
  definition?.display_name ||
  node.data.name ||
  node.id;

const formatNodeID = (nodeID: string) =>
  nodeID.length > 13 ? `${nodeID.slice(0, 6)}...${nodeID.slice(-4)}` : nodeID;

export const ActiveNodesSection = ({
  searchTerm = '',
  onOpenNodes,
  onResetSearch,
}: ActiveNodesSectionProps) => {
  const nodes = useAppSelector(selectGraphNodesRaw);
  const graphLoading = useAppSelector(selectGraphLoading);
  const nodeDefinitionsMap = useAppSelector(selectNodeDefinitionsMap);
  const requestGraphNodeFocus = useRequestGraphNodeFocus();
  const { selectNode, selectedNodeID } = useSelectNode();
  const { setOpen: setNodeDataModalOpen } = useNodeDataModalUI();

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();

  const nodeSearchIndex = useMemo(
    () =>
      nodes.map(node => ({
        node,
        searchText: buildActiveNodeSearchText(
          node,
          nodeDefinitionsMap[node.data.name]
        ),
      })),
    [nodeDefinitionsMap, nodes]
  );

  const filteredNodes = useMemo(
    () =>
      normalizedSearchTerm
        ? nodeSearchIndex
            .filter(entry => entry.searchText.includes(normalizedSearchTerm))
            .map(entry => entry.node)
        : nodes,
    [nodeSearchIndex, nodes, normalizedSearchTerm]
  );

  const handleOpenSettings = useCallback(
    (event: MouseEvent<HTMLButtonElement>, nodeID: string) => {
      event.preventDefault();
      event.stopPropagation();
      selectNode(nodeID);
      setNodeDataModalOpen(true);
    },
    [selectNode, setNodeDataModalOpen]
  );

  return (
    <Box>
      {graphLoading ? (
        <Box
          data-testid='widgets/project-editor/sidebar/active-nodes-loading'
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            py: 6,
          }}
        >
          <CircularProgress size={22} />
        </Box>
      ) : null}

      {!graphLoading && filteredNodes.length === 0 ? (
        <Box
          data-testid='widgets/project-editor/sidebar/active-nodes-empty'
          sx={{ minHeight: 300 }}
        >
          {normalizedSearchTerm ? (
            <Stack
              alignItems='center'
              sx={{ px: 3, pt: 3.25, pb: 4, textAlign: 'center' }}
            >
              <SearchRoundedIcon
                sx={theme => ({
                  mb: 1.5,
                  fontSize: 23,
                  color: alpha(theme.palette.text.secondary, 0.48),
                })}
              />
              <Typography
                variant='body2'
                sx={{ fontSize: 13, fontWeight: 700, lineHeight: 1.35 }}
              >
                Ничего не найдено
              </Typography>
              <Typography
                variant='caption'
                color='text.secondary'
                sx={{
                  maxWidth: '100%',
                  mt: 0.25,
                  fontSize: 11.5,
                  lineHeight: 1.45,
                  overflowWrap: 'anywhere',
                  wordBreak: 'break-word',
                }}
              >
                Нет нод по запросу «{searchTerm.trim()}»
              </Typography>
              {onResetSearch ? (
                <Button
                  data-testid='widgets/project-editor/sidebar/active-nodes-reset-search'
                  variant='outlined'
                  size='small'
                  disableRipple
                  onClick={onResetSearch}
                  sx={theme => ({
                    mt: 1.25,
                    minHeight: 29,
                    px: 1.5,
                    borderRadius: '8px',
                    borderColor: alpha(theme.palette.text.primary, 0.1),
                    backgroundColor: alpha(theme.palette.text.secondary, 0.055),
                    color: 'text.secondary',
                    fontSize: 11.5,
                    fontWeight: 600,
                    textTransform: 'none',
                    boxShadow: 'none',
                    '&:hover': {
                      borderColor: alpha(theme.palette.text.primary, 0.16),
                      backgroundColor: alpha(
                        theme.palette.text.secondary,
                        0.09
                      ),
                      boxShadow: 'none',
                    },
                  })}
                >
                  Сбросить поиск
                </Button>
              ) : null}
            </Stack>
          ) : (
            <Box sx={{ px: 1.5, pt: 1.25, pb: 4 }}>
              <Stack
                data-testid='widgets/project-editor/sidebar/active-nodes-empty-skeleton'
                aria-hidden='true'
                spacing={0.75}
              >
                {EMPTY_SKELETON_OPACITIES.map((opacity, index) => (
                  <Box
                    key={opacity}
                    sx={theme => ({
                      height: 48,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.25,
                      px: 1.25,
                      border: `1px solid ${alpha(
                        theme.palette.text.primary,
                        0.08
                      )}`,
                      borderRadius: '10px',
                      opacity,
                    })}
                  >
                    <Skeleton
                      variant='rounded'
                      animation='pulse'
                      width={28}
                      height={28}
                      sx={{ flexShrink: 0, borderRadius: '8px' }}
                    />
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Skeleton
                        animation='pulse'
                        width={index === 1 ? '44%' : '58%'}
                        height={10}
                      />
                      <Skeleton
                        animation='pulse'
                        width={index === 2 ? '32%' : '38%'}
                        height={8}
                      />
                    </Box>
                  </Box>
                ))}
              </Stack>

              <Stack
                alignItems='center'
                sx={{
                  maxWidth: 245,
                  mx: 'auto',
                  mt: 3,
                  textAlign: 'center',
                }}
              >
                <Typography
                  variant='body2'
                  sx={{ fontSize: 13, fontWeight: 700, lineHeight: 1.35 }}
                >
                  Ни одной ноды на холсте
                </Typography>
                <Typography
                  variant='caption'
                  color='text.secondary'
                  sx={{ mt: 0.5, fontSize: 11.5, lineHeight: 1.45 }}
                >
                  Как только вы добавите ноду, она появится в этом списке —
                  отсюда можно будет найти её на холсте и открыть настройки.
                </Typography>
                {onOpenNodes ? (
                  <Button
                    data-testid='widgets/project-editor/sidebar/active-nodes-add-button'
                    variant='outlined'
                    size='small'
                    disableRipple
                    startIcon={<AddRoundedIcon />}
                    onClick={onOpenNodes}
                    sx={theme => ({
                      mt: 1.5,
                      minHeight: 31,
                      px: 1.5,
                      borderRadius: '9px',
                      borderColor: alpha(theme.palette.text.primary, 0.18),
                      color: 'text.primary',
                      fontSize: 12,
                      fontWeight: 700,
                      textTransform: 'none',
                      boxShadow: 'none',
                      '&:hover': {
                        borderColor: alpha(theme.palette.text.primary, 0.3),
                        backgroundColor: alpha(
                          theme.palette.text.primary,
                          0.025
                        ),
                        boxShadow: 'none',
                      },
                      '& .MuiButton-startIcon': {
                        mr: 0.75,
                        '& svg': { fontSize: 17 },
                      },
                    })}
                  >
                    Добавить ноду
                  </Button>
                ) : null}
                <Typography
                  variant='caption'
                  sx={theme => ({
                    mt: 1,
                    color: alpha(theme.palette.text.secondary, 0.62),
                    fontSize: 10.5,
                    lineHeight: 1.4,
                  })}
                >
                  или перетащите её из вкладки «Ноды»
                </Typography>
              </Stack>
            </Box>
          )}
        </Box>
      ) : null}

      {!graphLoading && filteredNodes.length > 0 ? (
        <List
          data-testid='widgets/project-editor/sidebar/active-nodes-list'
          sx={{
            px: 0.75,
            pt: 1.25,
            pb: 0.5,
            display: 'grid',
            gap: 0.25,
            minWidth: 0,
          }}
        >
          {filteredNodes.map(node => {
            const definition = nodeDefinitionsMap[node.data.name];
            const title = getNodeTitle(node, definition);
            const category = definition?.category?.trim() || 'Uncategorized';
            const categoryColor = definition
              ? getNodeCategoryColor(definition)
              : getCategoryColor(category);
            const isSelected = selectedNodeID === node.id;

            return (
              <ListItem
                key={node.id}
                disablePadding
                data-testid='widgets/project-editor/sidebar/active-node-card'
                data-node-id={node.id}
                data-node-type={node.type}
                data-selected={isSelected ? 'true' : 'false'}
                sx={theme => ({
                  position: 'relative',
                  width: '100%',
                  minWidth: 0,
                  maxWidth: '100%',
                  boxSizing: 'border-box',
                  overflow: 'hidden',
                  border: '1px solid',
                  borderColor: isSelected
                    ? alpha(theme.palette.primary.main, 0.34)
                    : 'transparent',
                  borderRadius: '10px',
                  backgroundColor: isSelected
                    ? alpha(theme.palette.primary.main, 0.055)
                    : 'transparent',
                  boxShadow: isSelected
                    ? `0 1px 2px ${alpha(theme.palette.primary.main, 0.08)}`
                    : 'none',
                  transition:
                    'border-color 150ms ease, background-color 150ms ease, box-shadow 150ms ease',
                  '&::before': isSelected
                    ? {
                        content: '""',
                        position: 'absolute',
                        zIndex: 1,
                        top: 8,
                        bottom: 8,
                        left: 0,
                        width: 3,
                        borderRadius: '0 999px 999px 0',
                        backgroundColor: theme.palette.primary.main,
                      }
                    : undefined,
                  '&:hover': {
                    backgroundColor: isSelected
                      ? alpha(theme.palette.primary.main, 0.07)
                      : alpha(theme.palette.text.primary, 0.035),
                  },
                  '&:hover [data-active-node-settings="true"]': {
                    borderColor: alpha(theme.palette.text.primary, 0.14),
                    backgroundColor: theme.palette.background.paper,
                    color: alpha(theme.palette.text.primary, 0.62),
                  },
                })}
              >
                <Tooltip title='Показать ноду на холсте' placement='right'>
                  <ListItemButton
                    aria-label={`Показать ноду ${title}`}
                    aria-pressed={isSelected}
                    disableRipple
                    onClick={() => requestGraphNodeFocus(node.id)}
                    sx={{
                      minWidth: 0,
                      width: '100%',
                      minHeight: 51,
                      alignItems: 'center',
                      gap: 1.25,
                      px: 1.5,
                      py: 0.625,
                      pr: 5,
                      borderRadius: 'inherit',
                      '&:hover': { bgcolor: 'transparent' },
                    }}
                  >
                    <NodeLibraryIcon
                      data-testid='widgets/project-editor/sidebar/active-node-icon'
                      data-category-color={categoryColor}
                      style={{
                        backgroundColor: alpha(categoryColor, 0.11),
                        color: categoryColor,
                      }}
                    >
                      <NodeLibraryIconAccent />
                    </NodeLibraryIcon>

                    <Box
                      sx={{
                        minWidth: 0,
                        flex: 1,
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 0.25,
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'baseline',
                          gap: 0.75,
                          minWidth: 0,
                        }}
                      >
                        <Typography
                          variant='body2'
                          noWrap
                          sx={{
                            minWidth: 0,
                            fontSize: 13,
                            lineHeight: 1.2,
                            fontWeight: 600,
                            color: isSelected ? 'primary.main' : '#111827',
                          }}
                        >
                          {title}
                        </Typography>
                        <Typography
                          variant='caption'
                          noWrap
                          sx={{
                            maxWidth: 112,
                            flexShrink: 1,
                            color: categoryColor,
                            fontSize: 11,
                            fontWeight: 500,
                            lineHeight: 1.2,
                          }}
                        >
                          {category}
                        </Typography>
                      </Box>
                      <Typography
                        variant='caption'
                        noWrap
                        sx={{
                          display: 'block',
                          color: '#9ca3af',
                          fontSize: 10.5,
                          lineHeight: 1.1,
                          letterSpacing: '0.01em',
                        }}
                      >
                        {formatNodeID(node.id)}
                      </Typography>
                    </Box>
                  </ListItemButton>
                </Tooltip>

                <Tooltip title='Открыть настройки'>
                  <IconButton
                    aria-label={`Открыть настройки ноды ${title}`}
                    data-testid='widgets/project-editor/sidebar/active-node-settings-button'
                    data-node-id={node.id}
                    data-active-node-settings='true'
                    size='small'
                    disableRipple
                    onClick={event => handleOpenSettings(event, node.id)}
                    sx={theme => ({
                      position: 'absolute',
                      top: '50%',
                      right: 6,
                      width: 26,
                      height: 26,
                      transform: 'translateY(-50%)',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: isSelected
                        ? alpha(theme.palette.text.primary, 0.11)
                        : 'transparent',
                      backgroundColor: isSelected
                        ? theme.palette.background.paper
                        : 'transparent',
                      color: alpha(theme.palette.text.primary, 0.42),
                      transition:
                        'border-color 150ms ease, background-color 150ms ease, color 150ms ease',
                      '&:hover': {
                        borderColor: alpha(theme.palette.text.primary, 0.24),
                        backgroundColor: isSelected
                          ? theme.palette.background.paper
                          : 'transparent',
                        color: alpha(theme.palette.text.primary, 0.76),
                      },
                      '& svg': { fontSize: 15 },
                    })}
                  >
                    <TuneRoundedIcon />
                  </IconButton>
                </Tooltip>
              </ListItem>
            );
          })}
        </List>
      ) : null}
    </Box>
  );
};
