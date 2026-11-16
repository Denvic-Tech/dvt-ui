import { useState } from 'react';

import {
  CatalogTablePreview,
  DataPreviewRowCount,
  DataPreviewTableSkeleton,
} from '@/features/node/data-preview-table';

import { normalizeDbCatalogParentNames } from '@/entities/data/db-connection/model/catalogNormalizers';
import { useDbCatalogTablePreview } from '@/entities/data/db-connection/model/hooks/useDbCatalog';

import {
  LinkButton,
  SearchField,
  SearchLead,
  SegmentButton,
  Segmented,
  Spinner,
} from '@/shared/ui/clean-minimal/controls';
import { SearchIcon, TableIcon } from '@/shared/ui/clean-minimal/icons';

import {
  getReadTableDataPreviewState,
  hasFilledSelectorValue,
} from '../../lib/helpers';
import type {
  ReadTableFromDBV3PaneTab,
  ReadTableFromDBV3Values,
} from '../../lib/types';
import { usePartitioningAdvice } from '../../model/usePartitioningAdvice';
import type { ReadTableFromDBV3Form } from '../../model/useReadTableFromDBV3Form';

import { ColumnsTab } from './ColumnsTab';
import { ParametersTab } from './ParametersTab';
import { PartitioningAdvice } from './PartitioningAdvice';
import {
  Pane,
  PaneMessage,
  PaneMessageIcon,
  TableName,
  TableNameText,
  TabPanel,
  TabsBar,
} from './SettingsPane.styles';

const TABS: Array<{ id: ReadTableFromDBV3PaneTab; label: string }> = [
  { id: 'params', label: 'Параметры' },
  { id: 'columns', label: 'Колонки' },
  { id: 'preview', label: 'Предпросмотр' },
];

const TAB_PANEL_ID = 'read-table-from-db-v3-tab-panel';
const getTabId = (tab: ReadTableFromDBV3PaneTab) =>
  `read-table-from-db-v3-tab-${tab}`;

type SettingsPaneProps = {
  form: ReadTableFromDBV3Form;
  values: ReadTableFromDBV3Values | undefined;
};

/**
 * Правая часть модалки. Монтируется заново при смене таблицы, поэтому
 * поиск колонок и запрос предпросмотра всегда относятся к текущей таблице.
 */
