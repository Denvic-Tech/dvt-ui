import type { MetadataItem } from './MetadataPrimitives.tsx';
import {
  MetadataKeyValueGrid,
  MetadataSection,
} from './MetadataPrimitives.tsx';

interface ConnectionMetadataSectionProps {
  title?: string;
  description?: string;
  items: MetadataItem[];
}

export const ConnectionMetadataSection = ({
  title = 'Параметры соединения',
  description = 'Безопасные параметры подключения и идентификаторы источника.',
  items,
}: ConnectionMetadataSectionProps) => {
  return (
    <MetadataSection title={title} description={description}>
      <MetadataKeyValueGrid items={items} />
    </MetadataSection>
  );
};
