import { Folder } from 'lucide-react';

import { NamespaceColumn, type NamespaceColumnProps } from './NamespaceColumn';

type Props = Omit<
  NamespaceColumnProps,
  'title' | 'attribute' | 'icon' | 'newName' | 'onNewNameChange' | 'onSelect'
> & {
  newSchemaName: string;
  onNewSchemaNameChange: (value: string) => void;
  onSchemaSelect: (value: string) => void;
};
export const SchemaSection = ({
  newSchemaName,
  onNewSchemaNameChange,
  onSchemaSelect,
  ...props
}: Props) => (
  <NamespaceColumn
    {...props}
    title='Схема'
    attribute='schema_name'
    icon={<Folder size={15} color='#C0C0C8' />}
    newName={newSchemaName}
    onNewNameChange={onNewSchemaNameChange}
    onSelect={onSchemaSelect}
  />
);
