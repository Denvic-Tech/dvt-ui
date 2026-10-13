import { memo, type ReactNode } from 'react';
import { Box, ListItemButton, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';

import {
  getDatasetHostLabel,
  getDatasetName,
  getDatasetNamespace,
} from '../model/presentation';
import type { DatasetSummary } from '../model/types';

import { DatasetFreshnessBadge } from './DatasetStatusBadge';

interface DatasetCardProps {
  dataset: DatasetSummary;
  /** Иконка источника (логотип диалекта) — передаётся снаружи. */
  icon?: ReactNode;
  selected?: boolean;
  onOpen: (dataset: DatasetSummary) => void;
}

const MetaItem = ({ label, value }: { label: string; value: number }) => (
  <Typography
    component='span'
    variant='caption'
    sx={{ fontSize: 11, lineHeight: 1.2, color: 'text.secondary' }}
  >
    <Box component='span' sx={{ fontWeight: 600, color: 'text.primary' }}>
      {value}
    </Box>{' '}
    {label}
  </Typography>
);

export const DatasetCard = memo(
  ({ dataset, icon, selected = false, onOpen }: DatasetCardProps) => {
    const { locator } = dataset;
    const namespace = getDatasetNamespace(locator);
    const name = getDatasetName(locator);
    const description = dataset.effective_description?.trim();

    return (
      <ListItemButton
        selected={selected}
        onClick={() => onOpen(dataset)}
        data-testid='entities/data-catalog/dataset-card'
        sx={theme => ({
          width: '100%',
          minWidth: 0,
          boxSizing: 'border-box',
          alignItems: 'flex-start',
          overflow: 'hidden',
          border: '1px solid',
          borderColor: alpha(theme.palette.text.primary, 0.08),
          borderRadius: '12px',
          px: 1,
          py: 0.875,
          gap: 1,
          transition: 'border-color 150ms ease, background-color 150ms ease',
          '&:hover, &.Mui-selected, &.Mui-selected:hover': {
            borderColor: alpha(theme.palette.primary.main, 0.28),
            backgroundColor: alpha(theme.palette.primary.main, 0.04),
          },
        })}
      >
        {icon ? (
          <Box
            sx={{
              flex: '0 0 28px',
              width: 28,
              mt: 0.25,
              '& .MuiAvatar-root': { width: 28, height: 28, fontSize: 11 },
            }}
          >
            {icon}
          </Box>
        ) : null}

        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Stack
            direction='row'
            alignItems='center'
            spacing={0.75}
            sx={{ minWidth: 0 }}
          >
            <Typography
              variant='body2'
              noWrap
              title={name}
              sx={{ minWidth: 0, flex: 1, fontSize: 13, fontWeight: 600 }}
            >
              {name}
            </Typography>
            <DatasetFreshnessBadge freshness={dataset.freshness} compact />
          </Stack>

          <Typography
            variant='caption'
            noWrap
            title={dataset.physical_key}
            sx={{
              display: 'block',
              mt: 0.25,
              fontSize: 11,
              lineHeight: 1.2,
              color: 'text.secondary',
            }}
          >
            {[namespace, getDatasetHostLabel(locator)]
              .filter(Boolean)
              .join(' · ')}
          </Typography>

          {description ? (
            <Typography
              variant='caption'
              sx={{
                display: '-webkit-box',
                mt: 0.5,
                fontSize: 11.5,
                lineHeight: 1.35,
                color: 'text.primary',
                opacity: 0.8,
                overflow: 'hidden',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                wordBreak: 'break-word',
              }}
            >
              {description}
            </Typography>
          ) : null}

          <Stack direction='row' spacing={1.25} sx={{ mt: 0.625 }}>
            <MetaItem label='полей' value={dataset.field_count} />
            <MetaItem label='чтений' value={dataset.reader_count} />
            <MetaItem label='записей' value={dataset.writer_count} />
          </Stack>
        </Box>
      </ListItemButton>
    );
  }
);

DatasetCard.displayName = 'DatasetCard';
