import { styled } from '@mui/material/styles';

import type { ProjectVariableType } from '@/shared/lib/variables';

type VariableTypeMeta = {
  bgLight: string;
  color: string;
  label: string;
  shortLabel: string;
};

const TYPE_META: Record<ProjectVariableType, VariableTypeMeta> = {
  STRING: {
    bgLight: '#d1fae5',
    color: '#10b981',
    label: 'STRING',
    shortLabel: 'STR',
  },
  BOOLEAN: {
    bgLight: '#fef3c7',
    color: '#f59e0b',
    label: 'BOOLEAN',
    shortLabel: 'BOOL',
  },
  INT: {
    bgLight: '#dbeafe',
    color: '#3b82f6',
    label: 'INT',
    shortLabel: 'INT',
  },
  FLOAT: {
    bgLight: '#cffafe',
    color: '#06b6d4',
    label: 'FLOAT',
    shortLabel: 'FLT',
  },
  DATETIME: {
    bgLight: '#ede9fe',
    color: '#8b5cf6',
    label: 'DATETIME',
    shortLabel: 'DT',
  },
  TIMEDELTA: {
    bgLight: '#f3e8ff',
    color: '#a855f7',
    label: 'TIMEDELTA',
    shortLabel: 'TD',
  },
  JSON: {
    bgLight: '#fee2e2',
    color: '#ef4444',
    label: 'JSON',
    shortLabel: 'JSON',
  },
};

const BadgeRoot = styled('span')<{
  badgeColor: string;
  badgeBackground: string;
}>(({ badgeBackground, badgeColor }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  minHeight: 18,
  padding: '0 6px',
  borderRadius: 4,
  backgroundColor: badgeBackground,
  color: badgeColor,
  fontSize: 9,
  fontWeight: 700,
  fontFamily: '"JetBrains Mono", "Fira Code", monospace',
  letterSpacing: 0.3,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}));

type VariableTypeBadgeProps = {
  isNarrow: boolean;
  type: ProjectVariableType;
};

export const getProjectVariableTypeMeta = (
  type: ProjectVariableType
): VariableTypeMeta => TYPE_META[type];

export const VariableTypeBadge = ({
  isNarrow,
  type,
}: VariableTypeBadgeProps) => {
  const meta = getProjectVariableTypeMeta(type);

  return (
    <BadgeRoot
      badgeBackground={meta.bgLight}
      badgeColor={meta.color}
      title={meta.label}
    >
      {isNarrow ? meta.shortLabel : meta.label}
    </BadgeRoot>
  );
};
