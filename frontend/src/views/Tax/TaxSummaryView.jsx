import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { reportsService } from '../../services/reportsService';
import { showNotification } from '../../store';
import StatCard from '../../components/Common/StatCard';
import DataTable from '../../components/Common/DataTable';
import {
  Box,
  Typography,
  Grid,
  Card,
  Chip
} from '@mui/material';
import TaxIcon from '@mui/icons-material/Receipt';
import ItcIcon from '@mui/icons-material/Shield';
import LiabilityIcon from '@mui/icons-material/AccountBalanceWallet';

export default function TaxSummaryView() {
  const dispatch = useDispatch();
  const refreshKey = useSelector((state) => state.finance.refreshKey);
  const [taxData, setTaxData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchTax = async () => {
    try {
      setLoading(true);
      const res = await reportsService.getTaxSummary();
      setTaxData(res.data);
    } catch (err) {
      dispatch(showNotification({ message: err.message, severity: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTax();
  }, [refreshKey]);

  const inputGst = taxData?.inputGst || {};
  const outputGst = taxData?.outputGst || {};
  const records = taxData?.records || [];

  const columns = [
    { header: 'Date', field: 'date', width: 110 },
    { header: 'Type', field: 'transactionType', width: 130 },
    {
      header: 'Reference #',
      field: 'referenceNumber',
      width: 150,
      cellStyle: { fontWeight: 600, color: '#e5a93c' }
    },
    { header: 'Party Name', field: 'partyName', minWidth: 160 },
    { header: 'Party GSTIN', field: 'partyGstin', width: 160 },
    { header: 'Tax Type', field: 'taxType', width: 110 },
    {
      header: 'Taxable (₹)',
      field: 'taxableAmount',
      align: 'right',
      width: 130,
      render: (r) => (r.taxableAmount !== undefined ? `₹${r.taxableAmount.toLocaleString('en-IN')}` : '₹0')
    },
    {
      header: 'CGST (₹)',
      field: 'cgst',
      align: 'right',
      width: 100,
      render: (r) => (r.cgst !== undefined ? `₹${r.cgst.toLocaleString('en-IN')}` : '₹0')
    },
    {
      header: 'SGST (₹)',
      field: 'sgst',
      align: 'right',
      width: 100,
      render: (r) => (r.sgst !== undefined ? `₹${r.sgst.toLocaleString('en-IN')}` : '₹0')
    },
    {
      header: 'IGST (₹)',
      field: 'igst',
      align: 'right',
      width: 100,
      render: (r) => (r.igst !== undefined ? `₹${r.igst.toLocaleString('en-IN')}` : '₹0')
    },
    {
      header: 'Total Tax (₹)',
      field: 'totalTax',
      align: 'right',
      width: 130,
      cellStyle: { fontWeight: 700 },
      render: (r) => (r.totalTax !== undefined ? `₹${r.totalTax.toLocaleString('en-IN')}` : '₹0')
    },
    {
      header: 'Direction',
      field: 'direction',
      width: 120,
      align: 'center',
      render: (r) => {
        const isInput = r.direction === 'INPUT';
        return (
          <Chip
            label={r.direction}
            size="small"
            sx={{
              fontWeight: 600,
              fontSize: '0.72rem',
              backgroundColor: isInput ? '#f0fdf4' : '#eff6ff',
              color: isInput ? '#16a34a' : '#2563eb',
              borderRadius: '6px'
            }}
          />
        );
      }
    }
  ];

  return (
    <Box sx={{ width: '100%', maxWidth: 1400, mx: 'auto', height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <Box sx={{ flexShrink: 0, mb: 1.5 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', fontSize: { xs: '1.25rem', sm: '1.45rem' } }}>
          GST Tax Summary & Filings Overview
        </Typography>
      </Box>

      <Grid container spacing={1.5} sx={{ flexShrink: 0, mb: 1.5 }}>
        <Grid item xs={12} sm={4}>
          <StatCard
            title="Total Input Tax Credit (ITC)"
            value={inputGst.total || 0}
            icon={ItcIcon}
            color="#10b981"
            subtitle={`CGST: ₹${inputGst.cgst?.toLocaleString('en-IN') || 0} | SGST: ₹${inputGst.sgst?.toLocaleString('en-IN') || 0} | IGST: ₹${inputGst.igst?.toLocaleString('en-IN') || 0}`}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard
            title="Total Output GST Collected"
            value={outputGst.total || 0}
            icon={TaxIcon}
            color="#e5a93c"
            subtitle={`CGST: ₹${outputGst.cgst?.toLocaleString('en-IN') || 0} | SGST: ₹${outputGst.sgst?.toLocaleString('en-IN') || 0} | IGST: ₹${outputGst.igst?.toLocaleString('en-IN') || 0}`}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard
            title="Net Tax Liability"
            value={taxData?.netTaxLiability || 0}
            icon={LiabilityIcon}
            color={taxData?.netTaxLiability > 0 ? '#ef4444' : '#10b981'}
            subtitle={taxData?.isRefundable ? 'Accumulated ITC carryforward balance' : 'Payable to Government (GSTR-3B)'}
          />
        </Grid>
      </Grid>

      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a', mb: 1, flexShrink: 0 }}>
          GST Transaction Ledger & Invoices
        </Typography>
        <DataTable
          columns={columns}
          rows={records}
          loading={loading}
          defaultPageSize={10}
          emptyMessage="No tax records found for the current period."
        />
      </Box>
    </Box>
  );
}
