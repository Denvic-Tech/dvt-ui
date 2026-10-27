import { memo, useMemo, useState } from 'react';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import { alpha } from '@mui/material/styles';

import { useAppSelector } from '@/app/providers/store';

import { NodeFieldsPanel } from '@/widgets/project-editor/node-fields-viewer';

import { selectSelectedNodeID } from '@/features/project-editor/select-node';

import { NodeLibraryIcon } from '@/entities/project-editor/node-library';

import { NodeIcon } from '@/shared/ui/node-icon/NodeIcon';

import {
  type CatalogNodeItem,
  useCatalogNodes,
} from '../model/useCatalogNodes';

import {
  CenteredState,
  DetailPane,
  ListMessage,
  ListPane,
  ListRow,
  ListScroll,
  RowIcon,
  RowSubtitle,
  RowText,
  RowTitle,
  SearchField,
  SearchInput,
} from './DataCatalogModal.styles';

interface NodeRowProps {
  node: CatalogNodeItem;
  active: boolean;
  onSelect: (nodeId: string) => void;
}

const NodeRow = memo(({ node, active, onSelect }: NodeRowProps) => (
  <ListRow
    type='button'
    active={active}
    aria-current={active ? 'true' : undefined}
    data-testid='widgets/data-catalog/node-row'
    onClick={() => onSelect(node.id)}
  >
    <RowIcon>
      <NodeLibraryIcon
        style={{
          backgroundColor: alpha(node.categoryColor, 0.11),
          color: node.categoryColor,
        }}
      >
        <NodeIcon iconKey={node.iconKey} />
      </NodeLibraryIcon>
    </RowIcon>
    <RowText>
      <RowTitle active={active}>{node.title}</RowTitle>
      {node.templateName ? (
        <RowSubtitle>{node.templateName}</RowSubtitle>
      ) : null}
    </RowText>
  </ListRow>
));
NodeRow.displayName = 'NodeRow';

interface NodesViewProps {
  /** Закрыть каталог (в т.ч. при переходе к ноде на холсте). */
  onClose: () => void;
  /** Нода, которую открыть сразу (например, из списка колонок проекта). */
  initialNodeId?: string | null;
}

export const NodesView = ({
  onClose,
  initialNodeId = null,
}: NodesViewProps) => {
  const nodes = useCatalogNodes();
  const canvasSelectedNodeId = useAppSelector(selectSelectedNodeID);
  const [search, setSearch] = useState('');
  // По умолчанию открываем переданную ноду, иначе выбранную на холсте.
  const [selectedId, setSelectedId] = useState<string | null>(
    initialNodeId ?? canvasSelectedNodeId ?? null
  );

  const needle = search.trim().toLowerCase();
  const visibleNodes = useMemo(
    () =>
      needle ? nodes.filter(node => node.searchText.includes(needle)) : nodes,
    [needle, nodes]
  );
  const activeNodeId =
    selectedId && nodes.some(node => node.id === selectedId)
      ? selectedId
      : null;

  return (
    <>
      <ListPane data-testid='widgets/data-catalog/nodes-list'>
        <SearchField>
          <SearchRoundedIcon sx={{ fontSize: 16 }} />
          <SearchInput
            value={search}
            placeholder='Поиск нод'
            aria-label='Поиск нод'
            onChange={event => setSearch(event.target.value)}
          />
        </SearchField>
        <ListScroll>
          {visibleNodes.map(node => (
            <NodeRow
              key={node.id}
              node={node}
              active={node.id === activeNodeId}
              onSelect={setSelectedId}
            />
          ))}
          {!visibleNodes.length ? (
            <ListMessage>
              {needle
                ? `Ничего не найдено по «${search.trim()}»`
                : 'На холсте нет нод с колонками.'}
            </ListMessage>
          ) : null}
        </ListScroll>
      </ListPane>
      <DetailPane>
        {activeNodeId ? (
          <NodeFieldsPanel
            key={activeNodeId}
            nodeID={activeNodeId}
            embedded
            onClose={onClose}
          />
        ) : (
          <CenteredState>
            <strong>Выберите ноду</strong>
            <p>
              Слева — ноды проекта. Справа появятся их колонки, происхождение и
              описания.
            </p>
          </CenteredState>
        )}
      </DetailPane>
    </>
  );
};
