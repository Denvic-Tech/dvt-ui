import * as React from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import MuiTable from '@mui/material/Table';
import TableBodyMui from '@mui/material/TableBody';
import TableCellMui from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableFooterMui from '@mui/material/TableFooter';
import TableHeadMui from '@mui/material/TableHead';
import TableRowMui from '@mui/material/TableRow';
import { getRadius, getSurfaceShadow } from './theme-style-helpers.ts';

export const Table = React.forwardRef<
  HTMLTableElement,
  React.ComponentProps<typeof MuiTable>
>((props, ref) => (
  <TableContainer
    component={Paper}
    elevation={0}
    sx={theme => ({
      borderRadius: getRadius(theme),
      border: '1px solid',
      borderColor: 'divider',
      boxShadow: getSurfaceShadow(theme, 'sm'),
    })}
  >
    <MuiTable ref={ref} size='small' {...props} />
  </TableContainer>
));
Table.displayName = 'Table';

export const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.ComponentProps<typeof TableHeadMui>
>((props, ref) => <TableHeadMui ref={ref} {...props} />);
TableHeader.displayName = 'TableHeader';

export const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.ComponentProps<typeof TableBodyMui>
>((props, ref) => <TableBodyMui ref={ref} {...props} />);
TableBody.displayName = 'TableBody';

export const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.ComponentProps<typeof TableFooterMui>
>((props, ref) => <TableFooterMui ref={ref} {...props} />);
TableFooter.displayName = 'TableFooter';

export const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.ComponentProps<typeof TableRowMui>
>(({ hover = true, ...props }, ref) => (
  <TableRowMui ref={ref} hover={hover} {...props} />
));
TableRow.displayName = 'TableRow';

export const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ComponentProps<typeof TableCellMui>
>(({ sx, ...props }, ref) => (
  <TableCellMui
    ref={ref}
    sx={{
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: 'text.secondary',
      ...((sx as object) ?? {}),
    }}
    {...props}
  />
));
TableHead.displayName = 'TableHead';

export const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.ComponentProps<typeof TableCellMui>
>((props, ref) => <TableCellMui ref={ref} {...props} />);
TableCell.displayName = 'TableCell';

export const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.ComponentProps<typeof Box>
>(({ sx, ...props }, ref) => (
  <Box
    ref={ref}
    component='caption'
    sx={{
      mt: 1.5,
      fontSize: 14,
      color: 'text.secondary',
      ...((sx as object) ?? {}),
    }}
    {...props}
  />
));
TableCaption.displayName = 'TableCaption';
