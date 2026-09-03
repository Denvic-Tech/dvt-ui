import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';

import type { InputDefinitionModel } from '@/shared/gatewayClient';
import type { VariableOutput } from '@/shared/lib/variables';
import {
  type ExpressionAccordionAppearance,
  ExpressionAccordionInput,
  type PrimitiveNodeInputProps,
} from '@/shared/ui/node-input';

import type { CatalogListUiProps, MetadataOption } from '../model/helpers';

import { MetadataOptionList } from './MetadataOptionList';

type SchemaSectionProps = Pick<
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
  onSchemaSelect: (schemaName: string) => void;
  onToggle: () => void;
  options: MetadataOption[];
  selectedValue?: string | null;
  variables: VariableOutput[];
} & CatalogListUiProps;

export const SchemaSection = ({
  appearance,
  collapsedValue,
  inputDefinition,
  isOpen,
  stepNumber,
  disabled,
  disabledReason,
  required,
  onChange,
  onSchemaSelect,
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
}: SchemaSectionProps) => {
  return (
    <ExpressionAccordionInput
      appearance={appearance}
      inputDefinition={inputDefinition}
      value={value}
      onChange={onChange}
      variables={variables}
      isOpen={isOpen}
      onToggle={onToggle}
      icon={<FolderOutlinedIcon sx={{ fontSize: 18 }} />}
      title='Схема'
      description={inputDefinition?.description}
      collapsedValue={collapsedValue}
      collapsedValueIcon={
        selectedValue ? <FolderOutlinedIcon sx={{ fontSize: 11 }} /> : undefined
      }
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
        emptyText='Схемы не найдены'
        icon={<FolderOutlinedIcon sx={{ fontSize: 16 }} />}
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
        searchPlaceholder='Поиск схемы...'
        testIds={{
          root: 'features/node/db-target-selector/schema-list',
          searchInput: 'features/node/db-target-selector/schema-search-input',
          list: 'features/node/db-target-selector/schema-list-items',
          option: 'features/node/db-target-selector/schema-list-item',
        }}
        selectedValue={selectedValue}
        onSelect={onSchemaSelect}
      />
    </ExpressionAccordionInput>
  );
};
