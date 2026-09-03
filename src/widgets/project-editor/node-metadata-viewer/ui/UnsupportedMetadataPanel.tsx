import type { NodeMetadata } from '@/shared/gatewayClient';

import {
  MetadataJsonPreview,
  MetadataKeyValueGrid,
  MetadataMetricsGrid,
  MetadataPanelSurface,
  MetadataSection,
} from './components/MetadataPrimitives';
import { getValueKind } from './lib/formatters';

type NodeOutputMetadata = Exclude<NodeMetadata[string], null>;

interface UnsupportedMetadataPanelProps {
  metadata: NodeOutputMetadata;
}

export const UnsupportedMetadataPanel = ({
  metadata,
}: UnsupportedMetadataPanelProps) => {
  const primitiveItems = Object.entries(metadata).map(([key, value]) => ({
    label: key,
    value,
    mono: typeof value === 'string' && value.length > 30,
  }));

  return (
    <MetadataPanelSurface>
      <MetadataSection
        title={`${metadata.type} metadata`}
        description='Для этого типа ещё нет специализированного визуального рендера, поэтому показывается аккуратный fallback.'
      >
        <MetadataMetricsGrid
          metrics={[
            { label: 'Metadata type', value: metadata.type },
            {
              label: 'Payload kind',
              value: getValueKind(metadata),
            },
            {
              label: 'Top-level fields',
              value: String(Object.keys(metadata).length),
            },
            {
              label: 'Preview mode',
              value: 'Fallback',
            },
          ]}
        />
      </MetadataSection>

      <MetadataSection
        title='Сводка'
        description='Плоские поля верхнего уровня для быстрого просмотра.'
      >
        <MetadataKeyValueGrid items={primitiveItems} />
      </MetadataSection>

      <MetadataSection
        title='Raw payload'
        description='Полный JSON объекта метаданных.'
      >
        <MetadataJsonPreview value={metadata} />
      </MetadataSection>
    </MetadataPanelSurface>
  );
};
