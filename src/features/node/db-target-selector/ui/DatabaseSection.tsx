import { GoDatabase } from 'react-icons/go';

import type { InputDefinitionModel } from '@/shared/gatewayClient';
import type { VariableOutput } from '@/shared/lib/variables';
import {
  type ExpressionAccordionAppearance,
  ExpressionAccordionInput,
  type PrimitiveNodeInputProps,
} from '@/shared/ui/node-input';

import type { CatalogListUiProps, MetadataOption } from '../model/helpers';

import { MetadataOptionList } from './MetadataOptionList';

type DatabaseSectionProps = Pick<
  PrimitiveNodeInputProps,
  'onChange' | 'value'
> & {
  collapsedValue: string;
  appearance?: ExpressionAccordionAppearance;
  inputDefinition: InputDefinitionModel | null | undefined;
  isOpen: boolean;
  stepNumber?: number | undefined;
  disabled?: boolean | undefined;
  disabledReason?: string | undefined;
  required?: boolean | undefined;
  onDatabaseSelect: (databaseName: string) => void;
  onToggle: () => void;
  options: MetadataOption[];
  selectedValue?: string | null;
  variables: VariableOutput[];
} & CatalogListUiProps;

export const DatabaseSection = ({
  appearance,
  collapsedValue,
  inputDefinition,
  isOpen,
  stepNumber,
  disabled,
  disabledReason,
  required,
  onChange,
  onDatabaseSelect,
  onToggle,
  options,
  query,
  onQueryChange,
  state,
  hasNextPage,
  isFetchingNextPage,
  loadMoreError,
  onLoadNextPage,
  onRetry,
  onRefresh,
  isRefreshing,
  selectedValue,
  value,
  variables,
}: DatabaseSectionProps) => {
  return (
    <ExpressionAccordionInput
      appearance={appearance}
      inputDefinition={inputDefinition}
      value={value}
      onChange={onChange}
      variables={variables}
      isOpen={isOpen}
      onToggle={onToggle}
      icon={<GoDatabase size={18} />}
      title='База данных'
      description={inputDefinition?.description}
      collapsedValue={collapsedValue}
      collapsedValueIcon={selectedValue ? <GoDatabase size={11} /> : undefined}
      collapsedValueFontSize={11}
      stepNumber={stepNumber}
      completed={Boolean(selectedValue)}
      disabled={disabled}
      disabledReason={disabledReason}
      required={required}
    >
      <MetadataOptionList
        appearance='rows'
        fillAvailableHeight={appearance === 'workspace'}
        emptyText='Базы данных не найдены'
        icon={<GoDatabase size={16} />}
        options={options}
        query={query}
        onQueryChange={onQueryChange}
        state={state}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        loadMoreError={loadMoreError}
        onLoadNextPage={onLoadNextPage}
        onRetry={onRetry}
        onRefresh={onRefresh}
        isRefreshing={isRefreshing}
        searchPlaceholder='Поиск базы...'
        testIds={{
          root: 'features/node/db-target-selector/database-list',
          searchInput: 'features/node/db-target-selector/database-search-input',
          list: 'features/node/db-target-selector/database-list-items',
          option: 'features/node/db-target-selector/database-list-item',
        }}
        selectedValue={selectedValue}
        onSelect={onDatabaseSelect}
      />
    </ExpressionAccordionInput>
  );
};
