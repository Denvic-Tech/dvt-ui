import { type KeyboardEvent, type MouseEvent, useState } from 'react';
import { alpha } from '@mui/material/styles';

import {
  type ColumnOccurrence,
  formatNodeCount,
  type ProjectColumnRow as ProjectColumnRowModel,
} from '@/entities/data/lineage';

import { NodeIcon } from '@/shared/ui/node-icon/NodeIcon';
import { Tooltip } from '@/shared/ui/primitives';

import {
  type ColumnGroup,
  type ColumnTree,
  getRowChainIndex,
} from '../model/columnTree';
import type { CatalogNodeItem } from '../model/useCatalogNodes';

import { ChevronIcon, FormulaIcon, TableIcon } from './catalogIcons';
import { CLS } from './ProjectColumnsView.styles';

const CHANGE_FORMS: [string, string, string] = [
  'изменение',
  'изменения',
  'изменений',
];

const pluralChanges = (count: number): string => {
  const mod10 = count % 10;
  const mod100 = count % 100;
  const form =
    mod10 === 1 && mod100 !== 11
      ? CHANGE_FORMS[0]
      : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)
        ? CHANGE_FORMS[1]
        : CHANGE_FORMS[2];
  return `${count} ${form}`;
};

export const Highlight = ({ text, query }: { text: string; query: string }) => {
  const index = query ? text.toLowerCase().indexOf(query.toLowerCase()) : -1;
  if (index < 0) {
    return <>{text}</>;
  }
  return (
    <>
      {text.slice(0, index)}
      <mark>{text.slice(index, index + query.length)}</mark>
      {text.slice(index + query.length)}
    </>
  );
};

/**
 * Описание в одну строку с многоточием; полный текст — в тултипе, только
 * если строка обрезана. Длинный текст без пробелов не растягивает таблицу.
 */
const DescriptionText = ({ text, query }: { text: string; query: string }) => {
  const [truncated, setTruncated] = useState(false);
  return (
    <Tooltip
      placement='top-start'
      title={
        truncated ? (
          <span style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
            {text}
          </span>
        ) : (
          ''
        )
      }
    >
      <span
        className={CLS.descText}
        onMouseEnter={event => {
          const element = event.currentTarget;
          setTruncated(element.scrollWidth > element.clientWidth);
        }}
      >
        <Highlight text={text} query={query} />
      </span>
    </Tooltip>
  );
};

/** `schema.table @ host:port` → таблица и подключение. */
const splitLocation = (location: string | null | undefined) => {
  const [table, host] = (location ?? '').split(' @ ');
  return { table: table?.trim() ?? '', host: host?.trim() ?? '' };
};

interface SourceCellProps {
  row: ProjectColumnRowModel;
  dependencyNames: string[];
  query: string;
}

const SourceCell = ({ row, dependencyNames, query }: SourceCellProps) => {
  if (row.kind === 'node_column') {
    const extra = dependencyNames.length
      ? `из ${dependencyNames.join(', ')}`
      : row.origin_node_name
        ? `в ноде ${row.origin_node_name}`
        : '';
    return (
      <span
        className={CLS.src}
        data-calc='1'
        title={`Вычисляется в ноде «${row.origin_node_name ?? row.start.node_id ?? ''}»${
          dependencyNames.length ? ` из ${dependencyNames.join(', ')}` : ''
        }`}
      >
        <span className={CLS.srcIcon}>
          <FormulaIcon />
        </span>
        <span className={CLS.srcText}>Расчёт</span>
        {extra ? <span className={CLS.srcExtra}>{extra}</span> : null}
      </span>
    );
  }

  const { table, host } = splitLocation(row.dataset_location);
  const qualified = table || row.origin.key;
  const dot = table ? qualified.lastIndexOf('.') : -1;
  const schema = dot > 0 ? qualified.slice(0, dot) : '';
  const tableName = dot > 0 ? qualified.slice(dot + 1) : qualified;
  const fieldName = row.field_name ?? row.name;
  return (
    <span
      className={CLS.src}
      title={`Поле таблицы ${[table, fieldName].filter(Boolean).join('.')}${
        host ? ` · ${host}` : ''
      }`}
    >
      <span className={CLS.srcIcon}>
        <TableIcon />
      </span>
      {/* Хост подключения — только в подсказке, в ячейке схема/база и таблица. */}
      <span className={CLS.srcText}>
        {/* Префикс схемы/базы бледный, имя таблицы — обычным цветом. */}
        {schema ? (
          <span className={CLS.srcSchema}>
            <Highlight text={`${schema}.`} query={query} />
          </span>
        ) : null}
        <Highlight text={tableName} query={query} />
      </span>
    </span>
  );
};

