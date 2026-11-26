import React, { useState } from 'react';
import {
  Box,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  TablePagination,
  Paper,
  CircularProgress,
  Typography
} from '@mui/material';

export default function DataTable({
  columns = [],
  rows = [],
  loading = false,
  emptyMessage = 'No records found.',
  defaultPageSize = 10,
  pageSizeOptions = [10, 25, 50]
}) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(defaultPageSize);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedRows = rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Paper
      elevation={0}
      sx={{
        width: '100%',
        background: 'var(--theme-30-card, linear-gradient(145deg, #ffffff 0%, #f8fafc 100%))',
        borderRadius: { xs: '8px', sm: '10px' },
        border: '1px solid var(--theme-30-border, rgba(226, 232, 240, 0.9))',
        boxShadow: '0 12px 32px -8px rgba(15, 23, 42, 0.09), 0 4px 12px -2px rgba(15, 23, 42, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.95)',
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minHeight: 0,
        overflow: 'hidden'
      }}
    >
      <TableContainer
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          '&::-webkit-scrollbar': { width: '6px', height: '6px' },
          '&::-webkit-scrollbar-track': { background: '#f8fafc' },
          '&::-webkit-scrollbar-thumb': { backgroundColor: '#cbd5e1', borderRadius: '4px' },
          '&::-webkit-scrollbar-thumb:hover': { backgroundColor: '#94a3b8' }
        }}
      >
        <Table stickyHeader sx={{ minWidth: { xs: 550, sm: 650 } }}>
          <TableHead>
            <TableRow>
              {columns.map((col, idx) => (
                <TableCell
                  key={idx}
                  align={col.align || 'left'}
                  sx={{
                    backgroundColor: 'var(--theme-60-sidebar, #12131c) !important',
                    color: '#ffffff !important',
                    fontWeight: 800,
                    fontSize: '0.74rem',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    borderBottom: '2px solid #e5a93c',
                    py: 1.1,
                    px: 1.5,
                    width: col.width || 'auto',
                    minWidth: col.minWidth || 'auto',
                    ...col.headerStyle
                  }}
                >
                  {col.header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} sx={{ py: 6, textAlign: 'center' }}>
                  <CircularProgress size={30} sx={{ color: '#e5a93c' }} />
                </TableCell>
              </TableRow>
            ) : paginatedRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} sx={{ py: 6, textAlign: 'center', color: '#94a3b8' }}>
                  <Typography variant="body2">{emptyMessage}</Typography>
                </TableCell>
              </TableRow>
            ) : (
              paginatedRows.map((row, rIdx) => (
                <TableRow
                  key={row.id || rIdx}
                  hover
                  sx={{
                    '&:hover': { backgroundColor: '#fafafb' },
                    transition: 'background-color 0.15s ease'
                  }}
                >
                  {columns.map((col, cIdx) => (
                    <TableCell
                      key={cIdx}
                      align={col.align || 'left'}
                      sx={{
                        py: 0.95,
                        px: 1.5,
                        borderBottom: '1px solid #f1f5f9',
                        fontSize: '0.84rem',
                        color: '#0f172a',
                        ...(typeof col.cellStyle === 'function' ? col.cellStyle(row) : col.cellStyle)
                      }}
                    >
                      {col.render
                        ? col.render(row)
                        : col.field && row[col.field] !== undefined && row[col.field] !== null
                        ? String(row[col.field])
                        : '—'}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {rows.length > 0 && (
        <TablePagination
          rowsPerPageOptions={pageSizeOptions}
          component="div"
          count={rows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{
            flexShrink: 0,
            borderTop: '1px solid #f1f5f9',
            backgroundColor: '#ffffff',
            color: '#64748b',
            '& .MuiTablePagination-toolbar': {
              flexWrap: 'wrap',
              px: { xs: 1, sm: 2 },
              minHeight: 40,
              gap: { xs: 0.5, sm: 1 }
            },
            '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
              fontSize: '0.78rem',
              fontWeight: 600
            },
            '& .MuiTablePagination-actions button': {
              color: '#12131c',
              p: 0.5,
              '&:hover': {
                backgroundColor: 'rgba(229, 169, 60, 0.15)',
                color: '#e5a93c'
              }
            }
          }}
        />
      )}
    </Paper>
  );
}
