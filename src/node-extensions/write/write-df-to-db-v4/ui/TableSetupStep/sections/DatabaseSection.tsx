import { Database } from 'lucide-react';

import { NamespaceColumn, type NamespaceColumnProps } from './NamespaceColumn';

type Props = Omit<
  NamespaceColumnProps,
  'title' | 'attribute' | 'icon' | 'newName' | 'onNewNameChange' | 'onSelect'
> & {
  newDatabaseName: string;
  onNewDatabaseNameChange: (value: string) => void;
  onDatabaseSelect: (value: string) => void;
};
export const DatabaseSection = ({
  newDatabaseName,
  onNewDatabaseNameChange,
  onDatabaseSelect,
  ...props
}: Props) => (
  <NamespaceColumn
    {...props}
    title='База данных'
    attribute='database_name'
    icon={<Database size={15} color='#C0C0C8' />}
    newName={newDatabaseName}
    onNewNameChange={onNewDatabaseNameChange}
    onSelect={onDatabaseSelect}
  />
);
