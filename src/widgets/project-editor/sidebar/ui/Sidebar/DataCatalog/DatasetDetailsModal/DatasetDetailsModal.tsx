import { useState } from 'react';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import RefreshRoundedIcon from '@mui/icons-material/RefreshRounded';
import { Box, Stack, Typography } from '@mui/material';

import {
  type DatasetDetails,
  DatasetFreshnessBadge,
  formatDatasetDateTime,
  getDatasetDialect,
  getDatasetHostLabel,
  getDatasetName,
  getDatasetQualifiedName,
  normalizeDatasetDialect,
  useGetDatasetQuery,
} from '@/entities/data/data-catalog';
import { ConnectionLogo } from '@/entities/data/db-connection';

import {
  Alert,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  IconButton,
  Skeleton,
  Spinner,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Tooltip,
} from '@/shared/ui/primitives';

import { DatasetFieldsTab } from './DatasetFieldsTab';
import { DatasetOverviewTab } from './DatasetOverviewTab';
import { DatasetUsageTab } from './DatasetUsageTab';

type DatasetDetailsTab = 'overview' | 'fields' | 'usage';

interface DatasetDetailsModalProps {
  datasetId: string | null;
  open: boolean;
  currentProjectId: string | null;
  onClose: () => void;
  onExited?: () => void;
}

/**
 * Карточка датасета. Сейчас read-only; редактирование описаний
 * (PATCH /data-catalog/datasets/{id}) планируется встроить во вкладки
 * «Обзор» и «Поля» и кнопки футера.
 */
export const DatasetDetailsModal = ({
  datasetId,
  open,
  currentProjectId,
  onClose,
  onExited,
}: DatasetDetailsModalProps) => (
  <Dialog
    open={open}
    onClose={onClose}
    maxWidth='md'
    {...(onExited ? { TransitionProps: { onExited } } : {})}
    slotProps={{
      paper: {
        sx: {
          height: 'min(760px, calc(100vh - 64px))',
          // Обёртка примитива Dialog должна занять всю высоту paper.
          '& > .MuiBox-root': { flex: 1, minHeight: 0 },
        },
      },
    }}
  >
    {datasetId ? (
      <DatasetDetailsBody
        datasetId={datasetId}
        currentProjectId={currentProjectId}
        onClose={onClose}
      />
    ) : null}
  </Dialog>
);

interface DatasetDetailsBodyProps {
  datasetId: string;
  currentProjectId: string | null;
  onClose: () => void;
}

const DatasetDetailsBody = ({
  datasetId,
  currentProjectId,
  onClose,
}: DatasetDetailsBodyProps) => {
  const [activeTab, setActiveTab] = useState<DatasetDetailsTab>('overview');

  // Каждое открытие синхронизирует схему с источником (sync=true).
  const { data, error, isLoading, isFetching, refetch } = useGetDatasetQuery(
    { datasetId, sync: true, includeFields: true },
    { refetchOnMountOrArgChange: true }
  );

  const isSyncing = isFetching;
  const errorMessage = error
    ? 'message' in error
      ? error.message
      : 'Не удалось загрузить сведения о датасете.'
    : null;

  return (
    <Box
      data-testid='widgets/project-editor/sidebar/dataset-details-modal'
      sx={{
        display: 'grid',
        gridTemplateRows: 'auto minmax(0, 1fr) auto',
        height: '100%',
        minHeight: 0,
      }}
    >
      <DatasetDetailsHeader
        dataset={data}
        isLoading={isLoading}
        isSyncing={isSyncing}
        onRefresh={() => void refetch()}
        onClose={onClose}
      />

      <DialogContent
        sx={{ minHeight: 0, overflowY: 'auto', alignContent: 'start' }}
      >
        {errorMessage ? (
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
            {errorMessage}
          </Alert>
        ) : null}

        {isLoading ? <DatasetDetailsSkeleton /> : null}

        {data ? (
          <Tabs
            value={activeTab}
            onValueChange={value => setActiveTab(value as DatasetDetailsTab)}
          >
            <TabsList>
              <TabsTrigger value='overview'>Обзор</TabsTrigger>
              <TabsTrigger value='fields'>
                {`Поля (${data.fields?.length ?? 0})`}
              </TabsTrigger>
              <TabsTrigger value='usage'>Использование</TabsTrigger>
            </TabsList>

            <TabsContent value='overview'>
              <DatasetOverviewTab dataset={data} />
            </TabsContent>
            <TabsContent value='fields'>
              <DatasetFieldsTab fields={data.fields ?? []} />
            </TabsContent>
            <TabsContent value='usage'>
              <DatasetUsageTab
                datasetId={data.id}
                currentProjectId={currentProjectId}
              />
            </TabsContent>
          </Tabs>
        ) : null}
      </DialogContent>

      <DialogFooter sx={{ justifyContent: 'space-between' }}>
        <Typography variant='caption' color='text.secondary'>
          {isSyncing
            ? 'Синхронизация схемы с источником…'
            : data?.schema_synced_at
              ? `Схема синхронизирована: ${formatDatasetDateTime(data.schema_synced_at)}`
              : 'Схема ещё не синхронизировалась'}
        </Typography>
        <Button variant='outline' onClick={onClose}>
          Закрыть
        </Button>
      </DialogFooter>
    </Box>
  );
};

