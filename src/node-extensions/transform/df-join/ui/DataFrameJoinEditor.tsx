import React, {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Alert } from '@mui/material';

import { NodeModalExtensionProps } from '@/app/providers/node-extensions/lib/types';

import { useNodeConnections } from '@/features/node/get-node-connections';

import type { DataFrameMetadata } from '@/shared/gatewayClient';

import {
  getDataType,
  getTypeIcon,
  matchesSearch,
  normalizeSearchText,
} from './helpers';
import {
  ActionButtons,
  AutomapButton,
  ColumnName,
  DraggableItem,
  DragHandle,
  DropZone,
  DropZoneLabel,
  EditorRoot,
  EmptyMessage,
  EmptyState,
  FieldLabel,
  JOIN_TYPE_MENU_PROPS,
  JoinTypeSection,
  LeftCell,
  MapperContainer,
  MapperHeader,
  MapperHeaderLabel,
  MapperRow,
  MapperScrollArea,
  PanelsGrid,
  PanelsSection,
  ResetButton,
  RightCellContent,
  RightPanel,
  RightPanelHeader,
  RightPanelList,
  RightPanelTitle,
  SearchContainer,
  SearchField,
  SearchIcon,
  StatsRow,
  StatValue,
  StyledFormControl,
  StyledMenuItem,
  StyledSelect,
  Toolbar,
  TypeBadge,
  TypeIconLabel,
  UnmapButton,
  ValidationList,
} from './styles';

interface DataFrameJoinValues {
  left_on?: string[] | undefined;
  right_on?: string[] | undefined;
  how?: string | undefined;
}

const SearchGlyph = () => (
  <SearchIcon width='13' height='13' viewBox='0 0 14 14' fill='none'>
    <circle cx='6' cy='6' r='4.5' stroke='#9ca3af' strokeWidth='1.3' />
    <path
      d='M9.5 9.5L13 13'
      stroke='#9ca3af'
      strokeWidth='1.3'
      strokeLinecap='round'
    />
  </SearchIcon>
);

