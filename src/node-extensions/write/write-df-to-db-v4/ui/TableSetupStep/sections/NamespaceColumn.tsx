import { useMemo } from 'react';
import { Plus } from 'lucide-react';

import { IconButton, Tooltip } from '@/shared/ui/primitives';

import {
  CatalogColumn,
  type CatalogColumnProps,
  type CatalogOption,
} from './CatalogColumn';
import {
  CreateNamespaceModal,
  type NamespaceCreationResult,
} from './CreateNamespaceModal';

const EMPTY_CREATED_NAMES: string[] = [];

export type NamespaceColumnProps = Omit<
  CatalogColumnProps,
  'options' | 'emptyText'
> & {
  options: Array<{ label: string; value: string; tableCount?: number }>;
  createdNames?: string[] | undefined;
  isSaving: boolean;
  creationResult: NamespaceCreationResult;
  newName: string;
  onNewNameChange: (value: string) => void;
  onSave: () => Promise<void>;
  selectMode: 'select' | 'create';
  onCreateModeSelect: (mode: 'select' | 'create') => void;
};
export const NamespaceColumn = ({
  options,
  createdNames = EMPTY_CREATED_NAMES,
  isSaving,
  creationResult,
  newName,
  onNewNameChange,
  onSave,
  selectMode,
  onCreateModeSelect,
  ...props
}: NamespaceColumnProps) => {
  const items = useMemo(() => {
    const created = new Set(createdNames);
    const merged = new Map<string, CatalogOption>(
      options.map(option => [
        option.value,
        {
          ...option,
          count: option.tableCount,
          isNew: created.has(option.value),
        },
      ])
    );
    for (const name of created) {
      if (!merged.has(name)) {
        merged.set(name, { value: name, label: name, isNew: true });
      }
    }
    return Array.from(merged.values());
  }, [options, createdNames]);
  const isDatabase = props.attribute === 'database_name';
  const createLabel = isDatabase ? 'Создать базу данных' : 'Создать схему';

  return (
    <>
      <CatalogColumn
        {...props}
        options={items}
        emptyText='Список пуст'
        headerAction={
          <Tooltip title={createLabel}>
            <IconButton
              size='xs'
              aria-label={createLabel}
              onClick={() => onCreateModeSelect('create')}
            >
              <Plus size={14} />
            </IconButton>
          </Tooltip>
        }
      />
      {selectMode === 'create' ? (
        <CreateNamespaceModal
          kind={isDatabase ? 'database' : 'schema'}
          name={newName}
          isSaving={isSaving}
          result={creationResult}
          onNameChange={onNewNameChange}
          onSave={onSave}
          onClose={() => onCreateModeSelect('select')}
        />
      ) : null}
    </>
  );
};
