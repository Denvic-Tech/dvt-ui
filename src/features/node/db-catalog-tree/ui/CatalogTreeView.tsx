import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Divider, MenuItem } from '@mui/material';

import type { DbMetadata } from '@/shared/gatewayClient';
import {
  LinkButton,
  MutedText,
  SearchField,
  SearchLead,
  SkeletonBar,
  Spinner,
} from '@/shared/ui/clean-minimal/controls';
import {
  BackIcon,
  ChevronRightIcon,
  CloseIcon,
  CodeIcon,
  CollapseAllIcon,
  DatabaseIcon,
  LocateIcon,
  MoreIcon,
  RefreshIcon,
  SchemaIcon,
  SearchIcon,
  TableIcon,
} from '@/shared/ui/clean-minimal/icons';
import { ToolbarIconButton } from '@/shared/ui/clean-minimal/ToolbarIconButton';

import {
  type CatalogTreeEntry,
  type CatalogTreeFilterRow,
  type CatalogTreeLevel,
  type CatalogTreeNode,
  type CatalogTreeNodeRow,
  type CatalogTreeStatusRow,
  getCatalogChildLevel,
  groupCatalogTreeRows,
} from '../lib/catalogTree';
import type { CatalogTreeModel } from '../model/useCatalogTree';

import { CatalogBranchLoader } from './CatalogBranchLoader';
import {
  ExpressionHeader,
  ExpressionTitle,
  getCatalogTreeRowPadding,
  NodeSearchClear,
  NodeSearchField,
  NodeSearchLabel,
  TREE_FILTER_ROW_HEIGHT,
  TREE_ROW_HEIGHT,
  TreeChevron,
  TreeCount,
  TreeFilterRow,
  TreeGroup,
  TreeIcon,
  TreeList,
  TreeListInner,
  TreeMenu,
  TreeName,
  TreePane,
  TreeRowActions,
  TreeRowButton,
  TreeRowWithActions,
  TreeSkeletonRow,
  TreeStatusRow,
  TreeStickyHeader,
  TreeToolbar,
} from './CatalogTreePane.styles';
import { CATALOG_TREE_TEXT } from './catalogTreeText';

const LEVEL_ICONS = {
  database: DatabaseIcon,
  schema: SchemaIcon,
  table: TableIcon,
} as const;

const EMPTY_BRANCH_LABELS: Record<CatalogTreeLevel, string> = {
  database: 'Нет баз данных',
  schema: 'Нет схем',
  table: 'Нет таблиц',
};

const SKELETON_WIDTHS = [62, 48, 70, 55, 66, 44, 58, 50, 64, 46];

/** Отступ содержимого статусной строки: шеврон 16 + gap 6. */
const STATUS_ROW_OFFSET = 22;

/** Клавиши, которые поле поиска узла оставляет себе, не отдавая дереву. */
const FIELD_OWNED_KEYS = new Set([
  'ArrowUp',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'Home',
  'End',
]);

/** z-index шапки базы; каждая вложенная шапка на единицу ниже. */
const STICKY_HEADER_Z_INDEX = 4;

export type CatalogTreeViewProps = {
  tree: CatalogTreeModel;
  metadata: DbMetadata | null;
  /** Метаданные подключения ещё грузятся — показываем скелетон. */
  isMetadataLoading: boolean;
  ariaLabel: string;
  treeAriaLabel?: string;
  onTableSelect: (node: CatalogTreeNode) => void;
  isExpressionMode: boolean;
  canUseExpressions: boolean;
  onEnterExpressionMode: () => void;
  onExitExpressionMode: () => void;
  expressionContent: ReactNode;
  /** Пункты меню «Ещё» под разделителем. */
  renderExtraMenuItems?: (closeMenu: () => void) => ReactNode;
  /** Действия справа в строке узла, видны при наведении. */
  renderNodeActions?: (row: CatalogTreeNodeRow) => ReactNode;
  /**
   * Строки в начале раскрытого узла, сразу под его шапкой: например,
   * «+ Новая таблица». `childLevel` — уровень детей узла.
   */
  renderBranchLead?: (
    row: CatalogTreeNodeRow,
    childLevel: CatalogTreeLevel
  ) => ReactNode;
  /** Ключ узла, который нужно коротко подсветить и прокрутить к нему. */
  highlightedKey?: string | null;
};

