import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';

import {
  DATASET_FRESHNESS_APPEARANCE,
  type DatasetDetails,
  formatDatasetDateTime,
  getDatasetLocatorParts,
} from '@/entities/data/data-catalog';

import {
  Alert,
  AlertDescription,
  AlertTitle,
  Card,
  CardContent,
} from '@/shared/ui/primitives';

interface DatasetOverviewTabProps {
  dataset: DatasetDetails;
}

const SectionLabel = ({ children }: { children: ReactNode }) => (
  <Typography
    variant='caption'
    sx={{
      display: 'block',
      mb: 0.75,
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: 'text.secondary',
    }}
  >
    {children}
  </Typography>
);

interface InfoItem {
  label: string;
  value: ReactNode;
  mono?: boolean;
  fullWidth?: boolean;
}

const EMPTY_VALUE = '—';

const InfoGrid = ({ items }: { items: InfoItem[] }) => (
  <Box
    sx={{
      display: 'grid',
      gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))' },
      columnGap: 3,
      rowGap: 1.5,
    }}
  >
    {items.map(item => (
      <Box
        key={item.label}
        sx={{ minWidth: 0, gridColumn: item.fullWidth ? '1 / -1' : undefined }}
      >
        <Typography
          variant='caption'
          color='text.secondary'
          sx={{ display: 'block', fontSize: 11.5 }}
        >
          {item.label}
        </Typography>
        <Typography
          variant='body2'
          sx={{
            fontSize: 13,
            wordBreak: 'break-all',
            ...(item.mono ? { fontFamily: 'monospace', fontSize: 12.5 } : null),
          }}
        >
          {item.value ?? EMPTY_VALUE}
        </Typography>
      </Box>
    ))}
  </Box>
);

const DescriptionBlock = ({ dataset }: { dataset: DatasetDetails }) => {
  const description = dataset.effective_description?.trim();
  const updatedAt = formatDatasetDateTime(dataset.description_updated_at);
  const authorship = [
    dataset.description_updated_by
      ? `Автор: ${dataset.description_updated_by}`
      : null,
    updatedAt ? `обновлено ${updatedAt}` : null,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <Box>
      <SectionLabel>Описание</SectionLabel>
      <Typography
        variant='body2'
        sx={{
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          color: description ? 'text.primary' : 'text.secondary',
          fontStyle: description ? 'normal' : 'italic',
        }}
      >
        {description || 'Описание не задано'}
      </Typography>
      {description && authorship ? (
        <Typography
          variant='caption'
          color='text.secondary'
          sx={{ display: 'block', mt: 0.5 }}
        >
          {authorship}
        </Typography>
      ) : null}
    </Box>
  );
};

export const DatasetOverviewTab = ({ dataset }: DatasetOverviewTabProps) => {
  const { locator } = dataset;
  const parts = getDatasetLocatorParts(locator);
  const lastCheckFailedAt = formatDatasetDateTime(dataset.last_check_failed_at);

  const sourceItems: InfoItem[] = [
    { label: 'Вид источника', value: locator.kind },
    { label: 'Диалект', value: parts.dialect },
    { label: 'Хост', value: parts.host },
    { label: 'Порт', value: parts.port },
    { label: 'База данных', value: parts.database },
    { label: 'Схема', value: parts.schema },
    { label: 'Таблица', value: parts.table },
    {
      label: 'Расположение',
      value: locator.location,
      mono: true,
      fullWidth: true,
    },
    {
      label: 'Физический ключ',
      value: dataset.physical_key,
      mono: true,
      fullWidth: true,
    },
  ];

  const stateItems: InfoItem[] = [
    {
      label: 'Свежесть схемы',
      value: DATASET_FRESHNESS_APPEARANCE[dataset.freshness].description,
      fullWidth: true,
    },
    {
      label: 'Схема синхронизирована',
      value: formatDatasetDateTime(dataset.schema_synced_at),
    },
    {
      label: 'Последний запуск',
      value: formatDatasetDateTime(dataset.observed_at_run),
    },
    { label: 'Создан', value: formatDatasetDateTime(dataset.created_at) },
    { label: 'Обновлён', value: formatDatasetDateTime(dataset.updated_at) },
    {
      label: 'Подключений',
      value: dataset.connection_ids?.length ?? 0,
    },
    { label: 'Полей', value: dataset.fields?.length ?? 0 },
  ];

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      {dataset.last_check_error ? (
        <Alert variant='destructive'>
          <AlertTitle>
            {lastCheckFailedAt
              ? `Ошибка проверки источника (${lastCheckFailedAt})`
              : 'Ошибка проверки источника'}
          </AlertTitle>
          <AlertDescription sx={{ wordBreak: 'break-word' }}>
            {dataset.last_check_error}
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardContent sx={{ px: 2.5, py: 2 }}>
          <DescriptionBlock dataset={dataset} />
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ px: 2.5, py: 2 }}>
          <SectionLabel>Источник</SectionLabel>
          <InfoGrid items={sourceItems} />
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ px: 2.5, py: 2 }}>
          <SectionLabel>Состояние</SectionLabel>
          <InfoGrid items={stateItems} />
        </CardContent>
      </Card>
    </Box>
  );
};
