import { ConnectionMetadataSection } from './components/ConnectionMetadataSection.tsx';
import type {
  MetadataItem,
  MetadataMetric,
} from './components/MetadataPrimitives.tsx';
import {
  MetadataJsonPreview,
  MetadataKeyValueGrid,
  MetadataMetricsGrid,
  MetadataPanelSurface,
  MetadataSection,
} from './components/MetadataPrimitives.tsx';

interface MetadataDetailSection {
  title: string;
  description?: string;
  items: MetadataItem[];
}

interface ConnectionMetadataPanelProps {
  title: string;
  description: string;
  metrics: MetadataMetric[];
  connectionItems: MetadataItem[];
  detailSections?: MetadataDetailSection[];
  previewValue: unknown;
}

export const ConnectionMetadataPanel = ({
  title,
  description,
  metrics,
  connectionItems,
  detailSections = [],
  previewValue,
}: ConnectionMetadataPanelProps) => {
  const visibleSections = detailSections.filter(section =>
    section.items.some(item => item.value != null && item.value !== '')
  );

  return (
    <MetadataPanelSurface>
      <MetadataSection title={title} description={description}>
        <MetadataMetricsGrid metrics={metrics} />
      </MetadataSection>

      <ConnectionMetadataSection items={connectionItems} />

      {visibleSections.map(section => (
        <MetadataSection
          key={section.title}
          title={section.title}
          {...(section.description ? { description: section.description } : {})}
        >
          <MetadataKeyValueGrid items={section.items} />
        </MetadataSection>
      ))}

      <MetadataSection
        title='Raw payload'
        description='Форматированный JSON полезен, если нужен полный контракт без визуальной агрегации.'
      >
        <MetadataJsonPreview value={previewValue} />
      </MetadataSection>
    </MetadataPanelSurface>
  );
};