interface DatasetDetailsHeaderProps {
  dataset: DatasetDetails | undefined;
  isLoading: boolean;
  isSyncing: boolean;
  onRefresh: () => void;
  onClose: () => void;
}

const DatasetDetailsHeader = ({
  dataset,
  isLoading,
  isSyncing,
  onRefresh,
  onClose,
}: DatasetDetailsHeaderProps) => (
  <DialogHeader>
    <Stack direction='row' alignItems='flex-start' spacing={1.5}>
      {dataset ? (
        <Box
          sx={{
            flex: '0 0 36px',
            '& .MuiAvatar-root': { width: 36, height: 36 },
          }}
        >
          <ConnectionLogo
            type={normalizeDatasetDialect(getDatasetDialect(dataset.locator))}
            label={getDatasetDialect(dataset.locator) ?? dataset.locator.kind}
          />
        </Box>
      ) : null}

      <Box sx={{ minWidth: 0, flex: 1 }}>
        {dataset ? (
          <>
            <Stack
              direction='row'
              alignItems='center'
              spacing={1}
              sx={{ minWidth: 0 }}
            >
              <DialogTitle
                noWrap
                title={getDatasetName(dataset.locator)}
                sx={{ minWidth: 0 }}
              >
                {getDatasetName(dataset.locator)}
              </DialogTitle>
              <DatasetFreshnessBadge freshness={dataset.freshness} />
            </Stack>
            <DialogDescription noWrap title={dataset.physical_key}>
              {[
                getDatasetQualifiedName(dataset.locator),
                getDatasetHostLabel(dataset.locator),
              ]
                .filter(Boolean)
                .join(' · ')}
            </DialogDescription>
          </>
        ) : isLoading ? (
          <>
            <Skeleton variant='text' width={220} height={32} />
            <Skeleton variant='text' width={320} />
          </>
        ) : (
          <DialogTitle>Датасет</DialogTitle>
        )}
      </Box>

      <Stack direction='row' spacing={0.5} sx={{ flexShrink: 0 }}>
        <Tooltip title='Синхронизировать повторно'>
          <span>
            <IconButton
              aria-label='Синхронизировать датасет'
              onClick={onRefresh}
              disabled={isSyncing}
            >
              {isSyncing ? (
                <Spinner size={16} />
              ) : (
                <RefreshRoundedIcon fontSize='small' />
              )}
            </IconButton>
          </span>
        </Tooltip>
        <IconButton aria-label='Закрыть' onClick={onClose}>
          <CloseRoundedIcon fontSize='small' />
        </IconButton>
      </Stack>
    </Stack>
  </DialogHeader>
);

const DatasetDetailsSkeleton = () => (
  <Stack spacing={1.5}>
    <Skeleton variant='rounded' height={36} />
    <Skeleton variant='rounded' height={96} />
    <Skeleton variant='rounded' height={180} />
  </Stack>
);