export const CatalogTreeView = ({
  tree,
  metadata,
  isMetadataLoading,
  ariaLabel,
  treeAriaLabel = 'Базы данных',
  onTableSelect,
  isExpressionMode,
  canUseExpressions,
  onEnterExpressionMode,
  onExitExpressionMode,
  expressionContent,
  renderExtraMenuItems,
  renderNodeActions,
  renderBranchLead,
  highlightedKey = null,
}: CatalogTreeViewProps) => {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const handledRevealRef = useRef(0);

  const entries = useMemo(() => groupCatalogTreeRows(tree.rows), [tree.rows]);

  // «Показать выбранное»: ждём, пока путь до таблицы загрузится,
  // и прокручиваем список к выбранной строке. У строки scroll-margin-top
  // равен высоте прилипших над ней шапок, поэтому они её не закрывают.
  useEffect(() => {
    if (tree.revealRequest === handledRevealRef.current) return;

    const selectedRow = listRef.current?.querySelector<HTMLElement>(
      '[role="treeitem"][aria-selected="true"], [data-tree-draft="true"]'
    );
    if (selectedRow) {
      selectedRow.scrollIntoView?.({ block: 'center' });
      handledRevealRef.current = tree.revealRequest;
      return;
    }
    if (tree.isRevealSettled) {
      handledRevealRef.current = tree.revealRequest;
    }
  }, [tree.isRevealSettled, tree.revealRequest, tree.rows]);

  // Подсвеченный узел (только что созданный) прокручиваем в видимую
  // область, как только он появился в списке.
  const scrolledHighlightRef = useRef<string | null>(null);
  useEffect(() => {
    if (!highlightedKey) {
      scrolledHighlightRef.current = null;
      return;
    }
    if (scrolledHighlightRef.current === highlightedKey) return;
    const row = Array.from(
      listRef.current?.querySelectorAll<HTMLElement>('[data-tree-key]') ?? []
    ).find(element => element.dataset['treeKey'] === highlightedKey);
    if (!row) return;
    row.scrollIntoView?.({ block: 'center' });
    scrolledHighlightRef.current = highlightedKey;
  }, [highlightedKey, tree.rows]);

  const closeMenu = useCallback(() => setMenuAnchor(null), []);
  const isSearching = tree.query.trim().length > 0;
  const isRootLoading = isMetadataLoading || tree.root.state === 'loading';

  /** `stickyOffset` — суммарная высота прилипших над строкой шапок. */
  const renderNodeRow = (row: CatalogTreeNodeRow, stickyOffset: number) => {
    const { node } = row;
    const Icon = LEVEL_ICONS[node.level];
    const isTable = node.level === 'table';

    const button = (
      <TreeRowButton
        key={row.key}
        type='button'
        role='treeitem'
        aria-level={row.depth + 1}
        aria-expanded={isTable ? undefined : row.expanded}
        aria-selected={row.selected}
        aria-busy={row.loading || undefined}
        selected={row.selected}
        onPath={row.onPath}
        highlighted={highlightedKey === row.key}
        data-tree-key={row.key}
        title={node.name}
        style={{
          paddingLeft: getCatalogTreeRowPadding(row.depth),
          scrollMarginTop: stickyOffset,
        }}
        onClick={() => {
          if (isTable) {
            tree.cancelAutoReveal();
            onTableSelect(node);
            return;
          }
          tree.toggleNode(node);
        }}
      >
        {isTable ? (
          <TreeChevron />
        ) : row.loading ? (
          <TreeChevron>
            <Spinner />
          </TreeChevron>
        ) : (
          <TreeChevron open={row.expanded}>
            <ChevronRightIcon />
          </TreeChevron>
        )}
        <TreeIcon className='tree-icon'>
          <Icon />
        </TreeIcon>
        <TreeName className='tree-name'>{node.name}</TreeName>
        {row.count !== null ? (
          <TreeCount className='tree-count'>
            {row.shownCount !== null
              ? `${row.shownCount} ${CATALOG_TREE_TEXT.countOf} ${row.count}`
              : row.count}
          </TreeCount>
        ) : null}
      </TreeRowButton>
    );

    const actions = renderNodeActions?.(row);
    if (!actions) return button;

    return (
      <TreeRowWithActions key={row.key} role='none'>
        {button}
        <TreeRowActions className='tree-row-actions'>{actions}</TreeRowActions>
      </TreeRowWithActions>
    );
  };

  const renderStatusRow = (row: CatalogTreeStatusRow) => (
    <TreeStatusRow
      key={row.key}
      role='none'
      style={{
        paddingLeft: getCatalogTreeRowPadding(row.depth) + STATUS_ROW_OFFSET,
      }}
    >
      {row.status === 'empty' ? EMPTY_BRANCH_LABELS[row.childLevel] : null}
      {row.status === 'noMatches' ? CATALOG_TREE_TEXT.nothingFound : null}
      {row.status === 'error' ? (
        <>
          Не удалось загрузить
          <LinkButton type='button' onClick={() => tree.retry(row.branchKey)}>
            Повторить
          </LinkButton>
        </>
      ) : null}
      {row.status === 'more' ? (
        row.busy ? (
          <>
            <Spinner />
            Загружаем…
          </>
        ) : (
          <LinkButton
            type='button'
            onClick={() => tree.loadMore(row.branchKey)}
          >
            Показать ещё
          </LinkButton>
        )
      ) : null}
    </TreeStatusRow>
  );

  // Поле — отдельная строка, а не часть кнопки узла: клик и ввод не
  // раскрывают и не сворачивают узел.
  const renderFilterRow = (row: CatalogTreeFilterRow) => {
    const placeholder =
      row.childLevel === 'schema'
        ? CATALOG_TREE_TEXT.searchSchemas
        : CATALOG_TREE_TEXT.searchTables;

    return (
      <TreeFilterRow
        key={row.key}
        role='none'
        style={{ paddingLeft: getCatalogTreeRowPadding(row.depth) }}
      >
        <NodeSearchField>
          <NodeSearchLabel>
            <SearchIcon size={13} />
            <input
              value={row.query}
              onChange={event =>
                tree.setNodeQuery(row.branchKey, event.target.value)
              }
              onKeyDown={event => {
                if (FIELD_OWNED_KEYS.has(event.key)) event.stopPropagation();
              }}
              placeholder={placeholder}
              aria-label={placeholder}
            />
          </NodeSearchLabel>
          {row.query ? (
            <NodeSearchClear
              type='button'
              aria-label={CATALOG_TREE_TEXT.clearSearch}
              title={CATALOG_TREE_TEXT.clearSearch}
              onClick={event => {
                tree.setNodeQuery(row.branchKey, '');
                event.currentTarget.parentElement
                  ?.querySelector('input')
                  ?.focus();
              }}
            >
              <CloseIcon size={10} strokeWidth={2} />
            </NodeSearchClear>
          ) : null}
        </NodeSearchField>
      </TreeFilterRow>
    );
  };

  // Раскрытый узел — группа: шапка (строка + поле поиска) прилипает под
  // шапками предков и уезжает вместе с группой, когда её дети закончились.
  const renderEntries = (
    items: readonly CatalogTreeEntry[],
    stickyOffset: number
  ): ReactNode[] =>
    items.map(entry => {
      if (entry.type === 'group') {
        const headerHeight =
          TREE_ROW_HEIGHT + (entry.filter ? TREE_FILTER_ROW_HEIGHT : 0);
        const childLevel = getCatalogChildLevel(
          tree.levels,
          entry.row.node.level
        );
        const lead =
          childLevel && !entry.row.loading
            ? renderBranchLead?.(entry.row, childLevel)
            : null;
        return (
          <TreeGroup key={entry.key} role='none'>
            <TreeStickyHeader
              role='none'
              style={{
                top: stickyOffset,
                zIndex: Math.max(1, STICKY_HEADER_Z_INDEX - entry.row.depth),
              }}
            >
              {renderNodeRow(entry.row, stickyOffset)}
              {entry.filter ? renderFilterRow(entry.filter) : null}
            </TreeStickyHeader>
            {lead}
            {renderEntries(entry.children, stickyOffset + headerHeight)}
          </TreeGroup>
        );
      }
      if (entry.type === 'node') return renderNodeRow(entry, stickyOffset);
      if (entry.type === 'filter') return renderFilterRow(entry);
      return renderStatusRow(entry);
    });

  const extraMenuItems = renderExtraMenuItems?.(closeMenu);

  return (
    <TreePane aria-label={ariaLabel}>
      {isExpressionMode ? (
        <>
          <ExpressionHeader>
            <ToolbarIconButton
              label='Назад к дереву'
              onClick={onExitExpressionMode}
            >
              <BackIcon />
            </ToolbarIconButton>
            <ExpressionTitle>Выражения</ExpressionTitle>
          </ExpressionHeader>
          {expressionContent}
        </>
      ) : (
        <>
          <TreeToolbar>
            <SearchField>
              <SearchLead>
                <SearchIcon />
              </SearchLead>
              <input
                value={tree.query}
                onChange={event => tree.setQuery(event.target.value)}
                placeholder='Поиск'
                aria-label='Поиск'
              />
            </SearchField>
            <ToolbarIconButton
              label='Показать выбранное в дереве'
              disabled={!tree.canReveal}
              onClick={tree.revealSelection}
            >
              <LocateIcon />
            </ToolbarIconButton>
            <ToolbarIconButton
              label='Свернуть всё'
              disabled={!tree.canCollapse}
              onClick={tree.collapseAll}
            >
              <CollapseAllIcon />
            </ToolbarIconButton>
            <ToolbarIconButton
              label='Ещё'
              aria-haspopup='menu'
              aria-expanded={Boolean(menuAnchor)}
              active={Boolean(menuAnchor)}
              onClick={event => setMenuAnchor(event.currentTarget)}
            >
              <MoreIcon />
            </ToolbarIconButton>
          </TreeToolbar>

          <TreeList ref={listRef} role='tree' aria-label={treeAriaLabel}>
            <TreeListInner role='none'>
              {isRootLoading
                ? SKELETON_WIDTHS.map((width, index) => (
                    <TreeSkeletonRow key={index} aria-hidden='true'>
                      <TreeChevron />
                      <SkeletonBar className='tree-skeleton-icon' />
                      <SkeletonBar style={{ width: `${width}%` }} />
                    </TreeSkeletonRow>
                  ))
                : renderEntries(entries, 0)}
              {!isRootLoading && isSearching && tree.rows.length === 0 ? (
                <MutedText>В раскрытых узлах совпадений нет</MutedText>
              ) : null}
            </TreeListInner>
          </TreeList>

          <TreeMenu
            anchorEl={menuAnchor}
            open={Boolean(menuAnchor)}
            onClose={closeMenu}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem
              disabled={!canUseExpressions}
              onClick={() => {
                closeMenu();
                onEnterExpressionMode();
              }}
            >
              <CodeIcon />
              Задать выражениями
            </MenuItem>
            <MenuItem
              disabled={
                !tree.canRefresh || tree.isRefreshing || isExpressionMode
              }
              onClick={() => {
                closeMenu();
                tree.refresh();
              }}
            >
              <RefreshIcon />
              Обновить
            </MenuItem>
            {extraMenuItems ? <Divider component='li' /> : null}
            {extraMenuItems}
          </TreeMenu>
        </>
      )}

      {tree.loaderNodes.map(node => {
        const childLevel = getCatalogChildLevel(tree.levels, node.level);
        return childLevel && childLevel !== 'database' ? (
          <CatalogBranchLoader
            key={node.key}
            metadata={metadata}
            node={node}
            childLevel={childLevel}
            onReport={tree.reportBranch}
          />
        ) : null;
      })}
    </TreePane>
  );
};
