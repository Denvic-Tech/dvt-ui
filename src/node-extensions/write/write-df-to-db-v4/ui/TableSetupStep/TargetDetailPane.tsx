import { useId, useState } from 'react';

import {
  CatalogTablePreview,
  DataPreviewRowCount,
  DataPreviewTableSkeleton,
} from '@/features/node/data-preview-table';

import type {
  DbCatalogColumn,
  DbCatalogState,
} from '@/entities/data/db-connection/model/catalogTypes';
import { useDbCatalogTablePreview } from '@/entities/data/db-connection/model/hooks/useDbCatalog';

import type { DbMetadata as DBMetadata } from '@/shared/gatewayClient';
import {
  LinkButton,
  SegmentButton,
  Segmented,
  Spinner,
} from '@/shared/ui/clean-minimal/controls';
import { CodeIcon, TableIcon } from '@/shared/ui/clean-minimal/icons';

import {
  ErrorText,
  InfoBox,
  InfoLabel,
  InfoRow,
  InfoValue,
  InputBox,
  NoteText,
} from '../kit.styles';

import {
  ColumnName,
  ColumnRow,
  ColumnsBox,
  ColumnsBoxHeader,
  ColumnsCount,
  ColumnsList,
  ColumnType,
  DetailForm,
  DetailHeader,
  DetailIcon,
  DetailPane,
  DetailPath,
  DetailTabPanel,
  DetailTabsBar,
  DetailTitle,
  DetailTitles,
  DraftBody,
  EmptyHint,
  EmptyIcon,
  EmptyState,
  EmptyTitle,
  LoadingState,
  NewBadge,
  PaneMessage,
  TabbedDetailPane,
  TablePath,
  TablePathText,
} from './TableSetupStep.styles';

export type ExpressionSummaryRow = {
  label: string;
  value: string | null;
};

/** Путь таблицы в строке вкладок: `схема.таблица`, полный путь — в подсказке. */
export type TargetTablePath = {
  name: string;
  /** Префикс перед именем — только у диалектов со схемами. */
  schemaName: string | null;
  fullPath: string;
};

export type TargetDetail =
  | { kind: 'empty' }
  | {
      kind: 'existing';
      /** Смена ключа монтирует вкладки заново: превью — всегда текущей таблицы. */
      tableKey: string;
      path: TargetTablePath;
      /** Подключение и родители для запроса предпросмотра. */
      metadata: DBMetadata | null;
      databaseName: string | null;
      schemaName: string | null;
      isLoading: boolean;
      columns: readonly DbCatalogColumn[] | null;
    }
  | {
      kind: 'draft';
      path: TargetTablePath;
      name: string;
      location: string;
      error: string;
      onNameChange: (value: string) => void;
    }
  | { kind: 'expression'; rows: readonly ExpressionSummaryRow[] };

type DetailTab = 'preview' | 'columns';

const TABS: ReadonlyArray<{ id: DetailTab; label: string }> = [
  { id: 'preview', label: 'Предпросмотр' },
  { id: 'columns', label: 'Колонки' },
];

const TAB_PANEL_ID = 'write-df-to-db-v4-table-tab-panel';
const getTabId = (tab: DetailTab) => `write-df-to-db-v4-table-tab-${tab}`;

const getPreviewView = (
  state: DbCatalogState
): 'loading' | 'ready' | 'empty' | 'error' => {
  if (state === 'loading') return 'loading';
  if (state === 'ready') return 'ready';
  if (state === 'empty') return 'empty';
  return 'error';
};

type DetailTabsProps = {
  activeTab: DetailTab | null;
  onSelect?: (tab: DetailTab) => void;
  disabled?: boolean;
};

const DetailTabs = ({
  activeTab,
  onSelect,
  disabled = false,
}: DetailTabsProps) => (
  <Segmented
    role='tablist'
    aria-label='Данные таблицы'
    title={disabled ? 'Таблица ещё не создана' : undefined}
  >
    {TABS.map(tab => (
      <SegmentButton
        key={tab.id}
        id={getTabId(tab.id)}
        type='button'
        role='tab'
        aria-selected={activeTab === tab.id}
        aria-controls={disabled ? undefined : TAB_PANEL_ID}
        disabled={disabled}
        onClick={() => onSelect?.(tab.id)}
      >
        {tab.label}
      </SegmentButton>
    ))}
  </Segmented>
);

const TablePathLabel = ({
  path,
  isNew = false,
}: {
  path: TargetTablePath;
  isNew?: boolean;
}) => (
  <TablePath isNew={isNew} title={path.fullPath}>
    <TableIcon size={16} />
    <TablePathText isNew={isNew}>
      {path.schemaName ? (
        <span className='table-schema'>{path.schemaName}.</span>
      ) : null}
      {path.name || <span className='table-unnamed'>без названия</span>}
    </TablePathText>
    {isNew ? <NewBadge>NEW</NewBadge> : null}
  </TablePath>
);

type ExistingTableDetailProps = {
  detail: Extract<TargetDetail, { kind: 'existing' }>;
  activeTab: DetailTab;
  onTabChange: (tab: DetailTab) => void;
};

/**
 * Вкладки существующей таблицы. Строки грузятся, только когда открыт
 * «Предпросмотр»: на «Колонках» лишний запрос к базе не уходит.
 */
