import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { styled } from '@mui/material/styles';

import { formatDatasetDateTime } from '@/entities/data/data-catalog';
import {
  LINEAGE_DESCRIPTION_PROVENANCE_APPEARANCE,
  type NodeField,
} from '@/entities/data/lineage';

import { Tooltip } from '@/shared/ui/primitives';

import { useLineageRefLabel } from '../lib/useLineageRefLabel';

import { LineNote, viewerTokens } from './NodeFieldsViewer.styles';

const ProvenanceTrigger = styled(LineNote)(({ theme }) => ({
  alignItems: 'center',
  cursor: 'help',
  display: 'inline-flex',
  gap: 3,
  outline: 'none',
  transition: 'color .12s',
  '& svg': { opacity: 0.6, transition: 'opacity .12s' },
  '&:hover, &:focus-visible': { color: viewerTokens(theme).accent },
  '&:hover svg, &:focus-visible svg': { opacity: 1 },
}));

/**
 * Откуда взялось описание колонки («Задано вручную», «Унаследовано», …).
 * Подробности — источник описания, автор и время изменения — в тултипе
 * иконки «i», если они есть в ответе.
 */
export const DescriptionProvenance = ({ field }: { field: NodeField }) => {
  const sourceLabel = useLineageRefLabel(
    field.description_source && field.description_source.key !== field.ref.key
      ? field.description_source
      : null
  );
  const provenance = field.description_provenance;

  if (
    !field.description?.trim() ||
    !provenance ||
    provenance === 'unknown' ||
    provenance === 'none'
  ) {
    return null;
  }

  const updatedAt = formatDatasetDateTime(field.description_updated_at);
  const details = [
    sourceLabel ? `Источник: ${sourceLabel.text}` : null,
    field.description_updated_by
      ? `Автор: ${field.description_updated_by}`
      : null,
    updatedAt ? `Изменено: ${updatedAt}` : null,
  ].filter((item): item is string => Boolean(item));

  const label = LINEAGE_DESCRIPTION_PROVENANCE_APPEARANCE[provenance].label;

  if (!details.length) {
    return (
      <LineNote data-testid='widgets/node-fields-viewer/description-provenance'>
        {label}
      </LineNote>
    );
  }

  // Тултип открывается и с текста, и с иконки; при наведении оба синие.
  return (
    <Tooltip
      placement='top'
      title={
        <>
          {details.map(item => (
            <div key={item}>{item}</div>
          ))}
        </>
      }
    >
      <ProvenanceTrigger
        tabIndex={0}
        aria-label={`${label}: подробнее о происхождении описания`}
        data-testid='widgets/node-fields-viewer/description-provenance'
      >
        {label}
        <InfoOutlinedIcon aria-hidden='true' sx={{ fontSize: 12 }} />
      </ProvenanceTrigger>
    </Tooltip>
  );
};
