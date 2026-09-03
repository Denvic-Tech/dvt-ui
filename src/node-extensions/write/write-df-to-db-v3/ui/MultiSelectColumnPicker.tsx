import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Portal } from '@mui/material';

import {
  MsCheckIcon,
  MsCheckbox,
  MsChipRemoveButton,
  MsChipsContainer,
  MsClearButton,
  MsColumnItem,
  MsColumnList,
  MsColumnName,
  MsDropdownContainer,
  MsDropdownFooter,
  MsRoot,
  MsSearchContainer,
  MsSearchIcon,
  MsSearchInput,
  MsSearchInputWrapper,
  MsSelectedChip,
  MsSelectedCount,
  MsTrigger,
  MsTriggerArrow,
  MsTriggerPlaceholder,
  MsTypeBadge,
} from './styles.ts';

type PickerColumn = {
  name: string;
  type: string;
};

type MultiSelectColumnPickerProps = {
  columns: PickerColumn[];
  selectedColumns: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
};

export const MultiSelectColumnPicker: React.FC<MultiSelectColumnPickerProps> = ({
  columns,
  selectedColumns,
  onChange,
  placeholder = 'Добавьте колонку...',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number | null;
    bottom: number | null;
    left: number;
    width: number;
    placement: 'top' | 'bottom';
  }>({
    left: 0,
    width: 0,
    placement: 'bottom',
    top: 0,
    bottom: null,
  });
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const filteredColumns = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return columns;
    }

    return columns.filter(column => {
      return (
        column.name.toLowerCase().includes(query) ||
        column.type.toLowerCase().includes(query)
      );
    });
  }, [columns, searchQuery]);

  const updateDropdownPosition = () => {
    if (!triggerRef.current) {
      return;
    }

    const rect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const MAX_DROPDOWN_HEIGHT = 340;
    const GAP = 4;
    const spaceBelow = viewportHeight - rect.bottom;
    const shouldOpenUp = spaceBelow < MAX_DROPDOWN_HEIGHT && rect.top > spaceBelow;

    setDropdownPosition({
      top: shouldOpenUp ? null : rect.bottom + GAP,
      bottom: shouldOpenUp ? viewportHeight - rect.top + GAP : null,
      left: rect.left,
      width: rect.width,
      placement: shouldOpenUp ? 'top' : 'bottom',
    });
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    updateDropdownPosition();

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (
        target &&
        (rootRef.current?.contains(target) || dropdownRef.current?.contains(target))
      ) {
        return;
      }
      setIsOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    const handleScroll = () => {
      updateDropdownPosition();
    };
    const handleResize = () => {
      updateDropdownPosition();
    };

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleEscape);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    requestAnimationFrame(() => {
      searchInputRef.current?.focus();
    });
  }, [isOpen]);

  const toggleColumn = (columnName: string) => {
    if (selectedColumns.includes(columnName)) {
      onChange(selectedColumns.filter(value => value !== columnName));
      return;
    }
    onChange([...selectedColumns, columnName]);
  };

  const removeColumn = (
    columnName: string,
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.stopPropagation();
    onChange(selectedColumns.filter(value => value !== columnName));
  };

  const clearAll = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onChange([]);
  };

  return (
    <MsRoot ref={rootRef}>
      <MsTrigger
        ref={triggerRef}
        onClick={() => setIsOpen(previous => !previous)}
        role='button'
        aria-expanded={isOpen}
        aria-haspopup='listbox'
        tabIndex={0}
        onKeyDown={event => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setIsOpen(previous => !previous);
          }
        }}
      >
        <MsChipsContainer>
          {selectedColumns.length === 0 ? (
            <MsTriggerPlaceholder>{placeholder}</MsTriggerPlaceholder>
          ) : (
            selectedColumns.map(columnName => (
              <MsSelectedChip key={columnName}>
                {columnName}
                <MsChipRemoveButton
                  type='button'
                  onClick={event => removeColumn(columnName, event)}
                >
                  <svg fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M6 18L18 6M6 6l12 12'
                    />
                  </svg>
                </MsChipRemoveButton>
              </MsSelectedChip>
            ))
          )}
        </MsChipsContainer>
        <MsTriggerArrow
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M19 9l-7 7-7-7'
          />
        </MsTriggerArrow>
      </MsTrigger>

      {isOpen && (
        <Portal>
          <MsDropdownContainer
            ref={dropdownRef}
            style={{
              top: dropdownPosition.top ?? undefined,
              bottom: dropdownPosition.bottom ?? undefined,
              left: dropdownPosition.left,
              width: dropdownPosition.width,
              transformOrigin:
                dropdownPosition.placement === 'top'
                  ? 'bottom center'
                  : 'top center',
            }}
          >
            <MsSearchContainer>
              <MsSearchInputWrapper>
                <MsSearchIcon viewBox='0 0 24 24' fill='none' stroke='currentColor'>
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                  />
                </MsSearchIcon>
                <MsSearchInput
                  ref={searchInputRef}
                  type='text'
                  placeholder='Search columns...'
                  value={searchQuery}
                  onChange={event => setSearchQuery(event.target.value)}
                />
              </MsSearchInputWrapper>
            </MsSearchContainer>

            <MsColumnList role='listbox'>
              {filteredColumns.length === 0 ? (
                <MsColumnName sx={{ px: 1.5, py: 1, color: '#9ca3af' }}>
                  Ничего не найдено
                </MsColumnName>
              ) : (
                filteredColumns.map(column => {
                  const isSelected = selectedColumns.includes(column.name);
                  return (
                    <MsColumnItem
                      type='button'
                      key={column.name}
                      isSelected={isSelected}
                      onClick={() => toggleColumn(column.name)}
                    >
                      <MsCheckbox isChecked={isSelected}>
                        {isSelected && (
                          <MsCheckIcon viewBox='0 0 24 24' fill='none' stroke='currentColor'>
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={3}
                              d='M5 13l4 4L19 7'
                            />
                          </MsCheckIcon>
                        )}
                      </MsCheckbox>
                      <MsColumnName isSelected={isSelected}>{column.name}</MsColumnName>
                      <MsTypeBadge dataType={column.type}>{column.type}</MsTypeBadge>
                    </MsColumnItem>
                  );
                })
              )}
            </MsColumnList>

            <MsDropdownFooter>
              <MsSelectedCount>{selectedColumns.length} выбрано</MsSelectedCount>
              {selectedColumns.length > 0 && (
                <MsClearButton type='button' onClick={clearAll}>
                  Очистить
                </MsClearButton>
              )}
            </MsDropdownFooter>
          </MsDropdownContainer>
        </Portal>
      )}
    </MsRoot>
  );
};
