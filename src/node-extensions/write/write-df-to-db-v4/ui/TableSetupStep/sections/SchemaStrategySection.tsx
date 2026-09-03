import React from 'react';
import SettingsIcon from '@mui/icons-material/Settings';
import { Alert } from '@mui/material';

import type { CreationMode } from '../../../lib/helpers';

import { StaticAccordionSection } from './StaticAccordionSection';

type SchemaStrategySectionProps = {
  blockedMessage?: string | null;
  children: React.ReactNode;
  creationMode: CreationMode;
  isOpen: boolean;
  isTableNew: boolean;
  onToggle: () => void;
  shouldShowSqlEditor: boolean;
};

const getCollapsedValue = ({
  creationMode,
  isTableNew,
  shouldShowSqlEditor,
}: Pick<
  SchemaStrategySectionProps,
  'creationMode' | 'isTableNew' | 'shouldShowSqlEditor'
>) => {
  if (!isTableNew) {
    return shouldShowSqlEditor ? 'DDL не требуется' : 'Готово';
  }

  return creationMode === 'typed' ? 'Typed Table spec' : 'Raw DDL SQL';
};

export const SchemaStrategySection: React.FC<SchemaStrategySectionProps> = ({
  blockedMessage,
  children,
  creationMode,
  isOpen,
  isTableNew,
  onToggle,
  shouldShowSqlEditor,
}) => {
  return (
    <StaticAccordionSection
      isOpen={isOpen}
      onToggle={onToggle}
      icon={<SettingsIcon sx={{ fontSize: 18 }} />}
      title='SCHEMA STRATEGY'
      collapsedValue={getCollapsedValue({
        creationMode,
        isTableNew,
        shouldShowSqlEditor,
      })}
    >
      {blockedMessage ? (
        <Alert severity='info'>{blockedMessage}</Alert>
      ) : (
        children
      )}
    </StaticAccordionSection>
  );
};