const ExistingTableDetail = ({
  detail,
  activeTab,
  onTabChange,
}: ExistingTableDetailProps) => {
  const [isPreviewRequested, setIsPreviewRequested] = useState(
    activeTab === 'preview'
  );
  const preview = useDbCatalogTablePreview(
    detail.metadata,
    detail.databaseName,
    detail.schemaName,
    detail.path.name,
    { enabled: isPreviewRequested }
  );

  const previewView = getPreviewView(preview.state);
  const isPreviewLoading =
    !isPreviewRequested || previewView === 'loading' || preview.isRefreshing;
  const previewData =
    !isPreviewLoading && previewView === 'ready' ? preview.data : null;

  const handleTabSelect = (tab: DetailTab) => {
    if (tab === 'preview') setIsPreviewRequested(true);
    onTabChange(tab);
  };

  const renderPreview = () => {
    if (isPreviewLoading) {
      // Колонки уже известны из каталога: в шапке скелетона — их названия.
      return <DataPreviewTableSkeleton columns={detail.columns} />;
    }
    if (previewData) {
      return <CatalogTablePreview preview={previewData} />;
    }
    if (previewView === 'empty') {
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

  const renderColumns = () => {
    if (detail.isLoading) {
      return (
        <LoadingState role='status'>
          <Spinner size={16} />
          Получаем колонки таблицы…
        </LoadingState>
      );
    }
    if (!detail.columns) return null;
    return (
      <ColumnsBox>
        <ColumnsBoxHeader>
          <span>Колонки таблицы</span>
          <ColumnsCount>{detail.columns.length}</ColumnsCount>
        </ColumnsBoxHeader>
        <ColumnsList role='list' aria-label='Колонки таблицы'>
          {detail.columns.map(column => (
            <ColumnRow key={column.name} role='listitem'>
              <ColumnName title={column.name}>{column.name}</ColumnName>
              <ColumnType>{column.dtype}</ColumnType>
            </ColumnRow>
          ))}
        </ColumnsList>
      </ColumnsBox>
    );
  };

  return (
    <TabbedDetailPane aria-label='Выбранная таблица'>
      <DetailTabsBar>
        <DetailTabs activeTab={activeTab} onSelect={handleTabSelect} />
        <TablePathLabel path={detail.path} />
        {/* Счётчик строк — только рядом с загруженной таблицей предпросмотра. */}
        {activeTab === 'preview' && previewData ? (
          <DataPreviewRowCount
            shownRows={previewData.rows.length}
            rowCount={previewData.rowCount}
            rowCountExact={previewData.rowCountExact}
          />
        ) : null}
      </DetailTabsBar>
      <DetailTabPanel
        id={TAB_PANEL_ID}
        role='tabpanel'
        aria-labelledby={getTabId(activeTab)}
      >
        {activeTab === 'preview' ? renderPreview() : renderColumns()}
      </DetailTabPanel>
    </TabbedDetailPane>
  );
};

export const TargetDetailPane = ({ detail }: { detail: TargetDetail }) => {
  const nameInputId = useId();
  // Выбранная вкладка сохраняется при переходе к другой таблице.
  const [activeTab, setActiveTab] = useState<DetailTab>('preview');

  if (detail.kind === 'empty') {
    return (
      <DetailPane aria-label='Выбранная таблица'>
        <EmptyState>
          <EmptyIcon>
            <TableIcon size={18} />
          </EmptyIcon>
          <EmptyTitle>Выберите таблицу в дереве</EmptyTitle>
          <EmptyHint>
            или создайте новую — «Новая таблица» внутри схемы
          </EmptyHint>
        </EmptyState>
      </DetailPane>
    );
  }

  if (detail.kind === 'existing') {
    return (
      <ExistingTableDetail
        key={detail.tableKey}
        detail={detail}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    );
  }

  if (detail.kind === 'draft') {
    // У новой таблицы ещё нет ни строк, ни колонок: вкладки неактивны.
    return (
      <TabbedDetailPane aria-label='Выбранная таблица'>
        <DetailTabsBar>
          <DetailTabs activeTab={null} disabled />
          <TablePathLabel path={detail.path} isNew />
        </DetailTabsBar>
        <DraftBody>
          <InfoBox>
            <InfoRow>
              <InfoLabel>
                <label htmlFor={nameInputId}>Название</label>
              </InfoLabel>
              <InputBox invalid={Boolean(detail.error)} mono width={260}>
                <input
                  id={nameInputId}
                  value={detail.name}
                  onChange={event => detail.onNameChange(event.target.value)}
                  placeholder='new_table'
                  aria-invalid={Boolean(detail.error)}
                  aria-label='Название новой таблицы'
                  spellCheck={false}
                  autoComplete='off'
                  autoFocus
                />
              </InputBox>
            </InfoRow>
            {detail.location ? (
              <InfoRow>
                <InfoLabel>Расположение</InfoLabel>
                <InfoValue>{detail.location}</InfoValue>
              </InfoRow>
            ) : null}
          </InfoBox>
          {detail.error ? (
            <ErrorText role='alert'>{detail.error}</ErrorText>
          ) : null}
        </DraftBody>
      </TabbedDetailPane>
    );
  }

  return (
    <DetailPane aria-label='Выбранная таблица'>
      <DetailHeader>
        <DetailIcon>
          <CodeIcon />
        </DetailIcon>
        <DetailTitles>
          <DetailTitle>Таблица из выражений</DetailTitle>
          <DetailPath>Значения вычисляются при запуске</DetailPath>
        </DetailTitles>
      </DetailHeader>
      <DetailForm>
        <InfoBox>
          {detail.rows.map(row => (
            <InfoRow key={row.label}>
              <InfoLabel>{row.label}</InfoLabel>
              <InfoValue mono={Boolean(row.value)} title={row.value ?? ''}>
                {row.value || 'не задано'}
              </InfoValue>
            </InfoRow>
          ))}
        </InfoBox>
        <NoteText>
          Колонки таблицы станут известны при запуске — на следующем шаге
          сопоставление по DataFrame.
        </NoteText>
      </DetailForm>
    </DetailPane>
  );
};
