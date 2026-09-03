import React, { useEffect, useMemo, useRef, useState } from 'react';
import SearchIcon from '@mui/icons-material/Search';
import WidgetsOutlinedIcon from '@mui/icons-material/WidgetsOutlined';
import { Box } from '@mui/material';
import { createPortal } from 'react-dom';

import { useNodeDefinitions } from '@/entities/node/node-definition';
import { matchesNodeSearch } from '@/entities/project-editor/node-library/lib/nodeSearch';

import { NodeDefinition } from '@/shared/gatewayClient';
import { expandIoTypes, isIoTypeCompatible } from '@/shared/lib/node-io';

import * as S from './NodeLibraryContextMenu.styles';

type IoType = string | string[];
const CLICK_AWAY_GUARD_MS = 200;

interface NodeLibraryContextMenuProps {
  top?: number;
  left?: number;
  onClose: () => void;
  onSelectNode: (nodeDef: NodeDefinition) => void;
  filterInputType?: IoType;
  filterMode?: 'source' | 'target';
  requiredInputType?: IoType;
  requiredOutputType?: IoType;
  embedded?: boolean;
}

const typeToList = (value?: IoType): string[] | null => {
  if (!value) {
    return null;
  }
  return expandIoTypes(value);
};

const checkTypeCompatibility = (
  sourceType: IoType,
  targetType: IoType
): boolean => isIoTypeCompatible(sourceType, targetType);

const hasCompatibleInput = (
  nodeDefinition: NodeDefinition,
  sourceType?: IoType
): boolean => {
  if (!sourceType) {
    return true;
  }
  return Object.values(nodeDefinition.input_definitions ?? {}).some(input =>
    checkTypeCompatibility(sourceType, input.type)
  );
};

const hasCompatibleOutput = (
  nodeDefinition: NodeDefinition,
  targetType?: IoType
): boolean => {
  if (!targetType) {
    return true;
  }
  return Object.values(nodeDefinition.output_definitions ?? {}).some(output =>
    checkTypeCompatibility(output.type, targetType)
  );
};

export const NodeLibraryContextMenu: React.FC<NodeLibraryContextMenuProps> = ({
  top,
  left,
  onClose,
  onSelectNode,
  filterInputType,
  filterMode,
  requiredInputType,
  requiredOutputType,
  embedded = false,
}) => {
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const openedAtRef = useRef(0);
  const { nodeDefinitionsMap } = useNodeDefinitions();

  useEffect(() => {
    openedAtRef.current = Date.now();
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const shouldIgnoreInitialEvent = () =>
      Date.now() - openedAtRef.current < CLICK_AWAY_GUARD_MS;

    const isInsideMenu = (target: EventTarget | null) => {
      const element = target as Node | null;
      if (!element) {
        return false;
      }

      return Boolean(rootRef.current?.contains(element));
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (shouldIgnoreInitialEvent() || isInsideMenu(event.target)) {
        return;
      }

      onClose();
    };

    const handleContextMenu = (event: MouseEvent) => {
      if (shouldIgnoreInitialEvent() || isInsideMenu(event.target)) {
        return;
      }

      onClose();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return;
      }

      onClose();
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('contextmenu', handleContextMenu, true);
    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('contextmenu', handleContextMenu, true);
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [onClose]);

  const filteredNodes = useMemo(() => {
    const term = search.toLowerCase();
    const legacyRequiredTypes = typeToList(filterInputType);
    const nextRequiredInputType = requiredInputType;
    const nextRequiredOutputType = requiredOutputType;

    return Object.values(nodeDefinitionsMap)
      .filter(nodeDefinition => {
        const matchesSearch =
          nodeDefinition.visible && matchesNodeSearch(nodeDefinition, term);
        if (!matchesSearch) {
          return false;
        }

        if (legacyRequiredTypes && filterMode === 'source') {
          if (!hasCompatibleOutput(nodeDefinition, legacyRequiredTypes)) {
            return false;
          }
        }

        if (legacyRequiredTypes && filterMode === 'target') {
          if (!hasCompatibleInput(nodeDefinition, legacyRequiredTypes)) {
            return false;
          }
        }

        if (!hasCompatibleInput(nodeDefinition, nextRequiredInputType)) {
          return false;
        }

        if (!hasCompatibleOutput(nodeDefinition, nextRequiredOutputType)) {
          return false;
        }

        return true;
      })
      .sort((a, b) =>
        (a.display_name || a.name).localeCompare(b.display_name || b.name)
      );
  }, [
    filterInputType,
    filterMode,
    nodeDefinitionsMap,
    requiredInputType,
    requiredOutputType,
    search,
  ]);

  const placeholder = useMemo(() => {
    if (requiredInputType || requiredOutputType) {
      return 'Поиск совместимых нод...';
    }
    if (filterInputType) {
      const value =
        typeToList(filterInputType)?.join(', ') ?? String(filterInputType);
      return `Фильтр по типу: ${value}`;
    }
    return 'Поиск...';
  }, [filterInputType, requiredInputType, requiredOutputType]);

  const positionStyle = embedded
    ? undefined
    : {
        top: top ?? 0,
        left: left ?? 0,
      };

  const stopPropagation = (event: React.SyntheticEvent) => {
    event.stopPropagation();
  };

  const stopContextMenuPropagation = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const content = (
    <S.MenuContainer
      ref={rootRef}
      embedded={embedded}
      style={positionStyle}
      onWheel={event => event.stopPropagation()}
      onPointerDown={stopPropagation}
      onMouseDown={stopPropagation}
      onClick={stopPropagation}
      onContextMenu={stopContextMenuPropagation}
    >
      <S.SearchHeader>
        <S.SearchInputWrapper>
          <SearchIcon sx={{ color: '#9ca3af', fontSize: 18 }} />
          <S.StyledInput
            ref={inputRef}
            placeholder={placeholder}
            value={search}
            onChange={event => setSearch(event.target.value)}
            onKeyDown={event => event.key === 'Escape' && onClose()}
          />
        </S.SearchInputWrapper>
      </S.SearchHeader>
      <S.ResultList>
        {filteredNodes.map(node => (
          <S.MenuItem key={node.name} onClick={() => onSelectNode(node)}>
            <S.IconBox>{node.emoji || <WidgetsOutlinedIcon />}</S.IconBox>
            <Box sx={{ overflow: 'hidden' }}>
              <S.NodeLabel noWrap>{node.display_name || node.name}</S.NodeLabel>
              <S.CategoryLabel>{node.category}</S.CategoryLabel>
            </Box>
          </S.MenuItem>
        ))}
      </S.ResultList>
    </S.MenuContainer>
  );

  if (embedded) {
    return content;
  }

  return createPortal(content, document.body);
};
