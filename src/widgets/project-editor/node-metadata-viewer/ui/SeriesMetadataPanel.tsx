import type { SeriesMetadata } from '@/shared/gatewayClient';
import { ColumnMetadataCard } from './components/ColumnMetadataCard.tsx';
import {
  MetadataMetricsGrid,
  MetadataPanelSurface,
  MetadataSection,
} from './components/MetadataPrimitives.tsx';
import { formatNumber } from './lib/formatters.ts';

interface SeriesMetadataPanelProps {
  metadata: SeriesMetadata;
}

export const SeriesMetadataPanel = ({ metadata }: SeriesMetadataPanelProps) => {
  return (
    <MetadataPanelSurface>
      <MetadataSection
        title='Series metadata'
        description='Одиночная колонка с полным dtype-описанием.'
      >
        <MetadataMetricsGrid
          metrics={[
            { label: 'Имя series', value: metadata.name },
            { label: 'dtype', value: metadata.column_data.dtype },
            {
              label: 'Категории',
              value: formatNumber(
                metadata.column_data.dtype_metadata?.categories_count ?? null
              ),
            },
            {
              label: 'Item size',
              value: formatNumber(
                metadata.column_data.dtype_metadata?.itemsize ?? null
              ),
            },
          ]}
        />
      </MetadataSection>

      <MetadataSection
        title='Колонка'
        description='Сводка по единственной колонке series.'
      >
        <ColumnMetadataCard column={metadata.column_data} />
      </MetadataSection>
    </MetadataPanelSurface>
  );
};