interface ColumnChainProps {
  group: ColumnGroup;
  tree: ColumnTree;
  segment: ProjectColumnRowModel;
  plain: boolean;
  nodes: Map<string, CatalogNodeItem>;
  onEditRow: (rowId: string) => void;
  onRefine: (rowId: string, occurrence: ColumnOccurrence) => void;
  onOpenNode: (nodeId: string) => void;
}

const ColumnChain = ({
  group,
  tree,
  segment,
  plain,
  nodes,
  onEditRow,
  onRefine,
  onOpenNode,
}: ColumnChainProps) => {
  const segmentKeys = new Set(
    (segment.occurrences ?? []).map(item => item.ref.key)
  );
  const segmentStart = getRowChainIndex(group, segment);

  return (
    <div
      className={CLS.chain}
      data-plain={plain ? 1 : 0}
      data-testid='widgets/data-catalog/column-nodes'
      onClick={event => event.stopPropagation()}
    >
      {group.chain.map((item, index) => {
        const inSegment = segmentKeys.has(item.ref.key);
        const owner = tree.rowOfOccurrence.get(item.ref.key);
        const ownerStartsHere =
          owner !== undefined &&
          owner !== group.host &&
          getRowChainIndex(group, owner) === index;
        const node = nodes.get(item.node_id);
        const color = node?.categoryColor;

        let cell = null;
        if (ownerStartsHere && owner.is_refinement) {
          cell = (
            <button
              type='button'
              className={CLS.nodeDesc}
              title='Изменить уточнение'
              onClick={() => onEditRow(owner.id)}
            >
              <span className={CLS.nodeDescValue}>
                {owner.description ?? ''}
              </span>
            </button>
          );
        } else if (ownerStartsHere && owner.is_rename) {
          cell = (
            <span className={CLS.nodeNote}>Переименована в {owner.name}</span>
          );
        } else if (inSegment && index > segmentStart) {
          cell = (
            <button
              type='button'
              className={CLS.nodeAdd}
              data-testid='widgets/data-catalog/refine-here'
              onClick={() => onRefine(segment.id, item)}
            >
              Добавить описание
            </button>
          );
        } else {
          cell = (
            <span className={CLS.nodeInherited} title='Описание наследуется'>
              {owner?.description?.trim() || 'Без описания'}
            </span>
          );
        }

        return (
          <div
            key={item.ref.key}
            className={CLS.node}
            data-in={inSegment ? 1 : 0}
            data-pt={
              inSegment && segmentKeys.has(group.chain[index - 1]?.ref.key)
                ? 1
                : 0
            }
            data-pb={
              inSegment && segmentKeys.has(group.chain[index + 1]?.ref.key)
                ? 1
                : 0
            }
            data-first={index === 0 ? 1 : 0}
            data-last={index === group.chain.length - 1 ? 1 : 0}
          >
            <span className={CLS.nodeName}>
              <span className={CLS.rail}>
                <Tooltip placement='top' title={node?.title ?? item.node_name}>
                  <span
                    className={CLS.nodeIcon}
                    style={
                      color
                        ? {
                            // Тон категории поверх непрозрачной подложки:
                            // линия цепочки не просвечивает сквозь иконку.
                            backgroundImage: `linear-gradient(${alpha(color, 0.11)}, ${alpha(color, 0.11)})`,
                            color,
                          }
                        : undefined
                    }
                  >
                    <NodeIcon iconKey={node?.iconKey} size={12} />
                  </span>
                </Tooltip>
              </span>
              <button
                type='button'
                className={CLS.nodeTitle}
                aria-label={`Открыть ноду ${item.node_name}`}
                title={`${[node?.templateName, item.port]
                  .filter(Boolean)
                  .join(' · ')}\nОткрыть колонки ноды`}
                onClick={() => onOpenNode(item.node_id)}
              >
                {/* Номер ноды в цепочке — тот же, что в «уточнение с ноды N»;
                    внутри кнопки, чтобы цвет и hover совпадали с названием. */}
                <span className={CLS.nodeIndex} aria-hidden='true'>
                  {index + 1}.
                </span>
                {node?.title ?? item.node_name}
              </button>
            </span>
            <span className={CLS.nodeExtra}>{cell}</span>
            <span />
            <span />
          </div>
        );
      })}
    </div>
  );
};

