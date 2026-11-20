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
        backgroundColor: '#ffffff',
        borderRadius: { xs: '14px', sm: '20px' },
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.05)',
        overflow: 'hidden'
      }}
    >
      <TableContainer
        sx={{
          maxHeight: 620,
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          '&::-webkit-scrollbar': { height: '6px' },
          '&::-webkit-scrollbar-thumb': { backgroundColor: '#cbd5e1', borderRadius: '4px' }
        }}
      >
        <Table stickyHeader sx={{ minWidth: { xs: 550, sm: 650 } }}>
          {/* Dark Black Theme Table Header */}
          <TableHead>
            <TableRow>
              {columns.map((col, idx) => (
                <TableCell
                  key={idx}
                  align={col.align || 'left'}
                  sx={{
                    backgroundColor: '#12131c !important', // Theme Deep Charcoal Black
                    color: '#ffffff !important',
                    fontWeight: 800,
                    fontSize: '0.78rem',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    borderBottom: '2px solid #e5a93c', // Metallic Gold accent line
                    py: 1.8,
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
                <TableCell colSpan={columns.length} sx={{ py: 8, textAlign: 'center' }}>
                  <CircularProgress size={32} sx={{ color: '#e5a93c' }} />
                </TableCell>
              </TableRow>
            ) : paginatedRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} sx={{ py: 8, textAlign: 'center', color: '#94a3b8' }}>
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
                        py: 1.6,
                        borderBottom: '1px solid #f1f5f9',
                        fontSize: '0.86rem',
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
            borderTop: '1px solid #f1f5f9',
            backgroundColor: '#ffffff',
            color: '#64748b',
            '& .MuiTablePagination-toolbar': {
              flexWrap: 'wrap',
              px: { xs: 1, sm: 2 },
              minHeight: 48,
              gap: { xs: 0.5, sm: 1 }
            },
            '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
              fontSize: '0.8rem',
              fontWeight: 600
            },
            '& .MuiTablePagination-actions button': {
              color: '#12131c',
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
