import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
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
    apiClient.getExpenseCategories().then((res) => setCategories(res.data || []));
  }, []);

  return (
    <Box sx={{ width: '100%', maxWidth: 1400, mx: 'auto' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>
          Expense Categories & Ledger Mapping
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b' }}>
          Standard corporate expense classifications mapped to double-entry general ledger accounts
        </Typography>
      </Box>

      <Card sx={{ p: 2 }}>
        <Table size="small">
          <TableHead sx={{ backgroundColor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Category Name</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Default General Ledger Account</TableCell>
              <TableCell align="center" sx={{ fontWeight: 700 }}>Status</TableCell>
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
      </Card>
    </Box>
  );
}
