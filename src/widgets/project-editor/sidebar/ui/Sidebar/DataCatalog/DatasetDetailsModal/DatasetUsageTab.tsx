import { Box, Typography } from '@mui/material';

import {
  DATASET_USAGE_DIRECTION_LABELS,
  formatDatasetDateTime,
  useGetDatasetUsageQuery,
} from '@/entities/data/data-catalog';

import {
  Alert,
  Badge,
  Button,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/primitives';

const RESOLVED_VIA_LABELS: Record<string, string> = {
  const: 'Константа',
  expression: 'Выражение',
  sql: 'SQL',
};

interface DatasetUsageTabProps {
  datasetId: string;
  currentProjectId: string | null;
}

export const DatasetUsageTab = ({
  datasetId,
  currentProjectId,
}: DatasetUsageTabProps) => {
  const { data, error, isLoading, isFetching, refetch } =
    useGetDatasetUsageQuery({ datasetId });

  if (isLoading) {
    return (
      <Box sx={{ display: 'grid', gap: 1 }}>
        <Skeleton variant='rounded' height={36} />
        <Skeleton variant='rounded' height={36} />
        <Skeleton variant='rounded' height={36} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert
        variant='destructive'
        action={
          <Button
            size='xs'
            variant='ghost'
            onClick={() => void refetch()}
            disabled={isFetching}
          >
            Повторить
          </Button>
        }
      >
        {'message' in error
          ? error.message
          : 'Не удалось загрузить использование датасета.'}
      </Alert>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Typography variant='body2' color='text.secondary' sx={{ py: 2 }}>
        Датасет пока не используется ни в одной ноде.
      </Typography>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow hover={false}>
          <TableHead>Проект</TableHead>
          <TableHead>Нода</TableHead>
          <TableHead sx={{ width: 100 }}>Операция</TableHead>
          <TableHead sx={{ width: 110 }}>Определено</TableHead>
          <TableHead sx={{ width: 140 }}>Обновлено</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map(entry => {
          const isCurrentProject = entry.project_id === currentProjectId;

          return (
            <TableRow
              key={`${entry.project_id}:${entry.node_id}:${entry.direction}`}
            >
              <TableCell>
                <Typography
                  variant='body2'
                  sx={{
                    fontSize: 12.5,
                    fontWeight: isCurrentProject ? 600 : 400,
                  }}
                >
                  {entry.project_name || entry.project_id}
                </Typography>
                {isCurrentProject ? (
                  <Typography
                    variant='caption'
                    color='primary'
                    sx={{ fontSize: 11 }}
                  >
                    текущий проект
                  </Typography>
                ) : null}
              </TableCell>
              <TableCell sx={{ fontSize: 12.5, wordBreak: 'break-word' }}>
                {entry.node_name}
              </TableCell>
              <TableCell>
                <Badge
                  variant={entry.direction === 'write' ? 'warning' : 'primary'}
                  style={{ minHeight: 20, fontSize: 10 }}
                >
                  {DATASET_USAGE_DIRECTION_LABELS[entry.direction]}
                </Badge>
              </TableCell>
              <TableCell sx={{ fontSize: 12 }}>
                {RESOLVED_VIA_LABELS[entry.resolved_via] ?? entry.resolved_via}
              </TableCell>
              <TableCell sx={{ fontSize: 12, color: 'text.secondary' }}>
                {formatDatasetDateTime(entry.updated_at)}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};
