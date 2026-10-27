import { useCallback, useMemo, useState } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';

import {
  ColumnDescriptionDialog,
  type ColumnOccurrence,
  countProjectColumnsFilters,
  type DescriptionTarget,
  filterProjectColumnRows,
  getRowDependencyNames,
  type OrphanedAnnotation,
  PROJECT_COLUMNS_FILTERS,
  type ProjectColumnRow as ProjectColumnRowModel,
  type ProjectColumnsFilter,
  useGetProjectColumnsQuery,
} from '@/entities/data/lineage';

import { Alert, Button } from '@/shared/ui/primitives';

import { buildColumnTree } from '../model/columnTree';
import {
  type DescriptionEditing,
  getDescriptionDialogModel,
} from '../model/descriptionDialog';
import { useCatalogNodes } from '../model/useCatalogNodes';
import { useColumnDescriptionSave } from '../model/useColumnDescriptionSave';

import { SearchIcon } from './catalogIcons';
import { CenteredState } from './DataCatalogModal.styles';
import { ProjectColumnRow } from './ProjectColumnRow';
import { ProjectColumnsSkeleton } from './ProjectColumnsSkeleton';
import {
  ColumnsPane,
  EmptyState,
  IssueRow,
  IssuesSection,
  SearchBox,
  Seg,
  SegButton,
  TableBody,
  TableHead,
  TextButton,
  Toolbar,
  ToolbarNote,
} from './ProjectColumnsView.styles';

interface ProjectColumnsViewProps {
  projectId: string | null;
  /** Открыть раздел «Ноды» на этой ноде: колонки и цепочка происхождения. */
  onOpenNode: (nodeId: string) => void;
}

