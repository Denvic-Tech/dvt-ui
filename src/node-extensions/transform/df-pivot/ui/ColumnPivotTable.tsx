import React, { useCallback } from 'react';
import {
  FormControl,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from '@mui/material';

import {
  getAllowedPivotAggFuncs,
  isPivotAggFuncAllowed,
  PIVOT_AGG_FUNCS,
} from './pivotAggfuncs';

export interface PerColumnRow {
  column: string;
  func: string;
}

interface Props {
  rows?: PerColumnRow[];
  allowedFuncs?: string[];
  defaultFunc?: string;
  dtypeMap?: Record<string, string>;
  onChange: (rows: PerColumnRow[]) => void;
}

export const ColumnPivotTable: React.FC<Props> = ({
  rows = [],
  allowedFuncs = PIVOT_AGG_FUNCS as unknown as string[],
  defaultFunc = 'first',
  dtypeMap = {},
  onChange,
}) => {
  const updateRow = useCallback(
    (i: number, nextFunc: string) => {
      const arr = rows.slice();
      arr[i] = { ...arr[i], func: nextFunc };
      onChange(arr);
    },
    [rows, onChange]
  );

  return (
    <TableContainer component={Paper}>
      <Table size='small'>
        <TableHead>
          <TableRow>
            <TableCell style={{ width: 420 }}>Колонка</TableCell>
            <TableCell style={{ width: 260 }}>Функция</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((r, i) => {
            const dt = dtypeMap[r.column];
            const allowedFuncsForColumn = getAllowedPivotAggFuncs(dt);
            return (
              <TableRow key={`${r.column}-${i}`}>
                <TableCell>{r.column}</TableCell>

                <TableCell>
                  <FormControl fullWidth size='small'>
                    <Select
                      value={
                        allowedFuncs.includes(r.func) ? r.func : defaultFunc
                      }
                      onChange={e => updateRow(i, e.target.value as string)}
                      displayEmpty
                      MenuProps={{ disableScrollLock: true }}
                    >
                      {allowedFuncs.map(f => {
                        const disabled = !isPivotAggFuncAllowed(f, dt);
                        const isDefault = f === 'first';
                        const label =
                          isDefault && r.func === 'first'
                            ? 'first (по умолчанию)'
                            : f;

                        return (
                          <MenuItem key={f} value={f} disabled={disabled}>
                            <Tooltip
                              title={
                                disabled
                                  ? `Допустимо только: ${allowedFuncsForColumn.join(', ')}`
                                  : ''
                              }
                            >
                              <span>{label}</span>
                            </Tooltip>
                          </MenuItem>
                        );
                      })}
                      {allowedFuncs.length === 0 && (
                        <MenuItem value={defaultFunc}>{defaultFunc}</MenuItem>
                      )}
                    </Select>
                  </FormControl>
                </TableCell>
              </TableRow>
            );
          })}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={2} align='center' style={{ padding: 16 }}>
                Нет выбранных колонок в values.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

// TODO: move to extension
