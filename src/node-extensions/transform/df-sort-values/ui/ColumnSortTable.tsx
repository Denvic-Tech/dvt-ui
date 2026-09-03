import React from 'react';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import {
  Box,
  Checkbox,
  FormControl,
  Grid2 as Grid,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

import type { Column } from '@/shared/gatewayClient';

export type SortOrder = 'ASC' | 'DESC';

export interface ColumnSortConfig {
  column: string;
  order: SortOrder;
}

interface ColumnSortTableProps {
  availableColumns: Column[];
  selectedSortColumns: ColumnSortConfig[];
  onAddSortColumn: (column: Column) => void;
  onRemoveSortColumn: (columnName: string) => void;
  onChangeSortOrder: (columnName: string, order: SortOrder) => void;
  onMoveColumnUp?: (columnName: string) => void;
  onMoveColumnDown?: (columnName: string) => void;
}

export const ColumnSortTable: React.FC<ColumnSortTableProps> = ({
  availableColumns,
  selectedSortColumns,
  onAddSortColumn,
  onRemoveSortColumn,
  onChangeSortOrder,
  onMoveColumnUp,
  onMoveColumnDown,
}) => {
  const isColumnSelected = (columnName: string) => {
    return selectedSortColumns.some(config => config.column === columnName);
  };

  const handleColumnSelect = (column: Column, isSelected: boolean) => {
    if (isSelected) {
      onAddSortColumn(column);
    } else {
      onRemoveSortColumn(column.name);
    }
  };

  return (
    <Box>
      <Grid container spacing={2} sx={{ width: '100%' }}>
        {/* Левая колонка - доступные колонки */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant='subtitle1' gutterBottom>
            Выберите колонки для сортировки
          </Typography>
          <TableContainer
            component={Paper}
            sx={{ height: '100%', minHeight: '300px' }}
          >
            <Table stickyHeader size='small'>
              <TableHead>
                <TableRow>
                  <TableCell padding='checkbox'>Выбрать</TableCell>
                  <TableCell>Имя</TableCell>
                  <TableCell>Тип данных</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {availableColumns.map(column => {
                  const isSelected = isColumnSelected(column.name);
                  return (
                    <TableRow key={column.name} sx={{ height: '53px' }}>
                      <TableCell padding='checkbox'>
                        <Checkbox
                          checked={isSelected}
                          onChange={e =>
                            handleColumnSelect(column, e.target.checked)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant='body1'
                          sx={{ fontWeight: 'medium' }}
                        >
                          {column.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant='body1' color='text.secondary'>
                          {column.dtype}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>

        {/* Правая колонка - выбранные колонки */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant='subtitle1' gutterBottom>
            Выбранные колонки для сортировки
          </Typography>
          {selectedSortColumns.length > 0 ? (
            <TableContainer
              component={Paper}
              sx={{ height: '100%', minHeight: '300px' }}
            >
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell></TableCell>
                    <TableCell>Имя</TableCell>
                    <TableCell>Порядок сортировки</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedSortColumns.map((config, index) => (
                    <TableRow key={config.column}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        <Typography
                          variant='body1'
                          sx={{ fontWeight: 'medium' }}
                        >
                          {config.column}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <FormControl size='small' fullWidth>
                          <Select
                            value={config.order}
                            onChange={e =>
                              onChangeSortOrder(
                                config.column,
                                e.target.value as SortOrder
                              )
                            }
                          >
                            <MenuItem value='ASC'>
                              По возрастанию (ASC)
                            </MenuItem>
                            <MenuItem value='DESC'>По убыванию (DESC)</MenuItem>
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {onMoveColumnUp && (
                            <IconButton
                              size='small'
                              disabled={index === 0}
                              onClick={() => onMoveColumnUp(config.column)}
                            >
                              <ArrowUpwardIcon fontSize='small' />
                            </IconButton>
                          )}
                          {onMoveColumnDown && (
                            <IconButton
                              size='small'
                              disabled={
                                index === selectedSortColumns.length - 1
                              }
                              onClick={() => onMoveColumnDown(config.column)}
                            >
                              <ArrowDownwardIcon fontSize='small' />
                            </IconButton>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Paper
              sx={{
                p: 2,
                height: '100%',
                minHeight: '300px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Typography variant='body1' color='text.secondary'>
                Не выбрано ни одной колонки для сортировки
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

// TODO: move to extension