import {
  type ComponentPropsWithoutRef,
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Virtuoso, type VirtuosoHandle } from 'react-virtuoso';

import type { DataType } from '@/shared/gatewayClient';
import { Spinner } from '@/shared/ui/clean-minimal/controls';
import {
  DropdownMenu,
  type DropdownOption,
  SelectButton,
  SelectButtonContent,
} from '@/shared/ui/clean-minimal/dropdown';
import { CloseIcon, InfoIcon } from '@/shared/ui/clean-minimal/icons';

import {
  type ColumnMappingChangeState,
  type ColumnResolveState,
  getResolvedTargetName,
  normalizeName,
  type ResolvedColumnMappingRow,
} from '../../lib/helpers';
import {
  type ColumnSchemaRole,
  EMPTY_SCHEMA_ROLES,
} from '../../lib/schemaRoles';

import {
  CommentButton,
  DfCell,
  EffectiveCell,
  EffectiveName,
  GridBody,
  GridBodyRow,
  GridEmpty,
  GridHeadRow,
  GridInput,
  GridTable,
  HeadWithHint,
  HintIcon,
  InputResetButton,
  MutedDash,
  RoleCell,
  RoleTag,
  StatusText,
  ToggleSwitch,
} from './SchemaStep.styles';

const NEW_TABLE_GRID_COLUMNS =
  '196px 200px minmax(0, 1fr) 132px 44px 116px 180px';
const NEW_TABLE_GRID_GAP = 12;
const VIRTUALIZATION_THRESHOLD = 80;
const OVERSCAN_PX = 240;

const EFFECTIVE_NAME_HINT =
  'Имя колонки после нормализации: транслитерация, нижний регистр и «_» вместо пробелов. Так колонка будет называться в базе.';

const DATA_TYPE_OPTIONS: DataType[] = [
  'INT',
  'FLOAT',
  'STRING',
  'BOOLEAN',
  'DATETIME',
  'TIMEDELTA',
  'CATEGORY',
  'DICTIONARY',
  'OBJECT',
  'UNKNOWN',
];

const TYPE_MENU_OPTIONS: DropdownOption<DataType>[] = DATA_TYPE_OPTIONS.map(
  option => ({ value: option, label: option })
);

export type ColumnCommentState = {
  value: string | null;
  changed: boolean;
};

type NewTableColumnsTableProps = {
  rows: ResolvedColumnMappingRow[];
  isFiltered: boolean;
  changeStateBySource: Map<string, ColumnMappingChangeState>;
  sourceDtypeBySource: Map<string, DataType | string>;
  schemaRolesByTarget: Map<string, ColumnSchemaRole[]>;
  initialTargetNames: ReadonlyMap<string, string>;
  resolveStates: Record<string, ColumnResolveState>;
  pendingSourceKeys: string[];
  resolvingSourceKeys: string[];
  flashingSourceKeys: string[];
  getComment: (sourceName: string) => ColumnCommentState;
  commentsDisabledReason: string | null;
  activeCommentSource: string | null;
  onOpenComment: (sourceName: string) => void;
  onNullableChange: (sourceName: string, checked: boolean) => void;
  onTargetNameBlur: (sourceName: string, value: string) => void;
  onTargetNameCancel: (sourceName: string) => void;
  onTargetNameChange: (sourceName: string, value: string) => void;
  onTargetNameReset: (sourceName: string) => void;
  onTypeChange: (sourceName: string, value: DataType) => void;
};

type RowProps = {
  item: ResolvedColumnMappingRow;
  first: boolean;
  sourceDtype: DataType | string;
  schemaRoles: ColumnSchemaRole[];
  isActive: boolean;
  isTypeMenuOpen: boolean;
  resolveState: ColumnResolveState;
  isPending: boolean;
  isResolving: boolean;
  isFlashing: boolean;
  canResetTargetName: boolean;
  changeState: ColumnMappingChangeState | undefined;
  comment: ColumnCommentState;
  commentsDisabledReason: string | null;
  onOpenComment: (sourceName: string) => void;
  onOpenTypeMenu: (sourceName: string, anchor: HTMLElement) => void;
  onNullableChange: (sourceName: string, checked: boolean) => void;
  onTargetNameBlur: (sourceName: string, value: string) => void;
  onTargetNameCancel: (sourceName: string) => void;
  onTargetNameChange: (sourceName: string, value: string) => void;
  onTargetNameReset: (sourceName: string) => void;
};

