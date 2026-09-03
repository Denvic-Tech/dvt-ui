import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Key as KeyIcon, Search as SearchIconMui } from '@mui/icons-material';
import { Box } from '@mui/material';

import { Column } from '@/shared/gatewayClient';

import {
  CleanCard,
  ColumnName,
  EmptyState,
  ErrorBanner,
  ErrorLink,
  IndexBadge,
  RenameInput,
  SearchContainer,
  SearchIcon,
  SearchInput,
  SearchInputWrapper,
  StyledTable,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableScrollContainer,
  TypeBadge,
} from './ColumnRenameTable.styles';

interface ColumnRenameTableProps {
  columns: Column[];
  columnRenames: { [originalName: string]: string };
  onColumnRename: (originalName: string, newName: string) => void;
  columnErrors?: Record<string, { empty?: boolean; duplicate?: boolean }>;
  errorFocusKey?: string | null;
  errorFocusRequestId?: number;
}

export const ColumnRenameTable: React.FC<ColumnRenameTableProps> = ({
  columns,
  columnRenames,
  onColumnRename,
  columnErrors,
  errorFocusKey,
  errorFocusRequestId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleNameChange = (originalName: string, newName: string) => {
    onColumnRename(originalName, newName);
  };

  const columnsWithRenames = useMemo(
    () =>
      columns.map(column => ({
        id: column.name,
        originalName: column.name,
        newName: columnRenames[column.name],
        type: column.dtype,
        isIndex: Boolean(column.index),
      })),
    [columns, columnRenames]
  );

  const filteredColumns = useMemo(() => {
    if (!searchQuery.trim()) return columnsWithRenames;

    const query = searchQuery.toLowerCase();
    return columnsWithRenames.filter(column => {
      return (
        column.originalName.toLowerCase().includes(query) ||
        (column.newName ?? '').toLowerCase().includes(query)
      );
    });
  }, [columnsWithRenames, searchQuery]);

  const errorSummary = useMemo(() => {
    if (!columnErrors) return null;

    let emptyCount = 0;
    let duplicateCount = 0;

    Object.values(columnErrors).forEach(error => {
      if (error?.empty) emptyCount += 1;
      if (error?.duplicate) duplicateCount += 1;
    });

    if (emptyCount === 0 && duplicateCount === 0) return null;

    const parts: string[] = [];
    if (emptyCount > 0) parts.push(`пустые имена: ${emptyCount}`);
    if (duplicateCount > 0) parts.push(`дубликаты: ${duplicateCount}`);

    return `Есть ошибки (${parts.join(', ')}). Исправьте, чтобы сохранить.`;
  }, [columnErrors]);

  const firstErrorKey = useMemo(() => {
    if (!columnErrors) return null;

    return (
      columns.find(column => {
        const error = columnErrors[column.name];
        return Boolean(error?.empty || error?.duplicate);
      })?.name ?? null
    );
  }, [columns, columnErrors]);

  const handleErrorNavigate = useCallback(() => {
    if (!firstErrorKey) return;

    const input = inputRefs.current[firstErrorKey];
    if (!input) return;

    input.scrollIntoView({ block: 'center' });
    input.focus();
  }, [firstErrorKey]);

  useEffect(() => {
    if (!errorFocusKey) return;

    const input = inputRefs.current[errorFocusKey];
    if (!input) return;

    input.scrollIntoView({ block: 'center' });
    input.focus();
  }, [errorFocusKey, errorFocusRequestId]);

  return (
    <Box sx={{ height: '100%', width: '100%', minHeight: 0, display: 'flex' }}>
      <CleanCard>
        <SearchContainer>
          <SearchInputWrapper>
            <SearchIcon>
              <SearchIconMui fontSize='small' />
            </SearchIcon>
            <SearchInput
              type='text'
              placeholder='Поиск колонок...'
              value={searchQuery}
              onChange={event => setSearchQuery(event.target.value)}
            />
          </SearchInputWrapper>
          {errorSummary && (
            <ErrorBanner>
              {errorSummary}
              {firstErrorKey && (
                <ErrorLink type='button' onClick={handleErrorNavigate}>
                  Перейти к ошибке
                </ErrorLink>
              )}
            </ErrorBanner>
          )}
        </SearchContainer>

        <TableScrollContainer>
          {filteredColumns.length === 0 ? (
            <EmptyState>Колонки не найдены</EmptyState>
          ) : (
            <StyledTable>
              <TableHeader>
                <tr>
                  <TableHeaderCell>Оригинальное имя</TableHeaderCell>
                  <TableHeaderCell>Тип данных</TableHeaderCell>
                  <TableHeaderCell>Новое имя</TableHeaderCell>
                </tr>
              </TableHeader>
              <TableBody>
                {filteredColumns.map(column => {
                  const displayName =
                    column.newName !== undefined
                      ? column.newName
                      : column.originalName;
                  const hasError = Boolean(
                    columnErrors?.[column.originalName]?.empty ||
                    columnErrors?.[column.originalName]?.duplicate
                  );

                  return (
                    <tr key={column.id}>
                      <TableCell>
                        <Box display='flex' alignItems='center' gap={1}>
                          <ColumnName>{column.originalName}</ColumnName>
                          {column.isIndex && (
                            <IndexBadge>
                              <KeyIcon />
                              Index
                            </IndexBadge>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <TypeBadge dataType={column.type}>
                          {column.type}
                        </TypeBadge>
                      </TableCell>
                      <TableCell>
                        <RenameInput
                          type='text'
                          value={displayName}
                          placeholder={column.originalName}
                          hasError={hasError}
                          aria-invalid={hasError}
                          ref={input =>
                            (inputRefs.current[column.originalName] = input)
                          }
                          onChange={event =>
                            handleNameChange(
                              column.originalName,
                              event.target.value
                            )
                          }
                        />
                      </TableCell>
                    </tr>
                  );
                })}
              </TableBody>
            </StyledTable>
          )}
        </TableScrollContainer>
      </CleanCard>
    </Box>
  );
};

// TODO: move to extension