const AutomapGlyph = () => (
  <svg width='14' height='14' viewBox='0 0 14 14' fill='none'>
    <path
      d='M2 7h4l1.5-3L9 10l1.5-3H14'
      stroke='#6366f1'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

const DragHandleGlyph = () => (
  <DragHandle width='10' height='10' viewBox='0 0 10 10' fill='none'>
    <circle cx='3' cy='3' r='1' fill='#d1d5db' />
    <circle cx='7' cy='3' r='1' fill='#d1d5db' />
    <circle cx='3' cy='7' r='1' fill='#d1d5db' />
    <circle cx='7' cy='7' r='1' fill='#d1d5db' />
  </DragHandle>
);

const MappingArrow: React.FC<{ mapped: boolean }> = ({ mapped }) => (
  <svg
    width='16'
    height='16'
    viewBox='0 0 16 16'
    fill='none'
    style={{ flexShrink: 0 }}
  >
    <path
      d='M3 8h10M10 5l3 3-3 3'
      stroke={mapped ? '#10b981' : '#d1d5db'}
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

export const DataFrameJoinEditor: React.FC<
  NodeModalExtensionProps<DataFrameJoinValues>
> = ({
  id: nodeID,
  localInputData: localValues,
  setLocalInputData: setLocalValues,
  setValidationCallback,
  nodeDefinition,
}) => {
  const { getConnectedInputMetadata } = useNodeConnections(nodeID);

  const joinTypes = useMemo(() => {
    const howInput = nodeDefinition.input_definitions?.['how'];
    if (howInput?.options) {
      return howInput.options.map(option => ({ value: option, label: option }));
    }

    return [
      { value: 'inner', label: 'inner' },
      { value: 'left', label: 'left' },
      { value: 'right', label: 'right' },
      { value: 'outer', label: 'outer' },
    ];
  }, [nodeDefinition]);

  const leftMetadata: DataFrameMetadata | undefined = useMemo(
    () => getConnectedInputMetadata('left') as DataFrameMetadata | undefined,
    [getConnectedInputMetadata]
  );
  const rightMetadata: DataFrameMetadata | undefined = useMemo(
    () => getConnectedInputMetadata('right') as DataFrameMetadata | undefined,
    [getConnectedInputMetadata]
  );

  const leftColumns = useMemo(
    () => leftMetadata?.columns ?? [],
    [leftMetadata]
  );
  const rightColumns = useMemo(
    () => rightMetadata?.columns ?? [],
    [rightMetadata]
  );
  const rightColumnsByName = useMemo(
    () => Object.fromEntries(rightColumns.map(column => [column.name, column])),
    [rightColumns]
  );
  const rightIndexByName = useMemo(
    () => new Map(rightColumns.map((column, index) => [column.name, index])),
    [rightColumns]
  );

  const [rightOrder, setRightOrder] = useState<(string | null)[]>([]);
  const [rightSearch, setRightSearch] = useState('');
  const [leftSearch, setLeftSearch] = useState('');
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const deferredLeftSearch = useDeferredValue(leftSearch);
  const deferredRightSearch = useDeferredValue(rightSearch);

  useEffect(() => {
    if (!leftColumns.length) {
      setRightOrder([]);
      return;
    }

    const map = new Map<string, string>();
    const leftOn = localValues.left_on ?? [];
    const rightOn = localValues.right_on ?? [];
    const limit = Math.min(leftOn.length, rightOn.length);

    for (let index = 0; index < limit; index += 1) {
      map.set(leftOn[index], rightOn[index]);
    }

    const aligned = leftColumns.map(
      leftColumn => map.get(leftColumn.name) ?? null
    );
    setRightOrder(aligned);
  }, [leftColumns, localValues.left_on, localValues.right_on]);

  const rightPool = useMemo(() => {
    const used = new Set(rightOrder.filter(Boolean) as string[]);
    return rightColumns
      .map(column => column.name)
      .filter(name => !used.has(name));
  }, [rightColumns, rightOrder]);

  const rebuildPairsFromRightOrder = useCallback(
    (order: (string | null)[]) => {
      const left_on: string[] = [];
      const right_on: string[] = [];

      for (let index = 0; index < leftColumns.length; index += 1) {
        const rightName = order[index];
        if (!rightName) {
          continue;
        }

        left_on.push(leftColumns[index].name);
        right_on.push(rightName);
      }

      setLocalValues(prev => ({
        ...prev,
        left_on: left_on.length ? left_on : undefined,
        right_on: right_on.length ? right_on : undefined,
      }));
    },
    [leftColumns, setLocalValues]
  );

  const autoMap = useCallback(() => {
    if (!leftColumns.length || !rightColumns.length) {
      return;
    }

    const next = leftColumns.map(leftColumn => {
      const rightColumn = rightColumnsByName[leftColumn.name];
      const leftType = leftColumn?.dtype?.toLowerCase?.();
      const rightType = rightColumn?.dtype?.toLowerCase?.();
      return rightColumn && leftType && rightType && leftType === rightType
        ? rightColumn.name
        : null;
    });

    if (next.some(Boolean)) {
      setRightOrder(next);
      rebuildPairsFromRightOrder(next);
    }
  }, [
    leftColumns,
    rebuildPairsFromRightOrder,
    rightColumns.length,
    rightColumnsByName,
  ]);

  const draggingPayloadRef = useRef<{
    type: 'mapped' | 'pool';
    index?: number;
    name?: string;
  } | null>(null);

  const clearDragState = useCallback(() => {
    draggingPayloadRef.current = null;
    setDraggingIdx(null);
    setDragOverIdx(null);
  }, []);

  const resetMappings = useCallback(() => {
    const next = leftColumns.map(() => null);
    setRightOrder(next);
    rebuildPairsFromRightOrder(next);
    clearDragState();
  }, [clearDragState, leftColumns, rebuildPairsFromRightOrder]);

  const onRowDragStart = (rowIdx: number) => (event: React.DragEvent) => {
    const mappedName = rightOrder[rowIdx];
    if (!mappedName) {
      return;
    }

    draggingPayloadRef.current = { type: 'mapped', index: rowIdx };
    setDraggingIdx(rightIndexByName.get(mappedName) ?? null);
    event.dataTransfer.effectAllowed = 'move';
  };

  const onPoolDragStart = (name: string) => (event: React.DragEvent) => {
    draggingPayloadRef.current = { type: 'pool', name };
    setDraggingIdx(rightIndexByName.get(name) ?? null);
    event.dataTransfer.effectAllowed = 'copyMove';
  };

  const onDragOverRow = (overIdx: number) => (event: React.DragEvent) => {
    event.preventDefault();
    if (draggingPayloadRef.current) {
      setDragOverIdx(overIdx);
    }
  };

  const onDragLeaveRow = (overIdx: number) => () => {
    setDragOverIdx(current => (current === overIdx ? null : current));
  };

  const onDropOnRow = (overIdx: number) => (event: React.DragEvent) => {
    event.preventDefault();
    const payload = draggingPayloadRef.current;
    if (!payload) {
      return;
    }

    setRightOrder(prev => {
      const next = prev.slice();

      const placeName = (name: string) => {
        const fromIdx = next.findIndex(value => value === name);
        if (fromIdx !== -1) {
          next[fromIdx] = null;
        }
        next[overIdx] = name;
      };

      if (payload.type === 'mapped' && payload.index != null) {
        const name = prev[payload.index];
        if (name) {
          const swapped = next[overIdx];
          next[overIdx] = name;
          next[payload.index] = swapped ?? null;
        }
      } else if (payload.type === 'pool' && payload.name) {
        placeName(payload.name);
      }

      rebuildPairsFromRightOrder(next);
      return next;
    });

    clearDragState();
  };

  const unlinkRow = (idx: number) => () => {
    setRightOrder(prev => {
      const next = prev.slice();
      next[idx] = null;
      rebuildPairsFromRightOrder(next);
      return next;
    });
  };

  const handleJoinTypeChange = useCallback(
    (event: any) => {
      const value = event.target.value as string;
      setLocalValues(prev => ({ ...prev, how: value }));
    },
    [setLocalValues]
  );

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const validate = useCallback(() => {
    const errors: string[] = [];

    const pairs = leftColumns
      .map((leftColumn, index) => ({
        left: leftColumn,
        rightName: rightOrder[index],
      }))
      .filter(pair => !!pair.rightName);

    if (!pairs.length) {
      errors.push('Нужно задать минимум одну пару ключей для join.');
    }

    for (const pair of pairs) {
      const rightName = pair.rightName as string;
      const rightColumn = rightColumnsByName[rightName];
      if (
        rightColumn &&
        pair.left.dtype &&
        rightColumn.dtype &&
        pair.left.dtype !== rightColumn.dtype
      ) {
        errors.push(
          `Несовпадение типов: ${pair.left.name} (${pair.left.dtype}) ↔ ${rightName} (${rightColumn.dtype})`
        );
      }
    }

    setValidationErrors(errors);
    return errors.length === 0;
  }, [leftColumns, rightOrder, rightColumnsByName]);

  useEffect(() => {
    setValidationCallback?.(() => validate);
  }, [setValidationCallback, validate]);

  const filteredLeftRows = useMemo(() => {
    const query = normalizeSearchText(deferredLeftSearch);
    return leftColumns
      .map((column, index) => ({ column, index }))
      .filter(({ column }) => matchesSearch(column.name, query));
  }, [deferredLeftSearch, leftColumns]);

  const filteredRightPool = useMemo(() => {
    const query = normalizeSearchText(deferredRightSearch);
    const used = new Set(rightOrder.filter(Boolean) as string[]);

    return rightColumns
      .map((column, index) => ({ column, index }))
      .filter(({ column }) => !used.has(column.name))
      .filter(({ column }) => matchesSearch(column.name, query));
  }, [deferredRightSearch, rightColumns, rightOrder]);

  const mappedCount = rightOrder.filter(Boolean).length;
  const unmappedCount = rightPool.length;
  const totalCount = rightColumns.length;

  if (!leftMetadata || !rightMetadata) {
    return <EmptyMessage>Нет метаданных. Подключите оба входа.</EmptyMessage>;
  }

  return (
    <EditorRoot>
      {validationErrors.length > 0 && (
        <Alert severity='error'>
          <ValidationList>
            {validationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ValidationList>
        </Alert>
      )}

      <JoinTypeSection>
        <FieldLabel>Тип объединения</FieldLabel>
        <StyledFormControl size='small' fullWidth>
          <StyledSelect
            value={localValues.how || ''}
            onChange={handleJoinTypeChange}
            displayEmpty
            inputProps={{ 'aria-label': 'Тип объединения' }}
            MenuProps={JOIN_TYPE_MENU_PROPS}
          >
            {joinTypes.map(type => (
              <StyledMenuItem key={type.value} value={type.value}>
                {type.label}
              </StyledMenuItem>
            ))}
          </StyledSelect>
        </StyledFormControl>
      </JoinTypeSection>

      <PanelsSection>
        <Toolbar>
          <StatsRow>
            <span>
              Mapped: <StatValue $variant='mapped'>{mappedCount}</StatValue>
            </span>
            <span>
              Unmapped:{' '}
              <StatValue $variant='unmapped'>{unmappedCount}</StatValue>
            </span>
            <span>
              Total: <StatValue $variant='total'>{totalCount}</StatValue>
            </span>
          </StatsRow>
          <ActionButtons>
            <ResetButton
              type='button'
              onClick={resetMappings}
              disabled={mappedCount === 0}
            >
              Reset
            </ResetButton>
            <AutomapButton type='button' onClick={autoMap}>
              <AutomapGlyph />
              Automap
            </AutomapButton>
          </ActionButtons>
        </Toolbar>

        <PanelsGrid>
          <MapperContainer>
            <MapperHeader>
              <SearchContainer>
                <SearchGlyph />
                <SearchField
                  value={leftSearch}
                  onChange={event => setLeftSearch(event.target.value)}
                  placeholder='Search left...'
                  aria-label='Search left columns'
                />
              </SearchContainer>
              <span />
              <MapperHeaderLabel>Right column</MapperHeaderLabel>
            </MapperHeader>

            <MapperScrollArea>
              {filteredLeftRows.map(({ column, index }) => {
                const mappedColumnName = rightOrder[index];
                const mappedColumn = mappedColumnName
                  ? (rightColumnsByName[mappedColumnName] ?? null)
                  : null;
                const isDragOver = dragOverIdx === index && !mappedColumn;

                return (
                  <MapperRow key={column.name} isMapped={!!mappedColumn}>
                    <LeftCell>
                      <TypeIconLabel>{getTypeIcon(column.dtype)}</TypeIconLabel>
                      <ColumnName title={column.name}>{column.name}</ColumnName>
                      <TypeBadge dataType={getDataType(column)}>
                        {getDataType(column)}
                      </TypeBadge>
                    </LeftCell>

                    <MappingArrow mapped={!!mappedColumn} />

                    <DropZone
                      isMapped={!!mappedColumn}
                      isDragOver={isDragOver}
                      draggable={!!mappedColumn}
                      onDragStart={onRowDragStart(index)}
                      onDragEnd={clearDragState}
                      onDragOver={onDragOverRow(index)}
                      onDragLeave={onDragLeaveRow(index)}
                      onDrop={onDropOnRow(index)}
                      title={
                        mappedColumn
                          ? 'Перетащи, чтобы сменить соответствие'
                          : 'Перетащи правую колонку сюда'
                      }
                    >
                      {mappedColumn ? (
                        <>
                          <RightCellContent>
                            <ColumnName title={mappedColumn.name}>
                              {mappedColumn.name}
                            </ColumnName>
                            <TypeBadge dataType={getDataType(mappedColumn)}>
                              {getDataType(mappedColumn)}
                            </TypeBadge>
                          </RightCellContent>
                          <UnmapButton
                            width='12'
                            height='12'
                            viewBox='0 0 12 12'
                            fill='none'
                            onClick={unlinkRow(index)}
                          >
                            <path
                              d='M3 3l6 6M9 3l-6 6'
                              stroke='#9ca3af'
                              strokeWidth='1.3'
                              strokeLinecap='round'
                            />
                          </UnmapButton>
                        </>
                      ) : (
                        <DropZoneLabel>
                          {isDragOver ? 'Drop here' : 'Drag from right →'}
                        </DropZoneLabel>
                      )}
                    </DropZone>
                  </MapperRow>
                );
              })}

              {filteredLeftRows.length === 0 && (
                <EmptyState>Not found</EmptyState>
              )}
            </MapperScrollArea>
          </MapperContainer>

          <RightPanel>
            <RightPanelHeader>
              <RightPanelTitle>
                Right columns ({filteredRightPool.length})
              </RightPanelTitle>
              <SearchContainer>
                <SearchGlyph />
                <SearchField
                  value={rightSearch}
                  onChange={event => setRightSearch(event.target.value)}
                  placeholder='Search...'
                  aria-label='Search right columns'
                />
              </SearchContainer>
            </RightPanelHeader>

            <RightPanelList>
              {filteredRightPool.map(({ column, index }) => (
                <DraggableItem
                  key={column.name}
                  draggable
                  isDragging={draggingIdx === index}
                  onDragStart={onPoolDragStart(column.name)}
                  onDragEnd={clearDragState}
                  title='Перетащи на соответствующую левую колонку'
                >
                  <DragHandleGlyph />
                  <TypeIconLabel>{getTypeIcon(column.dtype)}</TypeIconLabel>
                  <ColumnName title={column.name}>{column.name}</ColumnName>
                  <TypeBadge dataType={getDataType(column)}>
                    {getDataType(column)}
                  </TypeBadge>
                </DraggableItem>
              ))}

              {filteredRightPool.length === 0 && (
                <EmptyState>
                  {rightSearch ? 'Not found' : 'All mapped'}
                </EmptyState>
              )}
            </RightPanelList>
          </RightPanel>
        </PanelsGrid>
      </PanelsSection>
    </EditorRoot>
  );
};