export const SettingsPane = ({ form, values }: SettingsPaneProps) => {
  const hasTable = hasFilledSelectorValue(values?.table_name);
  const hasExpression = form.hasMetadataExpression;
  const isColumnsLoading = !hasExpression && form.isTableMetadataLoading;
  const hasColumnsError =
    hasTable && !hasExpression && !isColumnsLoading && !form.selectedTable;
  const isMetadataReady = !hasExpression && Boolean(form.selectedTable);

  const activeTab: ReadTableFromDBV3PaneTab = isMetadataReady
    ? form.activeTab
    : 'params';
  const [columnQuery, setColumnQuery] = useState('');
  const [isPreviewRequested, setIsPreviewRequested] = useState(
    activeTab === 'preview'
  );

  const preview = useDbCatalogTablePreview(
    form.inputMetadata,
    form.literalDatabaseName,
    form.literalSchemaName,
    form.literalTableName,
    { enabled: isPreviewRequested && isMetadataReady }
  );
  const advice = usePartitioningAdvice({ form, values });

  if (!hasTable) {
    return (
      <Pane aria-label='Колонки и настройки'>
        <PaneMessage>
          <PaneMessageIcon>
            <TableIcon />
          </PaneMessageIcon>
          Выберите таблицу слева — здесь появятся колонки и настройки
        </PaneMessage>
      </Pane>
    );
  }

  // Выбранная таблица рядом с вкладками: схема — только у диалектов со схемами.
  const tableName = form.literalTableName;
  const tableParents = normalizeDbCatalogParentNames(
    form.catalogCapabilities,
    form.literalDatabaseName,
    form.literalSchemaName
  );
  const tablePath = [
    tableParents.databaseName,
    tableParents.schemaName,
    tableName,
  ]
    .filter(Boolean)
    .join(' / ');

  const isTabDisabled = (tab: ReadTableFromDBV3PaneTab) =>
    isColumnsLoading ||
    hasColumnsError ||
    (tab !== 'params' && !isMetadataReady);

  const handleTabSelect = (tab: ReadTableFromDBV3PaneTab) => {
    if (tab === 'preview') setIsPreviewRequested(true);
    form.setActiveTab(tab);
  };

  const previewState = getReadTableDataPreviewState({
    hasExpression,
    hasTableName: Boolean(form.literalTableName),
    state: preview.state,
  });
  const isPreviewLoading =
    !isPreviewRequested || previewState === 'loading' || preview.isRefreshing;
  const previewData =
    !isPreviewLoading && previewState === 'ready' ? preview.data : null;

  const renderPreview = () => {
    if (isPreviewLoading) {
      // Колонки уже известны из метаданных: в шапке скелетона — их названия.
      return <DataPreviewTableSkeleton columns={form.availableColumns} />;
    }
    if (previewData) {
      return <CatalogTablePreview preview={previewData} />;
    }
    if (previewState === 'empty') {
      return <PaneMessage>В таблице нет строк</PaneMessage>;
    }
    return (
      <PaneMessage>
        Предпросмотр не загрузился
        <LinkButton type='button' onClick={() => void preview.retry()}>
          Повторить
        </LinkButton>
      </PaneMessage>
    );
  };

  const renderContent = () => {
    if (isColumnsLoading) {
      return (
        <PaneMessage aria-busy='true'>
          <Spinner size={16} />
          Получаем колонки таблицы…
        </PaneMessage>
      );
    }
    if (hasColumnsError) {
      return (
        <PaneMessage role='alert'>
          Не удалось получить метаданные выбранной таблицы.
          {form.catalogMode === 'lazy' ? (
            <LinkButton
              type='button'
              onClick={() => void form.retryTableMetadata()}
            >
              Повторить
            </LinkButton>
          ) : null}
        </PaneMessage>
      );
    }
    if (activeTab === 'columns') {
      return (
        <ColumnsTab
          columns={form.availableColumns}
          selectedColumns={values?.columns}
          query={columnQuery}
          onToggle={form.handleColumnToggle}
          onSetSelected={form.setSelectedColumns}
        />
      );
    }
    if (activeTab === 'preview') {
      return renderPreview();
    }
    return <ParametersTab form={form} values={values} />;
  };

  return (
    <Pane aria-label='Колонки и настройки'>
      <TabsBar>
        <Segmented role='tablist' aria-label='Настройки таблицы'>
          {TABS.map(tab => (
            <SegmentButton
              key={tab.id}
              id={getTabId(tab.id)}
              type='button'
              role='tab'
              aria-selected={activeTab === tab.id}
              aria-controls={TAB_PANEL_ID}
              disabled={isTabDisabled(tab.id)}
              onClick={() => handleTabSelect(tab.id)}
            >
              {tab.label}
            </SegmentButton>
          ))}
        </Segmented>
        {tableName ? (
          <TableName title={tablePath}>
            <TableIcon size={16} />
            <TableNameText>
              {tableParents.schemaName ? (
                <span className='table-schema'>{tableParents.schemaName}.</span>
              ) : null}
              {tableName}
            </TableNameText>
          </TableName>
        ) : null}
        {activeTab === 'params' && isMetadataReady && advice.isAvailable ? (
          <PartitioningAdvice
            status={advice.status}
            onRun={() => void advice.run()}
            onUndo={advice.undo}
          />
        ) : null}
        {activeTab === 'columns' && isMetadataReady ? (
          <SearchField>
            <SearchLead>
              <SearchIcon />
            </SearchLead>
            <input
              value={columnQuery}
              onChange={event => setColumnQuery(event.target.value)}
              placeholder='Поиск колонок'
              aria-label='Поиск колонок'
            />
          </SearchField>
        ) : null}
        {/* Счётчик строк — только рядом с загруженной таблицей предпросмотра. */}
        {activeTab === 'preview' && previewData ? (
          <DataPreviewRowCount
            shownRows={previewData.rows.length}
            rowCount={previewData.rowCount}
            rowCountExact={previewData.rowCountExact}
          />
        ) : null}
      </TabsBar>
      <TabPanel
        id={TAB_PANEL_ID}
        role='tabpanel'
        aria-labelledby={getTabId(activeTab)}
      >
        {renderContent()}
      </TabPanel>
    </Pane>
  );
};
