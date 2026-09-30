import { useMemo } from 'react';
import { Plus, Table2 } from 'lucide-react';

import type { DbCatalogTableListItem } from '@/features/node/db-target-selector';

import type { DbTable } from '@/shared/gatewayClient';
import { Button } from '@/shared/ui/primitives';

import { getLiteralStringValue } from '../../../lib/helpers';

import { CatalogColumn, type CatalogColumnProps } from './CatalogColumn';
import { SaveTableNameModal } from './SaveTableNameModal';

type TableListItem = DbTable | DbCatalogTableListItem;
type Props = Omit<
  CatalogColumnProps,
  'title' | 'attribute' | 'icon' | 'options' | 'onSelect' | 'emptyText'
> & {
  tables: TableListItem[];
  selectTableMode: 'create' | 'select';
  newTableName: string;
  isCreateTableNameEditorOpen: boolean;
  onTableSelect: (table: TableListItem) => void;
  onTableNameChange: (value: string) => void;
  onSaveCreatedTableName: () => Promise<void>;
  onEditCreatedTableName: () => void;
  onCloseTableNameEditor: () => void;
};

export const TableSection = ({
  tables,
  selectTableMode,
  newTableName,
  isCreateTableNameEditorOpen,
  onTableSelect,
  onTableNameChange,
  onSaveCreatedTableName,
  onEditCreatedTableName,
  onCloseTableNameEditor,
  ...props
}: Props) => {
  const draftName =
    selectTableMode === 'create' && typeof props.value === 'string'
      ? getLiteralStringValue(props.value)
      : null;
  const options = useMemo(
    () =>
      tables
        .filter(table => table.name !== draftName)
        .map(table => ({ value: table.name, label: table.name })),
    [draftName, tables]
  );
  const pinnedOptions = useMemo(
    () =>
      draftName ? [{ value: draftName, label: draftName, isNew: true }] : [],
    [draftName]
  );

  return (
    <>
      <CatalogColumn
        {...props}
        title='Таблица'
        attribute='table_name'
        icon={<Table2 size={15} color='#C0C0C8' />}
        options={options}
        pinnedOptions={pinnedOptions}
        emptyText='Таблиц пока нет'
        leaf
        onSelect={name => {
          if (name === draftName) {
            onEditCreatedTableName();
            return;
          }
          const table = tables.find(item => item.name === name);
          if (table) onTableSelect(table);
        }}
        action={
          draftName ? null : (
            <Button
              disableRipple
              variant='ghost'
              startIcon={<Plus size={16} />}
              sx={{
                height: 38,
                minHeight: 38,
                boxSizing: 'border-box',
                py: 0,
                justifyContent: 'flex-start',
                flexShrink: 0,
                borderRadius: 0,
                color: 'primary.main',
                borderBottom: 1,
                borderColor: 'divider',
              }}
              onClick={onEditCreatedTableName}
            >
              Создать таблицу
            </Button>
          )
        }
      />
      {isCreateTableNameEditorOpen ? (
        <SaveTableNameModal
          name={newTableName}
          onNameChange={onTableNameChange}
          onSave={onSaveCreatedTableName}
          onClose={onCloseTableNameEditor}
        />
      ) : null}
    </>
  );
};