export const ProjectColumnsView = ({
  projectId,
  onOpenNode,
}: ProjectColumnsViewProps) => {
  const [filter, setFilter] = useState<ProjectColumnsFilter>('all');
  const [query, setQuery] = useState('');
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [segment, setSegment] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [editing, setEditing] = useState<DescriptionEditing | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, error, isLoading, isFetching, refetch } =
    useGetProjectColumnsQuery(projectId ? { projectId } : skipToken, {
      refetchOnMountOrArgChange: true,
    });
  const {
    save,
    reset,
    isSaving,
    error: saveError,
  } = useColumnDescriptionSave(projectId);
  const catalogNodes = useCatalogNodes();
  const nodes = useMemo(
    () => new Map(catalogNodes.map(node => [node.id, node])),
    [catalogNodes]
  );

  const rows = useMemo(() => data?.rows ?? [], [data?.rows]);
  const tree = useMemo(() => buildColumnTree(rows), [rows]);
  const counts = useMemo(() => countProjectColumnsFilters(rows), [rows]);
  const needle = query.trim();
  const shown = useMemo(
    () => filterProjectColumnRows(tree.ordered, filter, needle),
    [filter, needle, tree.ordered]
  );

  // Отрезки колонки свёрнуты под её первой строкой во всех фильтрах, как во
  // «Все»; плоский список — только при поиске, чтобы видеть все совпадения.
  const flat = Boolean(needle);
  const groupKey = (row: ProjectColumnRowModel) =>
    tree.groupOf.get(row.id)?.key ?? row.id;

  // Заголовок группы — первая прошедшая фильтр строка колонки. Обычно это
  // начало цепочки, но если фильтр его скрыл (например, «С описанием»),
  // заголовком становится первый видимый отрезок, а остальные сворачиваются
  // под ним так же, как во «Все».
  const { visible, subCount, leadIds } = useMemo(() => {
    const leads = new Map<string, string>();
    const subs: Record<string, number> = {};
    shown.forEach(row => {
      const key = tree.groupOf.get(row.id)?.key ?? row.id;
      if (leads.has(key)) {
        subs[key] = (subs[key] ?? 0) + 1;
      } else {
        leads.set(key, row.id);
      }
    });
    const ids = new Set(leads.values());
    return {
      leadIds: ids,
      subCount: subs,
      visible: shown.filter(
        row =>
          flat ||
          ids.has(row.id) ||
          (tree.groupOf.get(row.id)?.key ?? row.id) === openGroup
      ),
    };
  }, [flat, openGroup, shown, tree.groupOf]);
  const isGroupLead = (row: ProjectColumnRowModel) => leadIds.has(row.id);

  const isVisibleHost = (index: number) =>
    index === 0 || groupKey(visible[index - 1]) !== groupKey(visible[index]);
  const hostOf = (key: string) =>
    visible.find((row, index) => groupKey(row) === key && isVisibleHost(index));
  const host = openGroup ? hostOf(openGroup) : undefined;
  const segmentRow =
    host && segment
      ? visible.find(row => row.id === segment && groupKey(row) === openGroup)
      : undefined;
  const chainRow = segmentRow ?? host;
  const openId = chainRow?.id ?? null;
  const branchOpen = Boolean(host && openId && openId !== host.id);

  const toggle = (row: ProjectColumnRowModel) => {
    setHovered(null);
    const key = groupKey(row);
    if (key !== openGroup) {
      setOpenGroup(key);
      setSegment(hostOf(key)?.id ?? row.id);
      return;
    }
    if (host && row.id === host.id) {
      setOpenGroup(null);
      setSegment(null);
      return;
    }
    setSegment(openId === row.id ? (host?.id ?? null) : row.id);
  };

  /** Подсветка вертикали дерева от строки до раскрытого/наведённого отрезка. */
  const lineOf = (index: number): 'hov' | 'open' | null => {
    const row = visible[index];
    const reaches = (id: string | null) => {
      const target = visible.findIndex(item => item.id === id);
      return (
        target > index &&
        groupKey(visible[target]) === groupKey(row) &&
        !isGroupLead(visible[target])
      );
    };
    if (branchOpen && reaches(openId)) {
      return 'open';
    }
    if (!branchOpen && hovered && reaches(hovered)) {
      return 'hov';
    }
    return null;
  };

  const startEditRow = useCallback(
    (rowId: string) => {
      reset();
      setActionError(null);
      setEditing({ rowId, occurrence: null });
    },
    [reset]
  );

  const startRefine = useCallback(
    (rowId: string, occurrence: ColumnOccurrence) => {
      reset();
      setActionError(null);
      setEditing({ rowId, occurrence });
    },
    [reset]
  );

  const closeEditor = useCallback(() => {
    reset();
    setEditing(null);
  }, [reset]);

  const handleSave = useCallback(
    async (description: string | null, target: DescriptionTarget) => {
      if (await save({ target, description })) {
        setEditing(null);
      }
    },
    [save]
  );

  const deleteOrphan = useCallback(
    async (orphan: OrphanedAnnotation) => {
      setActionError(null);
      const ok = await save({
        target: {
          scope: 'project',
          node_id: orphan.node_id,
          port: orphan.port,
          column: orphan.column,
        },
        description: null,
      });
      if (!ok) {
        setActionError('Не удалось удалить описание.');
      }
    },
    [save]
  );

  const dialogModel = useMemo(() => {
    if (!editing) {
      return null;
    }
    const row = rows.find(item => item.id === editing.rowId);
    return getDescriptionDialogModel(
      tree,
      editing,
      row ? getRowDependencyNames(row, rows) : []
    );
  }, [editing, rows, tree]);

  const loadErrorMessage = error
    ? 'message' in error
      ? error.message
      : 'Не удалось загрузить колонки проекта.'
    : null;

  if (!projectId) {
    return (
      <CenteredState>
        <strong>Проект не выбран</strong>
        <p>Откройте проект, чтобы увидеть его колонки.</p>
      </CenteredState>
    );
  }

  if (isLoading) {
    return <ProjectColumnsSkeleton />;
  }

  if (loadErrorMessage && !data) {
    return (
      <CenteredState>
        <strong>Не удалось загрузить колонки</strong>
        <p>{loadErrorMessage}</p>
        <Button
          size='xs'
          variant='outline'
          disabled={isFetching}
          onClick={() => void refetch()}
        >
          Повторить
        </Button>
      </CenteredState>
    );
  }

  if (data && !data.lineage_available) {
    return (
      <CenteredState data-testid='widgets/data-catalog/columns-unavailable'>
        <strong>Каталог ещё не разобрал проект</strong>
        <p>
          Колонки появляются после сохранения графа с нодами, читающими данные.
          Сохраните граф и откройте каталог снова.
        </p>
        <Button
          size='xs'
          variant='outline'
          disabled={isFetching}
          onClick={() => void refetch()}
        >
          Проверить снова
        </Button>
      </CenteredState>
    );
  }

  const unresolved = data?.unresolved_ports ?? [];
  const orphans = data?.orphaned_annotations ?? [];

  return (
    <ColumnsPane data-testid='widgets/data-catalog/columns-view'>
      <Toolbar>
        <SearchBox>
          <SearchIcon />
          <input
            value={query}
            placeholder='Поиск по колонке, таблице или описанию'
            aria-label='Поиск колонок'
            onChange={event => setQuery(event.target.value)}
          />
        </SearchBox>
        <Seg role='group' aria-label='Фильтр колонок'>
          {PROJECT_COLUMNS_FILTERS.map(item => (
            <SegButton
              key={item.id}
              type='button'
              active={filter === item.id}
              aria-pressed={filter === item.id}
              data-testid={`widgets/data-catalog/columns-filter-${item.id}`}
              onClick={() => setFilter(item.id)}
            >
              {item.label}
              <span>{counts[item.id]}</span>
            </SegButton>
          ))}
        </Seg>
        {data?.truncated ? (
          <ToolbarNote>Lineage усечён: часть колонок не показана.</ToolbarNote>
        ) : null}
      </Toolbar>
      {actionError || loadErrorMessage ? (
        <div style={{ display: 'grid', gap: 8, padding: '0 24px 12px' }}>
          {actionError ? (
            <Alert variant='destructive'>{actionError}</Alert>
          ) : null}
          {loadErrorMessage ? (
            <Alert variant='warning'>{loadErrorMessage}</Alert>
          ) : null}
        </div>
      ) : null}
      <TableHead>
        <span>Колонка</span>
        <span>Описание</span>
        <span>Источник</span>
        <span>Путь</span>
      </TableHead>
      <TableBody>
        {visible.map((row, index) => {
          const group = tree.groupOf.get(row.id);
          if (!group) {
            return null;
          }
          const nested = !isVisibleHost(index);
          const isHostRow = Boolean(host && row.id === host.id);
          return (
            <ProjectColumnRow
              key={row.id}
              row={row}
              group={group}
              tree={tree}
              query={needle}
              dependencyNames={getRowDependencyNames(row, rows)}
              nodes={nodes}
              nested={nested}
              last={
                !(
                  visible[index + 1] &&
                  groupKey(visible[index + 1]) === group.key
                )
              }
              subs={isGroupLead(row) && !flat ? (subCount[group.key] ?? 0) : 0}
              groupOpen={openGroup === group.key}
              open={Boolean(branchOpen && openId === row.id)}
              line={lineOf(index)}
              highlighted={hovered === row.id && !branchOpen}
              chainRow={isHostRow ? (chainRow ?? null) : null}
              branch={branchOpen}
              onToggle={toggle}
              onHover={setHovered}
              onEditRow={startEditRow}
              onRefine={startRefine}
              onOpenNode={onOpenNode}
            />
          );
        })}
        {!shown.length ? (
          <EmptyState>
            {rows.length
              ? 'Ничего не найдено'
              : 'В проекте пока нет колонок с известным составом'}
          </EmptyState>
        ) : null}
        {unresolved.length ? (
          <IssuesSection aria-label='Ноды, у которых колонки неизвестны'>
            <h3>Ноды, у которых колонки неизвестны</h3>
            {unresolved.map(port => (
              <IssueRow key={`${port.node_id}:${port.port}`}>
                <b title={port.node_id}>{port.node_name}</b>
                <span>{port.port}</span>
                <span style={{ marginLeft: 'auto' }}>
                  {port.detail ?? port.reason ?? port.status}
                </span>
              </IssueRow>
            ))}
          </IssuesSection>
        ) : null}
        {orphans.length ? (
          <IssuesSection aria-label='Описания колонок, которых больше нет'>
            <h3>Описания колонок, которых больше нет</h3>
            {orphans.map(orphan => (
              <IssueRow
                key={`${orphan.node_id}:${orphan.port}:${orphan.column}`}
                data-testid='widgets/data-catalog/orphan-row'
              >
                <b>{orphan.column}</b>
                <span title={orphan.description}>«{orphan.description}»</span>
                <TextButton
                  type='button'
                  disabled={isSaving}
                  onClick={() => void deleteOrphan(orphan)}
                >
                  Удалить
                </TextButton>
              </IssueRow>
            ))}
          </IssuesSection>
        ) : null}
      </TableBody>
      {dialogModel ? (
        <ColumnDescriptionDialog
          key={`${editing?.rowId}:${editing?.occurrence?.ref.key ?? ''}`}
          open
          title={dialogModel.title}
          columnName={dialogModel.name}
          meta={dialogModel.meta}
          showPrevious={dialogModel.isRefine}
          previous={dialogModel.previous}
          initialValue={dialogModel.initialValue}
          {...(dialogModel.placeholder
            ? { placeholder: dialogModel.placeholder }
            : {})}
          hint={dialogModel.hint}
          canDelete={dialogModel.canDelete}
          deleteLabel={dialogModel.deleteLabel}
          isSaving={isSaving}
          errorMessage={saveError}
          onSave={description => {
            const { target } = dialogModel;
            if (target) {
              void handleSave(description, target);
            }
          }}
          onClose={closeEditor}
        />
      ) : null}
    </ColumnsPane>
  );
};
