import React, { useState, useEffect } from 'react';
import { expensesService } from '../../services/expensesService';
import {
  Box,
  Typography,
  Card,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Chip
} from '@mui/material';

export default function ExpenseCategoriesView() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    expensesService.getExpenseCategories().then((res) => setCategories(res.data || []));
  }, []);

  return (
    <Box sx={{ width: '100%', maxWidth: 1400, mx: 'auto', height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <Box sx={{ flexShrink: 0, mb: 1.5 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, fontSize: { xs: '1.25rem', sm: '1.45rem' } }}>
          Expense Categories & Ledger Mapping
        </Typography>
      </Box>

      <Card sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ bgcolor: '#0f172a', color: '#ffffff', fontWeight: 700, py: 1 }}>Category Name</TableCell>
                <TableCell sx={{ bgcolor: '#0f172a', color: '#ffffff', fontWeight: 700, py: 1 }}>Default General Ledger Account</TableCell>
                <TableCell align="center" sx={{ bgcolor: '#0f172a', color: '#ffffff', fontWeight: 700, py: 1 }}>Status</TableCell>
              </TableRow>
            </TableHead>
          <TableBody>
            {categories.map((c) => (
              <TableRow key={c.name}>
                <TableCell sx={{ fontWeight: 600 }}>{c.name}</TableCell>
                <TableCell sx={{ color: '#2563eb', fontWeight: 600 }}>Account {c.defaultAccountCode}</TableCell>
                <TableCell align="center">
                  <Chip size="small" label="Active" color="success" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </Box>
      </Card>
    </Box>
  );
}
