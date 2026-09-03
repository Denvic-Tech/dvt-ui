import React, { useMemo } from 'react';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import {
  Autocomplete,
  Box,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';

export type MappingNodeInputRow = {
  id: string;
  key: string;
  value: string;
};

type MappingNodeInputProps = {
  rows: MappingNodeInputRow[];
  onRowsChange: (rows: MappingNodeInputRow[]) => void;
  options: string[];
  keyPlaceholder: string;
  valuePlaceholder?: string;
  emptyHint?: string;
};

const createRowId = () =>
  `row-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const ensureTrailingEmptyRow = (rows: MappingNodeInputRow[]) => {
  const hasEmpty = rows.some(row => !row.key && !row.value);
  return hasEmpty ? rows : [...rows, { id: createRowId(), key: '', value: '' }];
};

export const MappingNodeInput: React.FC<MappingNodeInputProps> = ({
  rows,
  onRowsChange,
  options,
  keyPlaceholder,
  valuePlaceholder = 'Value',
  emptyHint,
}) => {
  const displayRows = useMemo(() => ensureTrailingEmptyRow(rows), [rows]);

  const updateRows = (nextRows: MappingNodeInputRow[]) => {
    const cleaned = nextRows.filter(
      row => row.key.trim() !== '' || row.value.trim() !== ''
    );
    onRowsChange(cleaned);
  };

  const handleRowChange = (
    index: number,
    field: 'key' | 'value',
    value: string
  ) => {
    let nextRows = [...rows];
    if (index >= nextRows.length) {
      nextRows = [...nextRows, { id: createRowId(), key: '', value: '' }];
    }

    nextRows = nextRows.map((row, idx) =>
      idx === index ? { ...row, [field]: value } : row
    );

    updateRows(nextRows);
  };

  const handleCommonSelect = (index: number, value: string) => {
    if (!value) {
      return;
    }

    handleRowChange(index, 'key', value);
  };

  const handleRemove = (index: number) => {
    if (index >= rows.length) {
      return;
    }

    updateRows(rows.filter((_, idx) => idx !== index));
  };

  const handleAdd = () => {
    updateRows([...rows, { id: createRowId(), key: '', value: '' }]);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <TableContainer>
        <Table size='small' stickyHeader>
          <TableBody>
            {displayRows.map((row, index) => {
              const isPlaceholder =
                index >= rows.length && !row.key && !row.value;

              return (
                <TableRow key={row.id} hover>
                  <TableCell sx={{ minWidth: 220 }}>
                    <Autocomplete
                      freeSolo
                      autoHighlight
                      includeInputInList
                      forcePopupIcon
                      options={options}
                      value={row.key}
                      onChange={(_, value) =>
                        handleCommonSelect(index, value ?? '')
                      }
                      inputValue={row.key}
                      onInputChange={(_, value) =>
                        handleRowChange(index, 'key', value)
                      }
                      renderInput={params => {
                        const {
                          InputLabelProps,
                          InputProps,
                          inputProps,
                          ...rest
                        } = params;

                        return (
                          <TextField
                            {...rest}
                            variant='standard'
                            size='small'
                            placeholder={keyPlaceholder}
                            fullWidth
                            slotProps={{
                              inputLabel: {
                                ...InputLabelProps,
                                className: InputLabelProps?.className ?? '',
                              },
                              input: {
                                ...InputProps,
                                disableUnderline: true,
                              },
                              htmlInput: {
                                ...inputProps,
                              },
                            }}
                          />
                        );
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      variant='standard'
                      size='small'
                      placeholder={valuePlaceholder}
                      value={row.value}
                      onChange={event =>
                        handleRowChange(index, 'value', event.target.value)
                      }
                      fullWidth
                      slotProps={{
                        input: { disableUnderline: true },
                      }}
                    />
                  </TableCell>
                  <TableCell align='right'>
                    <IconButton
                      size='small'
                      onClick={() => handleRemove(index)}
                      disabled={isPlaceholder}
                      sx={{ color: 'text.disabled' }}
                    >
                      <CloseRoundedIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        {emptyHint ? (
          <Typography variant='caption' color='text.disabled'>
            {emptyHint}
          </Typography>
        ) : (
          <span />
        )}

        <Box
          component='button'
          type='button'
          onClick={handleAdd}
          sx={theme => ({
            border: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.grey[50],
            color: theme.palette.text.secondary,
            borderRadius: 2,
            px: 1.5,
            py: 0.75,
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 150ms ease',
            '&:hover': {
              backgroundColor: theme.palette.grey[100],
              color: theme.palette.text.primary,
            },
          })}
        >
          Добавить строку
        </Box>
      </Box>
    </Box>
  );
};
