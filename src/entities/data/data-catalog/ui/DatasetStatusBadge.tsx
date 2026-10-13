import type { CSSProperties } from 'react';

import { Badge, Tooltip } from '@/shared/ui/primitives';

import {
  DATASET_FIELD_STATUS_APPEARANCE,
  DATASET_FRESHNESS_APPEARANCE,
} from '../model/presentation';
import type { DatasetFieldStatus, DatasetFreshness } from '../model/types';

const COMPACT_BADGE_STYLE: CSSProperties = {
  minHeight: 20,
  fontSize: 10,
  paddingInline: 8,
  whiteSpace: 'nowrap',
};

interface StatusBadgeProps {
  compact?: boolean;
}

export const DatasetFreshnessBadge = ({
  freshness,
  compact = false,
}: StatusBadgeProps & { freshness: DatasetFreshness }) => {
  const appearance = DATASET_FRESHNESS_APPEARANCE[freshness];

  return (
    <Tooltip title={appearance.description} placement='top'>
      <Badge
        variant={appearance.variant}
        style={compact ? COMPACT_BADGE_STYLE : undefined}
        data-testid='entities/data-catalog/freshness-badge'
      >
        {appearance.label}
      </Badge>
    </Tooltip>
  );
};

export const DatasetFieldStatusBadge = ({
  status,
  compact = true,
}: StatusBadgeProps & { status: DatasetFieldStatus }) => {
  const appearance = DATASET_FIELD_STATUS_APPEARANCE[status];

  return (
    <Tooltip title={appearance.description} placement='top'>
      <Badge
        variant={appearance.variant}
        style={compact ? COMPACT_BADGE_STYLE : undefined}
      >
        {appearance.label}
      </Badge>
    </Tooltip>
  );
};
