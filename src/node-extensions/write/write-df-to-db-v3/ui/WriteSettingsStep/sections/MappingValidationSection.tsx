import React from 'react';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { Alert, Box } from '@mui/material';

import {
  ColumnName,
  EmptyCell,
  MappingHeader,
  MappingHeaderLeft,
  MappingSection,
  MappingStatusBadge,
  MappingTable,
  MappingTableContainer,
  MappingTableHead,
  MappingTitle,
  SmallSwitch,
  StatBadge,
  StatsBadgesRow,
  StyledTableRow,
  TableBodyCell,
  TableHeadCell,
  TypeBadge,
  ValidationLabel,
  ValidationToggle,
  WarningBanner,
  WarningIconWrapper,
  WarningText,
} from '../index.styles';

type ColumnDiffStatus =
  | 'match'
  | 'soft_cast'
  | 'missing_in_db'
  | 'missing_in_df'
  | 'type_mismatch';

type ColumnDiffRow = {
  dfName: string | null;
  dfType: string | null;
  dbName: string | null;
  dbType: string | null;
  status: ColumnDiffStatus;
};

type MappingValidationSectionProps = {
  columnDiff: ColumnDiffRow[];
  diffSummary: {
    countDelta: number;
    dbCount: number;
    dfCount: number;
    missingInDb: number;
    missingInDf: number;
    softCast: number;
    typeMismatch: number;
  };
  onlySoftAndMatch: boolean;
  useMappingValidation: boolean;
  onToggleUseMappingValidation: (checked: boolean) => void;
};

const statusLabel = (status: ColumnDiffStatus) => {
  switch (status) {
    case 'match':
      return 'OK';
    case 'soft_cast':
      return 'Soft-cast';
    case 'missing_in_db':
      return 'Нет в БД';
    case 'missing_in_df':
      return 'Нет в DF';
    case 'type_mismatch':
      return 'Типы различаются';
  }
};

const statusVariant = (
  status: ColumnDiffStatus
): 'notInDb' | 'notInDf' | 'typeMismatch' | 'ok' | 'softCast' => {
  switch (status) {
    case 'missing_in_db':
      return 'notInDb';
    case 'missing_in_df':
      return 'notInDf';
    case 'type_mismatch':
      return 'typeMismatch';
    case 'soft_cast':
      return 'softCast';
    case 'match':
      return 'ok';
  }
};

export const MappingValidationSection: React.FC<
  MappingValidationSectionProps
> = ({
  columnDiff,
  diffSummary,
  onlySoftAndMatch,
  useMappingValidation,
  onToggleUseMappingValidation,
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        flex: 1,
        flexShrink: 0,
        minHeight: 0,
      }}
    >
      <MappingSection>
        <MappingHeader>
          <MappingHeaderLeft>
            <MappingTitle>Сопоставление DF и DB</MappingTitle>
            <StatsBadgesRow>
              <StatBadge>DF: {diffSummary.dfCount}</StatBadge>
              <StatBadge>DB: {diffSummary.dbCount}</StatBadge>
              <StatBadge
                variant={diffSummary.countDelta === 0 ? 'success' : 'warning'}
              >
                Δ: {diffSummary.countDelta >= 0 ? '+' : ''}
                {diffSummary.countDelta}
              </StatBadge>
              <StatBadge
                variant={diffSummary.missingInDb > 0 ? 'error' : 'default'}
              >
                Нет в БД: {diffSummary.missingInDb}
              </StatBadge>
              <StatBadge
                variant={diffSummary.missingInDf > 0 ? 'warning' : 'default'}
              >
                Нет в DF: {diffSummary.missingInDf}
              </StatBadge>
              <StatBadge
                variant={diffSummary.typeMismatch > 0 ? 'warning' : 'default'}
              >
                Типы ≠: {diffSummary.typeMismatch}
              </StatBadge>
              <StatBadge
                variant={diffSummary.softCast > 0 ? 'info' : 'default'}
              >
                Soft-cast: {diffSummary.softCast}
              </StatBadge>
            </StatsBadgesRow>
          </MappingHeaderLeft>

          <ValidationToggle>
            <ValidationLabel>Учитывать в валидации</ValidationLabel>
            <SmallSwitch
              checked={useMappingValidation}
              onChange={(_event, checked) =>
                onToggleUseMappingValidation(checked)
              }
            />
          </ValidationToggle>
        </MappingHeader>

        <MappingTableContainer>
          <MappingTable aria-label='df-db-diff-table'>
            <MappingTableHead>
              <tr>
                <TableHeadCell>Колонка DF</TableHeadCell>
                <TableHeadCell>Тип DF</TableHeadCell>
                <TableHeadCell>Колонка DB</TableHeadCell>
                <TableHeadCell>Тип DB</TableHeadCell>
                <TableHeadCell>Статус</TableHeadCell>
              </tr>
            </MappingTableHead>
            <tbody>
              {columnDiff.length === 0 ? (
                <StyledTableRow>
                  <TableBodyCell colSpan={5}>
                    Нет данных для сравнения
                  </TableBodyCell>
                </StyledTableRow>
              ) : (
                columnDiff.map((row, index) => (
                  <StyledTableRow key={index}>
                    <TableBodyCell>
                      {row.dfName ? (
                        <ColumnName>{row.dfName}</ColumnName>
                      ) : (
                        <EmptyCell>—</EmptyCell>
                      )}
                    </TableBodyCell>
                    <TableBodyCell>
                      {row.dfType ? (
                        <TypeBadge>{row.dfType}</TypeBadge>
                      ) : (
                        <EmptyCell>—</EmptyCell>
                      )}
                    </TableBodyCell>
                    <TableBodyCell>
                      {row.dbName ? (
                        <ColumnName>{row.dbName}</ColumnName>
                      ) : (
                        <EmptyCell>—</EmptyCell>
                      )}
                    </TableBodyCell>
                    <TableBodyCell>
                      {row.dbType ? (
                        <TypeBadge>{row.dbType}</TypeBadge>
                      ) : (
                        <EmptyCell>—</EmptyCell>
                      )}
                    </TableBodyCell>
                    <TableBodyCell>
                      <MappingStatusBadge variant={statusVariant(row.status)}>
                        {statusLabel(row.status)}
                      </MappingStatusBadge>
                    </TableBodyCell>
                  </StyledTableRow>
                ))
              )}
            </tbody>
          </MappingTable>
        </MappingTableContainer>
      </MappingSection>

      {!onlySoftAndMatch ? (
        <WarningBanner>
          <WarningIconWrapper>
            <WarningAmberIcon />
          </WarningIconWrapper>
          <WarningText>
            Обнаружены расхождения между DataFrame и таблицей базы данных.
            {useMappingValidation
              ? ' Из-за включенного флага они блокируют сохранение.'
              : ' Сейчас они носят информативный характер.'}
          </WarningText>
        </WarningBanner>
      ) : diffSummary.softCast > 0 ? (
        <Alert severity='info' variant='outlined'>
          Структуры совместимы с мягким приведением типов (Soft-cast).
        </Alert>
      ) : (
        <Alert severity='success' variant='outlined'>
          Структуры согласованы.
        </Alert>
      )}
    </Box>
  );
};
