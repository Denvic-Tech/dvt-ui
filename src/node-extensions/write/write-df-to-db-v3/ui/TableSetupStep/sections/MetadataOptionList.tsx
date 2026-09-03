import React, { useMemo, useState } from 'react';
import SearchIcon from '@mui/icons-material/Search';
import { Box, Button, CircularProgress, Typography } from '@mui/material';

import type { CatalogListUiProps } from '@/features/node/db-target-selector';

import {
  SchemaItem,
  SchemaItemIcon,
  SchemaItemLeft,
  SchemaItemName,
  SchemaItemRight,
  SchemaList,
  SchemaListContainer,
  SchemaRowIndicator,
  SchemaSearchContainer,
  SchemaSearchIcon,
  SchemaSearchInput,
  SchemaSearchInputWrapper,
  SchemaTableCount,
} from '../../styles';

type MetadataOption = {
  label: string;
  tableCount?: number;
  value: string;
};

type MetadataOptionListProps = {
  emptyText: string;
  icon: React.ReactNode;
  onSelect: (value: string) => void;
  options: MetadataOption[];
  searchPlaceholder: string;
  selectedValue?: string | null | undefined;
} & CatalogListUiProps;

export const MetadataOptionList: React.FC<MetadataOptionListProps> = ({
  emptyText,
  icon,
  onSelect,
  options,
  query: controlledQuery,
  onQueryChange,
  state,
  hasNextPage,
  isFetchingNextPage,
  loadMoreError,
  onLoadNextPage,
  onRetry,
  searchPlaceholder,
  selectedValue,
}) => {
  const [localQuery, setLocalQuery] = useState('');
  const isControlledSearch = controlledQuery !== undefined;
  const query = controlledQuery ?? localQuery;
  const setQuery = onQueryChange ?? setLocalQuery;

  const filteredOptions = useMemo(() => {
    if (isControlledSearch) {
      return options;
    }
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return options;
    }

    return options.filter(option =>
      option.label.toLowerCase().includes(normalizedQuery)
    );
  }, [isControlledSearch, options, query]);

  return (
    <SchemaListContainer>
      <SchemaSearchContainer>
        <SchemaSearchInputWrapper>
          <SchemaSearchIcon>
            <SearchIcon />
          </SchemaSearchIcon>
          <SchemaSearchInput
            type='text'
            placeholder={searchPlaceholder}
            value={query}
            onChange={event => setQuery(event.target.value)}
          />
        </SchemaSearchInputWrapper>
      </SchemaSearchContainer>

      <SchemaList>
        {state === 'loading' ? (
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
            <CircularProgress size={20} />
          </Box>
        ) : filteredOptions.length === 0 ? (
          <Box sx={{ p: 2 }}>
            <Typography color='text.secondary'>
              {state === 'unsupported'
                ? 'Этот уровень каталога не поддерживается'
                : state === 'notFound'
                  ? 'Ресурс больше не существует'
                  : state === 'badGateway'
                    ? 'Gateway не смог загрузить каталог (502)'
                    : state === 'gatewayTimeout'
                      ? 'Истекло время загрузки каталога (504)'
                      : state === 'error'
                        ? 'Не удалось загрузить каталог'
                        : emptyText}
            </Typography>
            {onRetry &&
            ['notFound', 'badGateway', 'gatewayTimeout', 'error'].includes(
              state ?? ''
            ) ? (
              <Button size='small' sx={{ mt: 1 }} onClick={onRetry}>
                Повторить
              </Button>
            ) : null}
          </Box>
        ) : (
          filteredOptions.map(option => {
            const selected = selectedValue === option.value;

            return (
              <SchemaItem
                key={option.value}
                selected={selected}
                onClick={() => onSelect(option.value)}
              >
                <SchemaItemLeft>
                  <SchemaItemIcon selected={selected}>{icon}</SchemaItemIcon>
                  <SchemaItemName selected={selected}>
                    {option.label}
                  </SchemaItemName>
                </SchemaItemLeft>

                <SchemaItemRight>
                  {option.tableCount !== undefined ? (
                    <SchemaTableCount>
                      {option.tableCount} таблиц
                    </SchemaTableCount>
                  ) : null}
                  <SchemaRowIndicator selected={selected} />
                </SchemaItemRight>
              </SchemaItem>
            );
          })
        )}
        {hasNextPage ? (
          <Button
            size='small'
            onClick={() => onLoadNextPage?.()}
            disabled={Boolean(isFetchingNextPage)}
          >
            {isFetchingNextPage ? 'Загрузка...' : 'Показать ещё'}
          </Button>
        ) : null}
        {loadMoreError ? (
          <Button size='small' onClick={onRetry}>
            Повторить
          </Button>
        ) : null}
      </SchemaList>
    </SchemaListContainer>
  );
};
