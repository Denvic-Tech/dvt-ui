import { memo, useCallback, useState } from 'react';
import { skipToken } from '@reduxjs/toolkit/query';

import { useSearchDatasetsInfiniteQuery } from '@/entities/data/data-catalog';
import { useGetProjectColumnsQuery } from '@/entities/data/lineage';

import { Dialog } from '@/shared/ui/primitives';

import { useCatalogNodes } from '../model/useCatalogNodes';

import { CloseIcon } from './catalogIcons';
import {
  CatalogBody,
  CatalogHeader,
  CatalogRoot,
  CatalogTab,
  CatalogTabs,
  CatalogTitle,
  CatalogTitleRow,
  GhostIconButton,
} from './DataCatalogModal.styles';
import { DatasetsView } from './DatasetsView';
import { NodesView } from './NodesView';
import { ProjectColumnsView } from './ProjectColumnsView';

export type DataCatalogSection = 'datasets' | 'nodes' | 'columns';

interface DataCatalogModalProps {
  open: boolean;
  projectId: string | null;
  onClose: () => void;
  initialSection?: DataCatalogSection;
}

const SECTIONS: { id: DataCatalogSection; label: string }[] = [
  // «Колонки» — раздел по умолчанию, поэтому первая вкладка.
  { id: 'columns', label: 'Колонки' },
  { id: 'datasets', label: 'Датасеты' },
  { id: 'nodes', label: 'Ноды' },
];

/**
 * Раздел «Датасеты» временно скрыт из вкладок; код раздела оставлен, чтобы
 * вернуть вкладку, убрав его из этого списка.
 */
const HIDDEN_SECTIONS = new Set<DataCatalogSection>(['datasets']);

const VISIBLE_SECTIONS = SECTIONS.filter(item => !HIDDEN_SECTIONS.has(item.id));

/** Счётчики вкладок; запросы совпадают с запросами разделов и берутся из кэша. */
const useSectionCounts = (
  projectId: string | null
): Record<DataCatalogSection, string | null> => {
  const datasets = useSearchDatasetsInfiniteQuery(
    { projectId, query: null },
    { skip: !projectId || HIDDEN_SECTIONS.has('datasets') }
  );
  const columns = useGetProjectColumnsQuery(
    projectId ? { projectId } : skipToken
  );
  const nodesCount = useCatalogNodes().length;
  const datasetsCount = datasets.data?.pages.reduce(
    (total, page) => total + page.items.length,
    0
  );

  return {
    datasets:
      datasetsCount === undefined
        ? null
        : `${datasetsCount}${datasets.hasNextPage ? '+' : ''}`,
    nodes: String(nodesCount),
    columns:
      columns.data?.lineage_available && columns.data.rows
        ? String(columns.data.rows.length)
        : null,
  };
};

interface DataCatalogContentProps {
  projectId: string | null;
  initialSection: DataCatalogSection;
  onClose: () => void;
}

const DataCatalogContent = ({
  projectId,
  initialSection,
  onClose,
}: DataCatalogContentProps) => {
  const [section, setSection] = useState<DataCatalogSection>(initialSection);
  // Нода, с которой открывается раздел «Ноды» по кнопке из списка колонок.
  const [nodesInitialId, setNodesInitialId] = useState<string | null>(null);
  const counts = useSectionCounts(projectId);

  const openNodeColumns = useCallback((nodeId: string) => {
    setNodesInitialId(nodeId);
    setSection('nodes');
  }, []);

  return (
    <CatalogRoot>
      <CatalogHeader>
        <CatalogTitleRow>
          <CatalogTitle id='data-catalog-title'>Каталог данных</CatalogTitle>
          <GhostIconButton
            type='button'
            aria-label='Закрыть'
            title='Закрыть'
            style={{ borderRadius: 6, height: 32, width: 32 }}
            onClick={onClose}
          >
            <CloseIcon size={16} />
          </GhostIconButton>
        </CatalogTitleRow>
        <CatalogTabs role='tablist' aria-label='Раздел каталога'>
          {VISIBLE_SECTIONS.map(item => (
            <CatalogTab
              key={item.id}
              type='button'
              role='tab'
              active={section === item.id}
              aria-selected={section === item.id}
              data-testid={`widgets/data-catalog/section-${item.id}`}
              onClick={() => setSection(item.id)}
            >
              {item.label}
              {counts[item.id] !== null ? <i>{counts[item.id]}</i> : null}
            </CatalogTab>
          ))}
        </CatalogTabs>
      </CatalogHeader>
      <CatalogBody>
        {section === 'datasets' ? (
          <DatasetsView projectId={projectId} />
        ) : section === 'nodes' ? (
          <NodesView
            key={nodesInitialId ?? 'canvas'}
            initialNodeId={nodesInitialId}
            onClose={onClose}
          />
        ) : (
          <ProjectColumnsView
            projectId={projectId}
            onOpenNode={openNodeColumns}
          />
        )}
      </CatalogBody>
    </CatalogRoot>
  );
};

const DataCatalogModalComponent = ({
  open,
  projectId,
  onClose,
  initialSection = 'columns',
}: DataCatalogModalProps) => (
  <Dialog
    open={open}
    maxWidth={false}
    aria-labelledby='data-catalog-title'
    data-testid='widgets/data-catalog/dialog'
    slotProps={{
      backdrop: {
        sx: {
          backdropFilter: 'blur(2px)',
          backgroundColor: 'rgba(22, 24, 46, 0.3)',
        },
      },
      paper: {
        sx: {
          borderRadius: '12px',
          boxShadow:
            '0 20px 50px -12px rgba(20, 22, 30, 0.25), 0 0 0 1px rgba(20, 22, 30, 0.06)',
          margin: '24px',
          maxHeight: 'calc(100% - 48px)',
          maxWidth: 'calc(100% - 48px)',
          width: 1200,
        },
      },
    }}
    onClose={onClose}
  >
    {/* MUI размонтирует содержимое после закрытия: при следующем открытии
        выбор раздела и элементов начинается заново. */}
    <DataCatalogContent
      projectId={projectId}
      initialSection={initialSection}
      onClose={onClose}
    />
  </Dialog>
);

export const DataCatalogModal = memo(DataCatalogModalComponent);
