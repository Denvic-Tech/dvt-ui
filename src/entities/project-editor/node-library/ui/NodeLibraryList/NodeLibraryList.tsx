import React, { useCallback, useMemo, useState } from 'react';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import StarBorderRoundedIcon from '@mui/icons-material/StarBorderRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import { CircularProgress, Tooltip, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

import { useNodeDefinitions } from '@/entities/node/node-definition';
import {
  buildNodeLibrarySections,
  getNodeCategoryColor,
  getNodeDisplayTags,
  isDeprecatedNode,
  PINNED_NODE_LIBRARY_SECTION_ID,
} from '@/entities/project-editor/node-library/lib/nodeLibraryPresentation';
import { matchesNodeSearch } from '@/entities/project-editor/node-library/lib/nodeSearch';
import { useNodeLibraryPreferences } from '@/entities/ui-preferences';

import type { NodeDefinition } from '@/shared/gatewayClient';

import {
  CategoryChevron,
  CategoryCount,
  CategoryGroup,
  CategoryHeader,
  CategoryHeaderMain,
  CategoryHeaderStatic,
  CategoryMarker,
  CategoryTitle,
  DeprecatedBadge,
  EmptyState,
  NodeAction,
  NodeActionSlot,
  NodeItem,
  NodeItemRow,
  NodeLibraryIcon,
  NodeLibraryIconAccent,
  NodeListContainer,
  NodeMain,
  NodeName,
  NodeTitleRow,
  PinnedNodeCategory,
  TagChip,
  TagsRow,
} from './styles.ts';

export interface NodeLibraryListProps {
  searchTerm?: string;
  enableDrag?: boolean;
  onNodeSelect?: (nodeDefinition: NodeDefinition) => void;
}

const getNodeIconStyles = (color: string) => ({
  backgroundColor: alpha(color, 0.11),
  color,
});

const getCategoryHeaderStyles = (color: string) =>
  ({
    '--node-library-category-color': color,
  }) as React.CSSProperties;

const getNodeActionStyles = ({ isPinned }: { isPinned: boolean }) => ({
  color: isPinned ? '#d1a43f' : '#111827',
});