export interface ProjectColumnRowProps {
  row: ProjectColumnRowModel;
  group: ColumnGroup;
  tree: ColumnTree;
  query: string;
  dependencyNames: string[];
  nodes: Map<string, CatalogNodeItem>;
  nested: boolean;
  last: boolean;
  subs: number;
  groupOpen: boolean;
  open: boolean;
  line: 'hov' | 'open' | null;
  highlighted: boolean;
  /** Отрезок, чья цепочка раскрыта под этой строкой. */
  chainRow: ProjectColumnRowModel | null;
  branch: boolean;
  onToggle: (row: ProjectColumnRowModel) => void;
  onHover: (rowId: string | null) => void;
  onEditRow: (rowId: string) => void;
  onRefine: (rowId: string, occurrence: ColumnOccurrence) => void;
  onOpenNode: (nodeId: string) => void;
}

export const ProjectColumnRow = ({
  row,
  group,
  tree,
  query,
  dependencyNames,
  nodes,
  nested,
  last,
  subs,
  groupOpen,
  open,
  line,
  highlighted,
  chainRow,
  branch,
  onToggle,
  onHover,
  onEditRow,
  onRefine,
  onOpenNode,
}: ProjectColumnRowProps) => {
  const toggle = (event: MouseEvent<HTMLDivElement>) => {
    // До ухода мыши не подсвечиваем hover-цветом только что раскрытую строку.
    event.currentTarget.dataset['fresh'] = '1';
    onToggle(row);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (
      event.target === event.currentTarget &&
      (event.key === 'Enter' || event.key === ' ')
    ) {
      event.preventDefault();
      onToggle(row);
    }
  };

  const expanded = (!nested && groupOpen) || open;

  return (
    <div
      className={CLS.rw}
      data-testid='widgets/data-catalog/column-row'
      data-open={open ? 1 : 0}
      data-nested={nested ? 1 : 0}
      data-grp-end={last ? 1 : 0}
      data-parent={!nested && !last ? 1 : 0}
      data-line={line ?? ''}
      data-colopen={!nested && groupOpen ? 1 : 0}
      data-hl={nested ? (open ? 'open' : highlighted ? 'hov' : '') : ''}
      data-g={groupOpen ? 1 : 0}
    >
      <div
        className={CLS.row}
        role='button'
        tabIndex={0}
        aria-expanded={expanded}
        onClick={toggle}
        onKeyDown={handleKeyDown}
        onMouseEnter={nested ? () => onHover(row.id) : undefined}
        onMouseLeave={event => {
          delete event.currentTarget.dataset['fresh'];
          if (nested) {
            onHover(null);
          }
        }}
      >
        <div className={`${CLS.cell} ${CLS.nameCell}`}>
          {nested ? (
            <span className={CLS.branch}>
              {row.is_rename ? (
                <span className={CLS.name} title={row.name}>
                  <Highlight text={row.name} query={query} />
                </span>
              ) : (
                <span className={CLS.branchLabel}>
                  уточнение с ноды {getRowChainIndex(group, row) + 1}
                </span>
              )}
            </span>
          ) : (
            <span className={CLS.name} title={row.name}>
              <Highlight text={row.name} query={query} />
            </span>
          )}
          {subs > 0 ? (
            <span className={CLS.group} data-on={groupOpen ? 1 : 0}>
              {pluralChanges(subs)}
            </span>
          ) : null}
        </div>
        <div className={CLS.cell}>
          {/* Окно описания открывает только сам текст; клик рядом раскрывает строку. */}
          <button
            type='button'
            className={CLS.desc}
            aria-label={`Изменить описание колонки ${row.name}`}
            data-testid='widgets/data-catalog/column-description'
            onClick={event => {
              event.stopPropagation();
              onEditRow(row.id);
            }}
          >
            {row.description?.trim() ? (
              <DescriptionText text={row.description} query={query} />
            ) : (
              <span className={CLS.descEmpty}>Добавить описание</span>
            )}
          </button>
        </div>
        <div className={CLS.cell}>
          {nested ? null : (
            <SourceCell
              row={row}
              dependencyNames={dependencyNames}
              query={query}
            />
          )}
        </div>
        <div className={`${CLS.cell} ${CLS.nodes}`}>
          <span>
            {formatNodeCount(row.node_count ?? row.occurrences?.length ?? 0)}
          </span>
          <span className={CLS.chev}>
            <ChevronIcon size={13} />
          </span>
        </div>
      </div>
      {chainRow ? (
        <ColumnChain
          group={group}
          tree={tree}
          segment={chainRow}
          plain={!branch && !nested && !subs}
          nodes={nodes}
          onEditRow={onEditRow}
          onRefine={onRefine}
          onOpenNode={onOpenNode}
        />
      ) : null}
    </div>
  );
};
