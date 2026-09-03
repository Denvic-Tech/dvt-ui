import React, { useMemo } from 'react';
import { Chip, type ChipProps } from '@mui/material';
import { alpha } from '@mui/material/styles';
import type { Io } from '@/shared/gatewayClient';

import { IO_TYPE_COLORS } from '@/shared/colors';

import {
  Bs123,
  BsBox,
  BsCalendarDate,
  BsDatabase,
  BsQuestionSquare,
  BsTag,
  BsToggleOn,
  BsType,
} from 'react-icons/bs';
import { TbDecimal } from 'react-icons/tb';
import { MdDataObject } from 'react-icons/md';
import { LuFileSpreadsheet } from 'react-icons/lu';

type IoTypeChipProps = {
  io: Io;
  size?: 'sm' | 'md';
  variant?: 'soft' | 'outlined';
  hideLabel?: boolean;
} & Omit<ChipProps, 'label' | 'size' | 'variant' | 'color' | 'icon'>;

const getIoIcon = (io: Io): React.ReactElement => {
  switch (io) {
    case 'STRING':
      return <BsType />;
    case 'BOOLEAN':
      return <BsToggleOn />;
    case 'INT':
      return <Bs123 />;
    case 'FLOAT':
    case 'FLOAT,INT':
      return <TbDecimal />;
    case 'DATETIME':
      return <BsCalendarDate />;
    case 'JSON':
    case 'DICT':
      return <MdDataObject />;
    case 'DATAFRAME':
      return <LuFileSpreadsheet />;
    case 'DB_CONNECTION':
    case 'DB_CONNECTION_ID':
      return <BsDatabase />;
    case 'SCHEMA':
      return <LuFileSpreadsheet />;
    case 'COLUMN':
    case 'COLUMN_NAME':
      return <BsTag />;
    case 'VARIABLE':
    case 'OBJECT':
    case 'PRIMITIVE':
      return <BsBox />;
    case 'S3_CONNECTION':
    case 'S3_CONNECTION_ID':
    case 'KAFKA_CONNECTION':
    case 'KAFKA_CONNECTION_ID':
      return <BsBox />;
    case 'UNKNOWN':
    case '*':
    default:
      return <BsQuestionSquare />;
  }
};

export const IoTypeChip: React.FC<IoTypeChipProps> = ({
  io,
  size = 'md',
  variant = 'soft',
  hideLabel,
  sx,
  ...rest
}) => {
  const color = IO_TYPE_COLORS[io] ?? '#9aa0a6';
  const icon = useMemo(() => getIoIcon(io), [io]);

  const height = size === 'sm' ? 20 : 22;
  const fontSize = size === 'sm' ? 11 : 12;
  const iconSize = size === 'sm' ? 13 : 14;
  const paddingX = size === 'sm' ? 0.75 : 0.9;

  return (
    <Chip
      {...rest}
      label={hideLabel ? '' : io}
      icon={React.cloneElement(icon, { size: iconSize } as any)}
      sx={theme => ({
        height,
        px: paddingX,
        borderRadius: 999,
        fontSize,
        fontWeight: 700,
        letterSpacing: '0.03em',
        textTransform: 'uppercase',
        fontFamily:
          '"SF Pro Text", system-ui, -apple-system, "Segoe UI", Arial, sans-serif',
        ...(variant === 'outlined'
          ? {
              border: `1px solid ${alpha(color, 0.6)}`,
              backgroundColor: alpha(theme.palette.common.white, 0.55),
            }
          : {
              border: `1px solid ${alpha(color, 0.25)}`,
              backgroundColor: alpha(color, 0.1),
            }),
        color: alpha(theme.palette.common.black, 0.8),
        '& .MuiChip-icon': {
          color: alpha(color, 0.9),
          marginLeft: '6px',
          marginRight: hideLabel ? '6px' : '2px',
        },
        '& .MuiChip-label': {
          px: hideLabel ? 0 : '6px',
        },
        ...((typeof sx === 'function' ? sx(theme) : sx) as any),
      })}
    />
  );
};