export const NodeLibraryList: React.FC<NodeLibraryListProps> = ({
  searchTerm = '',
  enableDrag = true,
  onNodeSelect,
}) => {
  const [hoveredNodeKey, setHoveredNodeKey] = useState<string | null>(null);
  const normalizedTerm = searchTerm.trim().toLowerCase();
  const {
    nodeDefinitionsMap,
    isLoading: nodesLoading,
    status: nodesStatus,
  } = useNodeDefinitions();
  const {
    pinnedNodeNames,
    collapsedCategories,
    toggleNodePinned,
    toggleCategoryCollapsed,
  } = useNodeLibraryPreferences();

  const filteredNodes = useMemo(
    () =>
      Object.values(nodeDefinitionsMap).filter(node => {
        if (!node.visible) {
          return false;
        }

        return matchesNodeSearch(node, normalizedTerm);
      }),
    [nodeDefinitionsMap, normalizedTerm]
  );

  const sections = useMemo(
    () =>
      buildNodeLibrarySections({
        nodes: filteredNodes,
        pinnedNodeNames,
        collapsedCategories,
      }),
    [collapsedCategories, filteredNodes, pinnedNodeNames]
  );

  const handleDragStart = useCallback(
    (event: React.DragEvent, nodeType: string) => {
      if (!enableDrag) {
        return;
      }

      event.dataTransfer.setData('application/reactflow', nodeType);
      event.dataTransfer.effectAllowed = 'move';
    },
    [enableDrag]
  );

  const handleNodeSelect = useCallback(
    (event: React.MouseEvent, nodeDefinition: NodeDefinition) => {
      event.stopPropagation();

      if (onNodeSelect) {
        onNodeSelect(nodeDefinition);
      }
    },
    [onNodeSelect]
  );

  const handlePinClick = useCallback(
    (
      event:
        | React.MouseEvent<HTMLButtonElement>
        | React.PointerEvent<HTMLButtonElement>,
      nodeName: string
    ) => {
      event.preventDefault();
      event.stopPropagation();
      toggleNodePinned(nodeName);
    },
    [toggleNodePinned]
  );

  const handlePinPointerDown = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
    },
    []
  );

  if (nodesLoading && nodesStatus !== 'succeeded') {
    return (
      <CircularProgress sx={{ display: 'block', margin: 'auto', mt: 2 }} />
    );
  }

  if (nodesStatus === 'failed') {
    return (
      <Typography color='error' sx={{ mt: 2 }}>
        Ошибка загрузки нод.
      </Typography>
    );
  }

  if (nodesStatus === 'succeeded' && sections.length === 0 && !nodesLoading) {
    return (
      <EmptyState>
        {normalizedTerm ? 'Ноды не найдены' : 'Нет доступных нод'}
      </EmptyState>
    );
  }

  return (
    <NodeListContainer>
      {sections.map(section => {
        const isPinnedSection = section.id === PINNED_NODE_LIBRARY_SECTION_ID;
        const sectionHeader = (
          <>
            <CategoryHeaderMain>
              {isPinnedSection ? (
                <>
                  <AccessTimeIcon
                    sx={{
                      fontSize: 15,
                      color: 'text.secondary',
                      opacity: 0.68,
                    }}
                  />
                  <CategoryTitle style={{ opacity: 0.62 }}>
                    {section.title}
                  </CategoryTitle>
                </>
              ) : (
                <>
                  {section.collapsible ? (
                    <CategoryChevron
                      style={{
                        transform: section.collapsed
                          ? 'rotate(0deg)'
                          : 'rotate(90deg)',
                      }}
                    >
                      <ChevronRightIcon />
                    </CategoryChevron>
                  ) : (
                    <CategoryChevron>
                      <ExpandMoreIcon />
                    </CategoryChevron>
                  )}
                  <CategoryMarker />
                  <CategoryTitle>{section.title}</CategoryTitle>
                </>
              )}
            </CategoryHeaderMain>
            {!isPinnedSection ? (
              <CategoryCount>{section.count}</CategoryCount>
            ) : null}
          </>
        );

        return (
          <CategoryGroup key={section.id}>
            {section.collapsible ? (
              <CategoryHeader
                type='button'
                aria-expanded={!section.collapsed}
                onClick={() => toggleCategoryCollapsed(section.title)}
                style={getCategoryHeaderStyles(section.color)}
              >
                {sectionHeader}
              </CategoryHeader>
            ) : (
              <CategoryHeaderStatic
                style={getCategoryHeaderStyles(section.color)}
              >
                {sectionHeader}
              </CategoryHeaderStatic>
            )}
            {!section.collapsed &&
              section.nodes.map(node => {
                const deprecated = isDeprecatedNode(node);
                const isPinned = pinnedNodeNames.includes(node.name);
                const visibleTags = getNodeDisplayTags(node);
                const nodeKey = `${section.id}-${node.name}`;
                const isHovered = hoveredNodeKey === nodeKey;
                const nodeCategoryColor = getNodeCategoryColor(node);
                const showPinAction =
                  isHovered || (isPinned && !isPinnedSection);
                const pinnedCategoryLabel = node.category || 'Uncategorized';

                return (
                  <Tooltip
                    key={nodeKey}
                    title={node.description || node.name}
                    placement='right'
                  >
                    <NodeItem
                      draggable={enableDrag}
                      aria-label={node.name}
                      data-testid='entities/project-editor/node-library/node-palette-item'
                      data-node-name={node.name}
                      data-node-display-name={node.display_name || node.name}
                      data-node-category={node.category || ''}
                      data-draggable={enableDrag ? 'true' : 'false'}
                      data-selectable={onNodeSelect ? 'true' : 'false'}
                      data-deprecated={deprecated ? 'true' : 'false'}
                      onDragStart={event => handleDragStart(event, node.name)}
                      onMouseEnter={() => setHoveredNodeKey(nodeKey)}
                      onMouseLeave={() =>
                        setHoveredNodeKey(current =>
                          current === nodeKey ? null : current
                        )
                      }
                      onClick={
                        onNodeSelect
                          ? event => handleNodeSelect(event, node)
                          : undefined
                      }
                    >
                      <NodeItemRow>
                        <NodeLibraryIcon
                          style={getNodeIconStyles(nodeCategoryColor)}
                          data-deprecated={deprecated ? 'true' : 'false'}
                        >
                          <NodeLibraryIconAccent />
                        </NodeLibraryIcon>
                        <NodeMain>
                          <NodeTitleRow>
                            <NodeName
                              data-deprecated={deprecated ? 'true' : 'false'}
                            >
                              {node.display_name || node.name}
                            </NodeName>
                            {deprecated ? (
                              <DeprecatedBadge>Deprecated</DeprecatedBadge>
                            ) : null}
                          </NodeTitleRow>
                          {visibleTags.length > 0 ? (
                            <TagsRow>
                              {visibleTags.map(tag => (
                                <TagChip key={tag} label={tag} size='small' />
                              ))}
                            </TagsRow>
                          ) : null}
                        </NodeMain>
                        <NodeActionSlot>
                          {showPinAction ? (
                            <NodeAction
                              type='button'
                              data-testid='entities/project-editor/node-library/node-palette-pin-button'
                              data-node-name={node.name}
                              title={
                                isPinned
                                  ? `Открепить ноду ${node.display_name || node.name}`
                                  : `Закрепить ноду ${node.display_name || node.name}`
                              }
                              aria-label={
                                isPinned
                                  ? `Открепить ноду ${node.display_name || node.name}`
                                  : `Закрепить ноду ${node.display_name || node.name}`
                              }
                              data-active={isPinned ? 'true' : 'false'}
                              style={getNodeActionStyles({
                                isPinned,
                              })}
                              onPointerDown={handlePinPointerDown}
                              onClick={event =>
                                handlePinClick(event, node.name)
                              }
                            >
                              {isPinned ? (
                                <StarRoundedIcon />
                              ) : (
                                <StarBorderRoundedIcon />
                              )}
                            </NodeAction>
                          ) : isPinnedSection ? (
                            <PinnedNodeCategory title={pinnedCategoryLabel}>
                              {pinnedCategoryLabel}
                            </PinnedNodeCategory>
                          ) : null}
                        </NodeActionSlot>
                      </NodeItemRow>
                    </NodeItem>
                  </Tooltip>
                );
              })}
          </CategoryGroup>
        );
      })}
    </NodeListContainer>
  );
};