const getRequestedTargetName = (item: ResolvedColumnMappingRow) =>
  item.requested_target_name ??
  item.effective_target_name ??
  item.db_name ??
  '';

const getRowKey = (item: ResolvedColumnMappingRow, index: number) =>
  item.source_name ?? item.db_name ?? `${item.status}:${index}`;

const NewTableColumnRow = memo(
  ({
    item,
    first,
    sourceDtype,
    schemaRoles,
    isActive,
    isTypeMenuOpen,
    resolveState,
    isPending,
    isResolving,
    isFlashing,
    canResetTargetName,
    changeState,
    comment,
    commentsDisabledReason,
    onOpenComment,
    onOpenTypeMenu,
    onNullableChange,
    onTargetNameBlur,
    onTargetNameCancel,
    onTargetNameChange,
    onTargetNameReset,
  }: RowProps) => {
    const sourceName = item.source_name ?? '';
    const isDbOnly = !item.source_name;
    const requestedTargetName = getRequestedTargetName(item);
    const isTargetEmpty = !isDbOnly && !requestedTargetName.trim();
    const effectiveName = getResolvedTargetName(item) ?? item.db_name ?? null;
    const isLoading = resolveState === 'loading' || isResolving;
    const isStale = isLoading || resolveState === 'dirty' || isPending;
    const isFresh = !isStale && (resolveState === 'flash' || isFlashing);
    const columnLabel = requestedTargetName || sourceName;

    return (
      <GridBodyRow
        role='row'
        columns={NEW_TABLE_GRID_COLUMNS}
        gap={NEW_TABLE_GRID_GAP}
        active={isActive}
        data-first-row={first}
        data-source-name={sourceName}
      >
        <DfCell role='cell'>
          {isDbOnly ? (
            <MutedDash>только в БД</MutedDash>
          ) : (
            <span className='df-name' title={sourceName}>
              {sourceName}
            </span>
          )}
          <span className='df-type'>{String(sourceDtype).toLowerCase()}</span>
        </DfCell>

        <span role='cell'>
          {isDbOnly ? (
            <MutedDash>—</MutedDash>
          ) : (
            <GridInput
              className='grid-input'
              changed={Boolean(changeState?.targetNameChanged)}
              invalid={isTargetEmpty}
            >
              <input
                value={requestedTargetName}
                onChange={event =>
                  onTargetNameChange(sourceName, event.target.value)
                }
                onBlur={() => onTargetNameBlur(sourceName, requestedTargetName)}
                onKeyDown={event => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    onTargetNameBlur(sourceName, requestedTargetName);
                    event.currentTarget.blur();
                  } else if (event.key === 'Escape') {
                    event.preventDefault();
                    event.stopPropagation();
                    onTargetNameCancel(sourceName);
                  }
                }}
                placeholder='target_name'
                aria-label={`Колонка DB для ${sourceName}`}
                aria-invalid={isTargetEmpty}
                title={
                  isTargetEmpty ? 'Название колонки DB обязательно' : undefined
                }
                spellCheck={false}
                autoComplete='off'
              />
              {canResetTargetName ? (
                <InputResetButton
                  type='button'
                  className='input-reset'
                  aria-label={`Сбросить имя колонки DB для ${sourceName}`}
                  title='Вернуть исходное имя'
                  onMouseDown={event => event.preventDefault()}
                  onClick={() => onTargetNameReset(sourceName)}
                >
                  <CloseIcon size={10} />
                </InputResetButton>
              ) : null}
            </GridInput>
          )}
        </span>

        <EffectiveCell role='cell' aria-busy={isLoading}>
          {isLoading ? (
            <Spinner size={11} role='status' aria-label='Определяем имя в БД' />
          ) : null}
          {isTargetEmpty && !isLoading ? (
            <StatusText tone='error'>Пустое имя</StatusText>
          ) : (
            <EffectiveName
              stale={isStale}
              fresh={isFresh}
              title={effectiveName ?? undefined}
            >
              {effectiveName ?? '—'}
            </EffectiveName>
          )}
        </EffectiveCell>

        <span role='cell'>
          <SelectButton
            type='button'
            mono
            open={isTypeMenuOpen}
            changed={Boolean(changeState?.dtypeChanged)}
            disabled={isDbOnly}
            aria-haspopup='listbox'
            aria-expanded={isTypeMenuOpen}
            aria-label={`Тип колонки ${columnLabel}`}
            onClick={event => onOpenTypeMenu(sourceName, event.currentTarget)}
          >
            <SelectButtonContent>{item.dtype ?? 'UNKNOWN'}</SelectButtonContent>
          </SelectButton>
        </span>

        <span role='cell'>
          <ToggleSwitch
            type='button'
            role='switch'
            checked={Boolean(item.nullable)}
            changed={Boolean(changeState?.nullableChanged)}
            aria-checked={Boolean(item.nullable)}
            aria-label={`Nullable for ${requestedTargetName}`}
            disabled={isDbOnly}
            onClick={() => onNullableChange(sourceName, !item.nullable)}
          />
        </span>

        <RoleCell role='cell'>
          {schemaRoles.length > 0 ? (
            schemaRoles.map(role => (
              <RoleTag key={role.key} title={role.title}>
                {role.label}
              </RoleTag>
            ))
          ) : (
            <MutedDash>—</MutedDash>
          )}
        </RoleCell>

        <span role='cell'>
          <CommentButton
            type='button'
            changed={comment.changed}
            active={isActive}
            disabled={isDbOnly || Boolean(commentsDisabledReason)}
            title={commentsDisabledReason ?? comment.value ?? undefined}
            aria-label={`Комментарий колонки ${columnLabel}`}
            onClick={() => onOpenComment(sourceName)}
          >
            {comment.value ? (
              <span className='comment-text'>{comment.value}</span>
            ) : (
              <span className='comment-placeholder'>Комментарий</span>
            )}
          </CommentButton>
        </span>
      </GridBodyRow>
    );
  }
);

