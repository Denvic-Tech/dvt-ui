import { Box, Skeleton } from '@mui/material';
import { IconBuilding } from '@tabler/icons-react';
import dayjs from 'dayjs';

import type { OrganizationReadSchema } from '@/shared/gatewayClient';
import {
  TokenListGridRow,
  TokenListRowCell,
  TokenListRowMenu,
} from '@/shared/ui/token-list';

import {
  ORGANIZATION_ROW_COLUMNS,
  OrganizationDate,
  OrganizationDescription,
  OrganizationInn,
  OrganizationInnEmpty,
  OrganizationInnLabel,
  OrganizationName,
  OrganizationNameLine,
  OrganizationStatus,
  OrganizationStatusDot,
  OrganizationTile,
} from './styles';

// Longer INNs show the first and the last 3 digits: 123…123.
const INN_EDGE = 3;

export const shortenInn = (inn: string) =>
  inn.length > INN_EDGE * 2
    ? `${inn.slice(0, INN_EDGE)}…${inn.slice(-INN_EDGE)}`
    : inn;

const formatDateTime = (value?: string | null) =>
  value && dayjs(value).isValid()
    ? dayjs(value).format('DD.MM.YYYY, HH:mm')
    : '—';

type OrganizationRowProps = {
  organization: OrganizationReadSchema;
  isUpdating: boolean;
  onEdit: (organization: OrganizationReadSchema) => void;
  onToggleActive: (organization: OrganizationReadSchema) => void;
};

export const OrganizationRow = ({
  organization,
  isUpdating,
  onEdit,
  onToggleActive,
}: OrganizationRowProps) => {
  const isActive = organization.is_active ?? true;
  const inn = organization.inn?.trim() ?? '';
  const description = organization.description?.trim() ?? '';

  return (
    <TokenListGridRow columns={ORGANIZATION_ROW_COLUMNS}>
      <TokenListRowCell>
        <OrganizationTile aria-hidden inactive={!isActive}>
          <IconBuilding size={16} stroke={1.4} />
        </OrganizationTile>
        <OrganizationNameLine>
          <OrganizationName inactive={!isActive} title={organization.name}>
            {organization.name}
          </OrganizationName>
          {description ? (
            <OrganizationDescription title={description}>
              {description}
            </OrganizationDescription>
          ) : null}
        </OrganizationNameLine>
      </TokenListRowCell>

      <OrganizationInn>
        <OrganizationInnLabel>ИНН</OrganizationInnLabel>
        {inn ? (
          <span title={inn}>{shortenInn(inn)}</span>
        ) : (
          <OrganizationInnEmpty>—</OrganizationInnEmpty>
        )}
      </OrganizationInn>

      <OrganizationStatus active={isActive}>
        <OrganizationStatusDot aria-hidden active={isActive} />
        {isActive ? 'Активна' : 'Неактивна'}
      </OrganizationStatus>

      <OrganizationDate
        title={`Изменена: ${formatDateTime(organization.updated_at)}`}
      >
        {formatDateTime(organization.created_at)}
      </OrganizationDate>

      <TokenListRowMenu
        label={`Действия с организацией ${organization.name}`}
        actions={[
          { label: 'Изменить', onSelect: () => onEdit(organization) },
          {
            label: isActive ? 'Деактивировать' : 'Активировать',
            onSelect: () => onToggleActive(organization),
            danger: isActive,
            success: !isActive,
            disabled: isUpdating,
          },
        ]}
      />
    </TokenListGridRow>
  );
};

const Bone = ({ width, height }: { width: number; height: number }) => (
  <Skeleton
    variant='rounded'
    animation='wave'
    width={width}
    height={height}
    sx={{ flexShrink: 0, borderRadius: '6px', bgcolor: '#F1F3F8' }}
  />
);

// Repeats the geometry of OrganizationRow, so the list does not shift on load.
export const OrganizationRowSkeleton = ({
  nameWidth,
}: {
  nameWidth: number;
}) => (
  <TokenListGridRow aria-hidden columns={ORGANIZATION_ROW_COLUMNS}>
    <TokenListRowCell>
      <Skeleton
        variant='rounded'
        animation='wave'
        width={28}
        height={28}
        sx={{ flexShrink: 0, borderRadius: '8px', bgcolor: '#F1F3F8' }}
      />
      <Bone width={nameWidth} height={12} />
    </TokenListRowCell>
    <Bone width={96} height={10} />
    <Bone width={72} height={10} />
    <Bone width={112} height={10} />
    <Box />
  </TokenListGridRow>
);
