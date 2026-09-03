import React, { useMemo, useState } from 'react';
import { Box, Popover } from '@mui/material';

import {
  getOperationGroupsByOptions,
  getOperationLabel,
  getOperationSymbol,
} from './helpers';
import {
  DropdownContainer,
  EmptyState,
  OperationGrid,
  OperationGridContainer,
  OperationGroupSection,
  OperationGroupTitle,
  OperationItem,
  OperationLabel,
  OperationSymbol,
  SelectorChevron,
  SelectorTriggerButton,
  SelectorTriggerLeft,
  SelectorTriggerSymbol,
  SelectorTriggerText,
} from './styles';

interface OperationSelectorProps {
  selectedOperation: string;
  availableOperations: string[];
  onSelect: (operationId: string) => void;
}

export const OperationSelector: React.FC<OperationSelectorProps> = ({
  selectedOperation,
  availableOperations,
  onSelect,
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const groupedOperations = useMemo(
    () => getOperationGroupsByOptions(availableOperations),
    [availableOperations]
  );

  const handleClose = () => {
    if (anchorEl) {
      anchorEl.blur();
    }
    setAnchorEl(null);
  };

  return (
    <>
      <SelectorTriggerButton
        type='button'
        onClick={event => setAnchorEl(event.currentTarget)}
        style={{ minWidth: 132, width: 132 }}
      >
        <SelectorTriggerLeft>
          <SelectorTriggerSymbol>
            {getOperationSymbol(selectedOperation)}
          </SelectorTriggerSymbol>
          <SelectorTriggerText>
            {getOperationLabel(selectedOperation)}
          </SelectorTriggerText>
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
              width: 'fit-content',
            },
          },
        }}
      >
        <DropdownContainer>
          <OperationGrid>
            {groupedOperations.length === 0 ? (
              <EmptyState>Операторы недоступны</EmptyState>
            ) : (
              groupedOperations.map(group => (
                <OperationGroupSection key={group.name}>
                  <OperationGroupTitle>{group.name}</OperationGroupTitle>
                  <OperationGridContainer>
                    {group.operations.map(operation => {
                      const isSelected = selectedOperation === operation.id;
                      return (
                        <OperationItem
                          key={operation.id}
                          type='button'
                          isSelected={isSelected}
                          onClick={() => {
                            onSelect(operation.id);
                            handleClose();
                          }}
                          title={operation.label}
                        >
                          <OperationSymbol>{operation.symbol}</OperationSymbol>
                          <OperationLabel>{operation.label}</OperationLabel>
                        </OperationItem>
                      );
                    })}
                  </OperationGridContainer>
                </OperationGroupSection>
              ))
            )}
          </OperationGrid>
        </DropdownContainer>
      </Popover>
    </>
  );
};
