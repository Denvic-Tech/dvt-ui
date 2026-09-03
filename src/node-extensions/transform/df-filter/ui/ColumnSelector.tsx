import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Box, Popover, Tooltip } from '@mui/material';

import { ColumnOption, filterColumns } from './helpers.ts';
import {
  ColumnItem,
  ColumnList,
  ColumnName,
  ColumnNameTooltipTarget,
  DropdownContainer,
  EmptyState,
  SearchContainer,
  SearchIcon,
  SearchInput,
  SearchInputWrapper,
  SelectorChevron,
  SelectorTriggerButton,
  SelectorTriggerLeft,
  SelectorTriggerText,
  TypeBadge,
} from './styles.ts';

interface ColumnSelectorProps {
  columns: ColumnOption[];
  selectedColumn: string;
  onSelect: (columnName: string) => void;
}

const COLUMN_DROPDOWN_MIN_WIDTH = 260;

export const ColumnSelector: React.FC<ColumnSelectorProps> = ({
  columns,
  selectedColumn,
  onSelect,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [dropdownWidth, setDropdownWidth] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredColumns = useMemo(
    () => filterColumns(columns, searchQuery),
    [columns, searchQuery]
  );

  const selectedColumnOption = useMemo(
    () => columns.find(column => column.name === selectedColumn),
    [columns, selectedColumn]
  );

  const handleClose = () => {
    if (anchorEl) {
      anchorEl.blur();
    }
    setAnchorEl(null);
    setSearchQuery('');
  };

  const TruncatedColumnName: React.FC<{
    name: string;
    isSelected: boolean;
    onClick: () => void;
  }> = ({ name, isSelected, onClick }) => {
    const textRef = useRef<HTMLSpanElement | null>(null);
    const handledMouseDownRef = useRef(false);
    const [isOverflow, setIsOverflow] = useState(false);

    useLayoutEffect(() => {
      const node = textRef.current;
      if (!node) {
        return;
      }

      const updateOverflowState = () => {
        setIsOverflow(node.scrollWidth > node.clientWidth + 1);
      };

      updateOverflowState();
      const frameId = window.requestAnimationFrame(updateOverflowState);
      const timeoutId = window.setTimeout(updateOverflowState, 0);

      if (typeof ResizeObserver !== 'undefined') {
        const resizeObserver = new ResizeObserver(updateOverflowState);
        resizeObserver.observe(node);
        if (node.parentElement) {
          resizeObserver.observe(node.parentElement);
        }
        return () => {
          window.cancelAnimationFrame(frameId);
          window.clearTimeout(timeoutId);
          resizeObserver.disconnect();
        };
      }

      window.addEventListener('resize', updateOverflowState);
      return () => {
        window.cancelAnimationFrame(frameId);
        window.clearTimeout(timeoutId);
        window.removeEventListener('resize', updateOverflowState);
      };
    }, [name]);

    return (
      <Tooltip
        title={name}
        disableHoverListener={!isOverflow}
        disableInteractive
        arrow
      >
        <ColumnNameTooltipTarget
          ref={textRef}
          title={isOverflow ? name : undefined}
          onMouseDown={event => {
            if (event.button !== 0) {
              return;
            }

            event.preventDefault();
            event.stopPropagation();
            handledMouseDownRef.current = true;
            onClick();
          }}
          onClick={event => {
            event.stopPropagation();

            if (handledMouseDownRef.current) {
              handledMouseDownRef.current = false;
              return;
            }

            onClick();
          }}
        >
          <ColumnName isSelected={isSelected}>{name}</ColumnName>
        </ColumnNameTooltipTarget>
      </Tooltip>
    );
  };

  return (
    <>
      <SelectorTriggerButton
        type='button'
        onClick={event => {
          const triggerWidth =
            event.currentTarget.getBoundingClientRect().width;
          setDropdownWidth(Math.max(COLUMN_DROPDOWN_MIN_WIDTH, triggerWidth));
          setAnchorEl(event.currentTarget);
        }}
        style={{ minWidth: 184, width: 184 }}
      >
        <SelectorTriggerLeft>
          <SelectorTriggerText>
            {selectedColumnOption?.name || 'Выберите колонку'}
          </SelectorTriggerText>
          {selectedColumnOption?.type ? (
            <TypeBadge dataType={selectedColumnOption.type}>
              {selectedColumnOption.type}
            </TypeBadge>
          ) : null}
        </SelectorTriggerLeft>
        <SelectorChevron>▾</SelectorChevron>
      </SelectorTriggerButton>

      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        disableRestoreFocus
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        slotProps={{
          paper: {
            sx: {
              mt: 0.5,
              backgroundColor: 'transparent',
              border: 'none',
              boxShadow: 'none',
              overflow: 'visible',
              width: dropdownWidth ?? undefined,
            },
          },
        }}
      >
        <DropdownContainer>
          <SearchContainer>
            <SearchInputWrapper>
              <SearchIcon viewBox='0 0 24 24' fill='none' stroke='currentColor'>
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                />
              </SearchIcon>
              <SearchInput
                type='text'
                placeholder='Поиск колонки...'
                value={searchQuery}
                onChange={event => setSearchQuery(event.target.value)}
                autoFocus
              />
            </SearchInputWrapper>
          </SearchContainer>

          <ColumnList>
            {filteredColumns.length === 0 ? (
              <EmptyState>Колонки не найдены</EmptyState>
            ) : (
              filteredColumns.map(column => {
                const isSelected = selectedColumn === column.name;
                return (
                  <ColumnItem
                    key={column.name}
                    type='button'
                    isSelected={isSelected}
                    onClick={() => {
                      onSelect(column.name);
                      handleClose();
                    }}
                  >
                    <TruncatedColumnName
                      name={column.name}
                      isSelected={isSelected}
                      onClick={() => {
                        onSelect(column.name);
                        handleClose();
                      }}
                    />
                    <TypeBadge dataType={column.type}>{column.type}</TypeBadge>
                  </ColumnItem>
                );
              })
            )}
          </ColumnList>
        </DropdownContainer>
      </Popover>
    </>
  );
};