NewTableColumnRow.displayName = 'NewTableColumnRow';

const VirtualScroller = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<'div'>
>(({ style, ...props }, ref) => (
  <GridBody {...props} ref={ref} style={{ ...style, paddingBottom: 0 }} />
));

VirtualScroller.displayName = 'NewTableColumnsVirtualScroller';

const VIRTUOSO_COMPONENTS = { Scroller: VirtualScroller };

/** Таблица колонок новой таблицы (макет WdbStep2New, «Конструктор»). */
export const NewTableColumnsTable = ({
  rows,
  isFiltered,
  changeStateBySource,
  sourceDtypeBySource,
  schemaRolesByTarget,
  initialTargetNames,
  resolveStates,
  pendingSourceKeys,
  resolvingSourceKeys,
  flashingSourceKeys,
  getComment,
  commentsDisabledReason,
  activeCommentSource,
  onOpenComment,
  onNullableChange,
  onTargetNameBlur,
  onTargetNameCancel,
  onTargetNameChange,
  onTargetNameReset,
  onTypeChange,
}: NewTableColumnsTableProps) => {
  const [typeMenu, setTypeMenu] = useState<{
    sourceName: string;
    anchor: HTMLElement;
  } | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);
  const virtuosoRef = useRef<VirtuosoHandle | null>(null);
  const shouldVirtualize = rows.length >= VIRTUALIZATION_THRESHOLD;
  const activeKey = normalizeName(activeCommentSource);

  const activeIndex = useMemo(
    () =>
      activeKey
        ? rows.findIndex(item => normalizeName(item.source_name) === activeKey)
        : -1,
    [activeKey, rows]
  );

  // Строка, открытая в панели комментария, всегда видна в таблице.
  useEffect(() => {
    if (activeIndex < 0) return;
    const frame = requestAnimationFrame(() => {
      if (shouldVirtualize) {
        virtuosoRef.current?.scrollToIndex({
          index: activeIndex,
          align: 'center',
          behavior: 'smooth',
        });
        return;
      }
      const rowElement = bodyRef.current?.children[activeIndex];
      if (rowElement instanceof HTMLElement) {
        rowElement.scrollIntoView?.({ block: 'nearest' });
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [activeIndex, shouldVirtualize]);

  const handleOpenTypeMenu = useCallback(
    (sourceName: string, anchor: HTMLElement) => {
      setTypeMenu(current =>
        current?.sourceName === sourceName ? null : { sourceName, anchor }
      );
    },
    []
  );

  const typeMenuItem = typeMenu
    ? rows.find(
        item =>
          normalizeName(item.source_name) === normalizeName(typeMenu.sourceName)
      )
    : undefined;

  const renderRow = (item: ResolvedColumnMappingRow, index: number) => {
    const sourceName = item.source_name ?? '';
    const sourceKey = normalizeName(sourceName);
    const requestedTargetName = getRequestedTargetName(item);
    const initialTargetName = initialTargetNames.get(sourceKey);
    return (
      <NewTableColumnRow
        key={getRowKey(item, index)}
        item={item}
        first={index === 0}
        sourceDtype={sourceDtypeBySource.get(sourceKey) ?? item.dtype ?? ''}
        schemaRoles={
          schemaRolesByTarget.get(normalizeName(getResolvedTargetName(item))) ??
          EMPTY_SCHEMA_ROLES
        }
        isActive={Boolean(sourceKey) && sourceKey === activeKey}
        isTypeMenuOpen={
          Boolean(typeMenu) && normalizeName(typeMenu?.sourceName) === sourceKey
        }
        resolveState={resolveStates[sourceKey] ?? 'idle'}
        isPending={pendingSourceKeys.includes(sourceKey)}
        isResolving={resolvingSourceKeys.includes(sourceKey)}
        isFlashing={flashingSourceKeys.includes(sourceKey)}
        canResetTargetName={
          initialTargetName !== undefined &&
          requestedTargetName !== initialTargetName
        }
        changeState={changeStateBySource.get(sourceKey)}
        comment={getComment(sourceName)}
        commentsDisabledReason={commentsDisabledReason}
        onOpenComment={onOpenComment}
        onOpenTypeMenu={handleOpenTypeMenu}
        onNullableChange={onNullableChange}
        onTargetNameBlur={onTargetNameBlur}
        onTargetNameCancel={onTargetNameCancel}
        onTargetNameChange={onTargetNameChange}
        onTargetNameReset={onTargetNameReset}
      />
    );
  };

  return (
    <GridTable role='table' aria-label='Колонки новой таблицы'>
      <GridHeadRow
        role='row'
        columns={NEW_TABLE_GRID_COLUMNS}
        gap={NEW_TABLE_GRID_GAP}
      >
        <span role='columnheader'>Колонка DataFrame</span>
        <span role='columnheader'>Колонка в таблице</span>
        <HeadWithHint role='columnheader'>
          Имя в БД
          <HintIcon tabIndex={0} aria-label='Что такое имя в БД'>
            <InfoIcon />
            <span className='hint-tip' role='tooltip'>
              {EFFECTIVE_NAME_HINT}
            </span>
          </HintIcon>
        </HeadWithHint>
        <span role='columnheader'>Тип</span>
        <span role='columnheader'>NULL</span>
        <span role='columnheader'>Роль</span>
        <span role='columnheader'>Комментарий</span>
      </GridHeadRow>

      {rows.length === 0 ? (
        <GridEmpty>
          {isFiltered ? 'Колонки не найдены' : 'В DataFrame нет колонок'}
        </GridEmpty>
      ) : shouldVirtualize ? (
        <Virtuoso
          ref={virtuosoRef}
          data={rows}
          style={{ flex: 1, minHeight: 0 }}
          overscan={OVERSCAN_PX}
          increaseViewportBy={{ top: OVERSCAN_PX, bottom: OVERSCAN_PX * 2 }}
          computeItemKey={(index, item) => getRowKey(item, index)}
          components={VIRTUOSO_COMPONENTS}
          itemContent={(index, item) => renderRow(item, index)}
        />
      ) : (
        <GridBody ref={bodyRef}>
          {rows.map((item, index) => renderRow(item, index))}
        </GridBody>
      )}

      <DropdownMenu
        anchorEl={typeMenu?.anchor ?? null}
        open={Boolean(typeMenu && typeMenuItem)}
        onClose={() => setTypeMenu(null)}
        options={TYPE_MENU_OPTIONS}
        value={(typeMenuItem?.dtype ?? null) as DataType | null}
        onSelect={value => {
          if (typeMenu) onTypeChange(typeMenu.sourceName, value);
        }}
        ariaLabel='Тип колонки'
        mono
      />
    </GridTable>
  );
};
