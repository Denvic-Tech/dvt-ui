import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Box, Tooltip, Typography } from '@mui/material';
import { skipToken } from '@reduxjs/toolkit/query';

import { useAppSelector } from '@/app/providers/store';

import {
  getDatasetQualifiedName,
  useGetDatasetQuery,
} from '@/entities/data/data-catalog';
import type { LineageRef, NodeField } from '@/entities/data/lineage';
import { selectNodeDataMap } from '@/entities/project-editor/graph/model/selectors';

import { describeCatalogProvenance } from '../lib/catalogDescriptions';

const shortId = (id: string) => (id.length > 8 ? `${id.slice(0, 8)}…` : id);

const useOwnerLabel = (ref: LineageRef | null | undefined): string | null => {
  const datasetId = ref?.kind === 'ds' ? ref.dataset_id : null;
  const { data: dataset } = useGetDatasetQuery(
    datasetId ? { datasetId, includeFields: true } : skipToken
  );
  const nodeData = useAppSelector(state =>
    ref?.kind === 'node' && ref.node_id
      ? selectNodeDataMap(state)[ref.node_id]
      : undefined
  );
  if (!ref) return null;
  if (ref.kind === 'ds') {
    const owner = dataset
      ? getDatasetQualifiedName(dataset.locator)
      : datasetId
        ? `датасет ${shortId(datasetId)}`
        : 'источник';
    const column =
      dataset?.fields?.find(item => item.id === ref.field_id)?.name ??
      ref.column ??
      null;
    return column ? `${owner}.${column}` : owner;
  }
  const owner =
    nodeData?.displayName ||
    nodeData?.name ||
    (ref.node_id ? `нода ${shortId(ref.node_id)}` : 'нода');
  return ref.column ? `${owner}.${ref.column}` : owner;
};

// Монтируется только при открытом тултипе: датасет владельца не запрашивается
// для каждой строки таблицы заранее.
const CatalogProvenanceText = ({ field }: { field: NodeField }) => {
  const ownerLabel = useOwnerLabel(
    field.description_provenance === 'inherited'
      ? field.description_source
      : null
  );
  const text = describeCatalogProvenance(field, ownerLabel);
  return (
    <Typography
      component='span'
      sx={{ display: 'block', fontSize: 12, overflowWrap: 'anywhere' }}
    >
      {text ? text.charAt(0).toUpperCase() + text.slice(1) : null}
    </Typography>
  );
};

/**
 * Значок (i) рядом с комментарием: в тултипе — откуда взят baseline из каталога.
 * Ничего не рендерит, если у колонки нет описания в каталоге.
 */
export const CatalogDescriptionNote = ({
  field,
}: {
  field: NodeField | null | undefined;
}) => {
  if (!field || !describeCatalogProvenance(field)) return null;
  return (
    <Tooltip title={<CatalogProvenanceText field={field} />} placement='top'>
      <Box
        component='span'
        data-testid='write-df-to-db-v4/catalog-description-note'
        aria-label='Описание из каталога данных'
        sx={{ display: 'inline-flex', flexShrink: 0, color: 'text.disabled' }}
      >
        {/* Пустой title гасит нативную подсказку обрезанного текста у предка. */}
        <Box component='span' title='' sx={{ display: 'inline-flex' }}>
          <InfoOutlinedIcon sx={{ fontSize: 14 }} />
        </Box>
      </Box>
    </Tooltip>
  );
};
