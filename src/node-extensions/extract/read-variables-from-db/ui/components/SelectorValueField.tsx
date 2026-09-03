import { useEffect, useMemo, useRef, useState } from 'react';

import {
  isExpressionValue,
  makeExpressionValue,
} from '@/shared/lib/node-input-values';

import type { SelectorValue } from '../../lib/types';
import {
  FieldHint,
  FieldLabel,
  SelectButton,
  SelectButtonText,
  SelectButtonValue,
  SelectDropdown,
  SelectEmptyState,
  SelectFieldShell,
  SelectOption,
  SelectOptionList,
  SelectOptionMeta,
  SelectSearchInput,
  SelectSearchWrapper,
} from '../styles';

import { ChevronDownIcon, SearchIcon } from './icons';

type SelectorValueFieldProps = {
  helperText?: string | undefined;
  label: string;
  onChange: (nextValue: SelectorValue) => void;
  options?: string[] | undefined;
  placeholder?: string | undefined;
  searchPlaceholder?: string | undefined;
  value: SelectorValue;
};

const getDisplayValue = (value: SelectorValue): string => {
  if (typeof value === 'string') {
    return value;
  }

  if (isExpressionValue(value) && value.expression_kind === 'single') {
    return `=${value.value}`;
  }

  return '';
};

export const SelectorValueField = ({
  helperText,
  label,
  onChange,
  options = [],
  placeholder,
  searchPlaceholder = 'Поиск значения или =expression',
  value,
}: SelectorValueFieldProps) => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  const displayValue = useMemo(() => getDisplayValue(value), [value]);
  const normalizedQuery = query.trim().toLowerCase();

  const filteredOptions = useMemo(() => {
    if (!normalizedQuery) {
      return options;
    }

    return options.filter(option =>
      option.toLowerCase().includes(normalizedQuery)
    );
  }, [normalizedQuery, options]);

  const hasExactMatch = useMemo(
    () => options.some(option => option === query.trim()),
    [options, query]
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    window.addEventListener('mousedown', handlePointerDown);

    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const timer = window.setTimeout(() => {
      searchRef.current?.focus();
      searchRef.current?.select();
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isOpen]);

  const commitValue = (rawValue: string) => {
    const trimmedValue = rawValue.trim();

    if (!trimmedValue) {
      onChange(undefined);
      setIsOpen(false);
      return;
    }

    if (trimmedValue.startsWith('=')) {
      onChange(
        makeExpressionValue(trimmedValue.slice(1).trimStart(), 'single')
      );
      setIsOpen(false);
      return;
    }

    onChange(trimmedValue);
    setIsOpen(false);
  };

  const handleToggleOpen = () => {
    setQuery(displayValue);
    setIsOpen(current => !current);
  };

  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <SelectFieldShell ref={rootRef}>
        <SelectButton
          type='button'
          isOpen={isOpen}
          aria-expanded={isOpen}
          onClick={handleToggleOpen}
        >
          <SelectButtonValue>
            <SearchIcon />
            <SelectButtonText>
              {displayValue || placeholder || 'Выберите значение'}
            </SelectButtonText>
          </SelectButtonValue>
          <ChevronDownIcon
            style={{
              flexShrink: 0,
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 200ms ease',
            }}
          />
        </SelectButton>

        {isOpen ? (
          <SelectDropdown>
            <SelectSearchWrapper>
              <SelectSearchInput
                ref={searchRef}
                value={query}
                placeholder={searchPlaceholder}
                onChange={event => setQuery(event.target.value)}
                onKeyDown={event => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    commitValue(query);
                  }

                  if (event.key === 'Escape') {
                    event.preventDefault();
                    setIsOpen(false);
                  }
                }}
              />
            </SelectSearchWrapper>

            <SelectOptionList>
              {filteredOptions.map(option => {
                const isSelected = displayValue === option;

                return (
                  <SelectOption
                    key={option}
                    type='button'
                    isSelected={isSelected}
                    onClick={() => commitValue(option)}
                  >
                    <span>{option}</span>
                    {isSelected ? (
                      <SelectOptionMeta>selected</SelectOptionMeta>
                    ) : null}
                  </SelectOption>
                );
              })}

              {query.trim() && !hasExactMatch ? (
                <SelectOption type='button' onClick={() => commitValue(query)}>
                  <span>{query.trim()}</span>
                  <SelectOptionMeta>
                    {query.trim().startsWith('=') ? 'expression' : 'custom'}
                  </SelectOptionMeta>
                </SelectOption>
              ) : null}

              {filteredOptions.length === 0 && !query.trim() ? (
                <SelectEmptyState>Нет доступных вариантов.</SelectEmptyState>
              ) : null}

              {filteredOptions.length === 0 && query.trim() && hasExactMatch ? (
                <SelectEmptyState>Совпадений не найдено.</SelectEmptyState>
              ) : null}
            </SelectOptionList>
          </SelectDropdown>
        ) : null}
      </SelectFieldShell>

      {helperText ? <FieldHint>{helperText}</FieldHint> : null}
    </div>
  );
};
