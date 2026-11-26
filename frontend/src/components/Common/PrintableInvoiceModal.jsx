import React from 'react';
import { useSelector } from 'react-redux';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Divider,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Grid
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import CloseIcon from '@mui/icons-material/Close';

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function twoDigitsToWords(n) {
  if (n < 20) return ONES[n];
  return `${TENS[Math.floor(n / 10)]}${n % 10 ? ' ' + ONES[n % 10] : ''}`;
}

function numberToIndianWords(amount) {
  const num = Math.round(Number(amount) || 0);
  if (num === 0) return 'Rupees Zero Only';
  const parts = [];
  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const hundred = Math.floor((num % 1000) / 100);
  const rest = num % 100;

  if (crore) parts.push(`${twoDigitsToWords(crore)} Crore`);
  if (lakh) parts.push(`${twoDigitsToWords(lakh)} Lakh`);
  if (thousand) parts.push(`${twoDigitsToWords(thousand)} Thousand`);
  if (hundred) parts.push(`${ONES[hundred]} Hundred`);
  if (rest) parts.push(twoDigitsToWords(rest));

  return `Indian Rupees ${parts.join(' ')} Only`;
}

const getStatusBadge = (status) => {
  switch (status) {
    case 'Paid':
      return { dot: '#10b981', bg: '#ecfdf5', text: '#047857', border: '#a7f3d0' };
    case 'Partially Paid':
      return { dot: '#f59e0b', bg: '#fffbeb', text: '#b45309', border: '#fde68a' };
    case 'Posted':
      return { dot: '#3b82f6', bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' };
    case 'Approved':
      return { dot: '#8b5cf6', bg: '#f5f3ff', text: '#6d28d9', border: '#ddd6fe' };
    case 'Cancelled':
      return { dot: '#ef4444', bg: '#fef2f2', text: '#b91c1c', border: '#fecaca' };
    default:
      return { dot: '#64748b', bg: '#f8fafc', text: '#475569', border: '#e2e8f0' };
  }
};

export default function PrintableInvoiceModal({ open, invoice, onClose }) {
  const company = useSelector((state) => state.finance.company);
  if (!invoice) return null;

  const badge = getStatusBadge(invoice.status);
  const balanceDue = invoice.outstandingAmount ?? 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '10px',
          overflow: 'hidden'
        }
      }}
    >
      {/* Preview Toolbar (Hidden when printing) */}
      <DialogActions
        className="no-print"
        sx={{
          px: 3,
          py: 1.5,
          backgroundColor: '#0c0d14',
          borderBottom: '1px solid #1e202d',
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#e5a93c' }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#ffffff', fontSize: '0.88rem' }}>
            Tax Invoice Preview — {invoice.invoiceNumber}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.2 }}>
          <Button
            variant="contained"
            size="small"
            startIcon={<PrintIcon sx={{ fontSize: 17 }} />}
            onClick={handlePrint}
            sx={{
              bgcolor: '#e5a93c',
              color: '#0f172a',
              fontWeight: 800,
              textTransform: 'none',
              borderRadius: '6px',
              px: 2.2,
              boxShadow: 'none',
              '&:hover': { bgcolor: '#d4982e', boxShadow: 'none' }
            }}
          >
            Print / Save PDF
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={onClose}
            startIcon={<CloseIcon sx={{ fontSize: 17 }} />}
            sx={{
              color: '#cbd5e1',
              borderColor: '#2a2d3d',
              textTransform: 'none',
              borderRadius: '6px',
              fontWeight: 600,
              '&:hover': { borderColor: '#64748b', bgcolor: 'rgba(255,255,255,0.05)' }
            }}
          >
            Close
          </Button>
        </Box>
      </DialogActions>

      {/* A4 Editorial Invoice Sheet */}
      <DialogContent sx={{ p: { xs: 1.5, sm: 3.5 }, backgroundColor: '#f1f5f9' }}>
        <Box
          id="printable-invoice"
          sx={{
            backgroundColor: '#ffffff',
            color: '#0f172a',
            borderRadius: '4px',
            border: '1px solid #e2e8f0',
            overflow: 'hidden'
          }}
        >
          {/* Razor-sharp Executive Brand Accent Bar */}
          <Box
            sx={{
              height: 5,
              width: '100%',
              background: 'linear-gradient(90deg, #0f172a 0%, #0f172a 72%, #e5a93c 72%, #e5a93c 100%)'
            }}
          />

          <Box sx={{ p: { xs: 2.5, sm: 4.5 } }}>
            {/* 1. CLEAN EDITORIAL HEADER */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: 2.5,
                pb: 3
              }}
            >
              {/* Issuer Details */}
              <Box sx={{ maxWidth: { xs: '100%', sm: '58%' } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1 }}>
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: '6px',
                      backgroundColor: '#0f172a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M4 6C4 4.89543 4.89543 4 6 4H8C9.10457 4 10 4.89543 10 6V18C10 19.1046 9.10457 20 8 20H6C4.89543 20 4 19.1046 4 18V6Z" fill="#e5a93c" />
                      <path d="M11 9C11 7.89543 11.8954 7 13 7H15C16.1046 7 17 7.89543 17 9V18C17 19.1046 16.1046 20 15 20H13C11.8954 20 11 19.1046 11 18V9Z" fill="#e5a93c" fillOpacity="0.75" />
                      <path d="M18 12C18 10.8954 18.8954 10 20 10H22V18C22 19.1046 21.1046 20 20 20H18V12Z" fill="#e5a93c" fillOpacity="0.5" />
                    </svg>
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 800,
                      color: '#0f172a',
                      fontSize: '1.15rem',
                      letterSpacing: '-0.02em',
                      lineHeight: 1.2
                    }}
                  >
                    {company?.legalName || company?.name || 'Quantro Finance'}
                  </Typography>
                </Box>

                <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.8rem', lineHeight: 1.5 }}>
                  {company?.address || 'Registered Office Address'}
                </Typography>
                <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.8rem', mt: 0.3 }}>
                  GSTIN: <Box component="span" sx={{ fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>{company?.gstin || 'Not Configured'}</Box>
                  {' '}•{' '}State: {company?.state || 'Local'} ({company?.stateCode || '27'})
                </Typography>
                {company?.email && (
                  <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.78rem', mt: 0.2 }}>
                    {company.email}
                  </Typography>
                )}
              </Box>

              {/* Invoice Identity */}
              <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                <Typography
                  variant="overline"
                  sx={{
                    fontWeight: 800,
                    letterSpacing: '0.16em',
                    color: '#64748b',
                    fontSize: '0.72rem',
                    display: 'block',
                    lineHeight: 1.2
                  }}
                >
                  TAX INVOICE
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 800,
                    color: '#0f172a',
                    fontSize: '1.35rem',
                    letterSpacing: '-0.02em',
                    mt: 0.3,
                    mb: 1
                  }}
                >
                  #{invoice.invoiceNumber}
                </Typography>
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.75,
                    px: 1.25,
                    py: 0.35,
                    borderRadius: '99px',
                    backgroundColor: badge.bg,
                    border: `1px solid ${badge.border}`
                  }}
                >
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: badge.dot }} />
                  <Typography variant="caption" sx={{ fontWeight: 700, color: badge.text, fontSize: '0.72rem' }}>
                    {invoice.status}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* 2. SWISS-GRID 3-COLUMN METADATA BAND */}
            <Box
              sx={{
                py: 2.5,
                mb: 3,
                borderTop: '1px solid #e2e8f0',
                borderBottom: '1px solid #e2e8f0'
              }}
            >
              <Grid container spacing={2.5} alignItems="stretch">
                {/* Col 1: Billed To */}
                <Grid item xs={12} sm={5}>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 700,
                      color: '#64748b',
                      letterSpacing: '0.08em',
                      fontSize: '0.68rem',
                      display: 'block',
                      mb: 0.6
                    }}
                  >
                    BILLED TO
                  </Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.92rem', mb: 0.3 }}>
                    {invoice.customerName}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.79rem', lineHeight: 1.45, mb: 0.5 }}>
                    {invoice.customerAddress || 'Address on file'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.75rem', display: 'block' }}>
                    GSTIN: <strong style={{ color: '#0f172a' }}>{invoice.customerGstin || 'Unregistered'}</strong>
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.74rem', display: 'block' }}>
                    Place of Supply: State {invoice.partyStateCode} ({invoice.taxType === 'INTER' ? 'Inter-State' : 'Intra-State'})
                  </Typography>
                </Grid>

                {/* Col 2: Dates & Terms */}
                <Grid item xs={6} sm={3.5}>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 700,
                      color: '#64748b',
                      letterSpacing: '0.08em',
                      fontSize: '0.68rem',
                      display: 'block',
                      mb: 0.8
                    }}
                  >
                    DETAILS
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.65 }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.72rem', display: 'block', lineHeight: 1.1 }}>
                        Issue Date
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.82rem' }}>
                        {invoice.invoiceDate}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.72rem', display: 'block', lineHeight: 1.1 }}>
                        Due Date
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.82rem' }}>
                        {invoice.dueDate}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.72rem', display: 'block', lineHeight: 1.1 }}>
                        Payment Terms
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155', fontSize: '0.8rem' }}>
                        {invoice.paymentTerms || 'Net 30 Days'} ({invoice.currency || 'INR'})
                      </Typography>
                    </Box>
                  </Box>
                </Grid>

                {/* Col 3: Amount Due Tile */}
                <Grid item xs={6} sm={3.5}>
                  <Box
                    sx={{
                      height: '100%',
                      p: 2,
                      borderRadius: '6px',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      textAlign: 'right'
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 700,
                        color: '#64748b',
                        letterSpacing: '0.08em',
                        fontSize: '0.68rem',
                        mb: 0.4
                      }}
                    >
                      {balanceDue > 0 ? 'BALANCE DUE' : 'INVOICE TOTAL'}
                    </Typography>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 800,
                        color: '#0f172a',
                        fontSize: '1.4rem',
                        fontVariantNumeric: 'tabular-nums',
                        letterSpacing: '-0.02em'
                      }}
                    >
                      ₹{(balanceDue > 0 ? balanceDue : invoice.grandTotal || 0).toLocaleString('en-IN')}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.72rem', mt: 0.4 }}>
                      Total Billed: ₹{(invoice.grandTotal || 0).toLocaleString('en-IN')}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>

            {/* 3. CLEAN LINE ITEMS TABLE */}
            <Table size="small" sx={{ mb: 3 }}>
              <TableHead>
                <TableRow
                  sx={{
                    backgroundColor: '#f8fafc',
                    '& th': {
                      color: '#475569',
                      fontWeight: 700,
                      fontSize: '0.7rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      py: 1.2,
                      borderTop: '1px solid #e2e8f0',
                      borderBottom: '1.5px solid #0f172a'
                    }
                  }}
                >
                  <TableCell width="5%">#</TableCell>
                  <TableCell width="41%">Item & Description</TableCell>
                  <TableCell align="right" width="8%">Qty</TableCell>
                  <TableCell align="right" width="13%">Rate</TableCell>
                  <TableCell align="right" width="13%">Taxable</TableCell>
                  <TableCell align="right" width="7%">GST</TableCell>
                  <TableCell align="right" width="13%">Amount</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(invoice.items || []).map((item, idx) => (
                  <TableRow
                    key={idx}
                    sx={{
                      '& td': {
                        py: 1.4,
                        borderBottom: '1px solid #f1f5f9',
                        fontSize: '0.82rem',
                        fontVariantNumeric: 'tabular-nums'
                      }
                    }}
                  >
                    <TableCell sx={{ color: '#94a3b8', fontWeight: 600 }}>{idx + 1}</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#0f172a' }}>{item.description}</TableCell>
                    <TableCell align="right" sx={{ color: '#475569' }}>{item.quantity}</TableCell>
                    <TableCell align="right" sx={{ color: '#475569' }}>₹{item.unitPrice?.toLocaleString('en-IN')}</TableCell>
                    <TableCell align="right" sx={{ color: '#475569' }}>₹{item.taxableAmount?.toLocaleString('en-IN')}</TableCell>
                    <TableCell align="right" sx={{ color: '#64748b' }}>{item.taxRate}%</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#0f172a' }}>
                      ₹{item.totalAmount?.toLocaleString('en-IN')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* 4. REMITTANCE, AMOUNT IN WORDS & FINANCIAL TOTALS */}
            <Grid container spacing={3} sx={{ mb: 3.5 }}>
              <Grid item xs={12} sm={6.5}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', letterSpacing: '0.06em', fontSize: '0.68rem', display: 'block' }}>
                    AMOUNT IN WORDS
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a', fontSize: '0.8rem', mt: 0.3 }}>
                    {numberToIndianWords(invoice.grandTotal)}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    p: 1.8,
                    borderRadius: '6px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0'
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', letterSpacing: '0.06em', fontSize: '0.68rem', display: 'block', mb: 0.6 }}>
                    BANK REMITTANCE DETAILS
                  </Typography>
                  <Grid container spacing={0.5}>
                    <Grid item xs={6}>
                      <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                        Bank: <strong style={{ color: '#0f172a' }}>HDFC Bank</strong>
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                        Branch: <strong style={{ color: '#0f172a' }}>Fort, Mumbai</strong>
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                        A/c No: <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>50200012345678</strong>
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                        IFSC: <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>HDFC0000060</strong>
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>

                {invoice.notes && (
                  <Box sx={{ mt: 1.5 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', fontSize: '0.68rem', display: 'block' }}>
                      NOTES
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#475569', fontSize: '0.76rem' }}>
                      {invoice.notes}
                    </Typography>
                  </Box>
                )}
              </Grid>

              <Grid item xs={12} sm={5.5}>
                <Box sx={{ pl: { sm: 2 }, fontVariantNumeric: 'tabular-nums' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.55 }}>
                    <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.82rem' }}>Subtotal</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a', fontSize: '0.82rem' }}>
                      ₹{(invoice.subtotal || 0).toLocaleString('en-IN')}
                    </Typography>
                  </Box>
                  {invoice.totalDiscount > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.55 }}>
                      <Typography variant="body2" sx={{ color: '#dc2626', fontSize: '0.82rem' }}>Discount</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#dc2626', fontSize: '0.82rem' }}>
                        -₹{invoice.totalDiscount?.toLocaleString('en-IN')}
                      </Typography>
                    </Box>
                  )}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.55 }}>
                    <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.82rem' }}>Taxable Value</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a', fontSize: '0.82rem' }}>
                      ₹{(invoice.taxableTotal || 0).toLocaleString('en-IN')}
                    </Typography>
                  </Box>
                  {invoice.cgstTotal > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.55 }}>
                      <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.82rem' }}>CGST</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a', fontSize: '0.82rem' }}>
                        ₹{invoice.cgstTotal?.toLocaleString('en-IN')}
                      </Typography>
                    </Box>
                  )}
                  {invoice.sgstTotal > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.55 }}>
                      <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.82rem' }}>SGST</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a', fontSize: '0.82rem' }}>
                        ₹{invoice.sgstTotal?.toLocaleString('en-IN')}
                      </Typography>
                    </Box>
                  )}
                  {invoice.igstTotal > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.55 }}>
                      <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.82rem' }}>IGST</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a', fontSize: '0.82rem' }}>
                        ₹{invoice.igstTotal?.toLocaleString('en-IN')}
                      </Typography>
                    </Box>
                  )}

                  <Divider sx={{ my: 1.2, borderColor: '#0f172a', borderBottomWidth: 1.5 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', py: 0.4 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>
                      Grand Total
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '1.15rem' }}>
                      ₹{(invoice.grandTotal || 0).toLocaleString('en-IN')}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.4 }}>
                    <Typography variant="body2" sx={{ color: '#059669', fontWeight: 600, fontSize: '0.8rem' }}>
                      Amount Paid
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#059669', fontWeight: 700, fontSize: '0.8rem' }}>
                      ₹{(invoice.paidAmount || 0).toLocaleString('en-IN')}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      mt: 0.8,
                      pt: 0.8,
                      borderTop: '1px dashed #cbd5e1'
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 700,
                        color: balanceDue > 0 ? '#b91c1c' : '#047857',
                        fontSize: '0.84rem'
                      }}
                    >
                      Balance Outstanding
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 800,
                        color: balanceDue > 0 ? '#b91c1c' : '#047857',
                        fontSize: '0.88rem'
                      }}
                    >
                      ₹{balanceDue.toLocaleString('en-IN')}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>

            {/* 5. CLEAN FOOTER & SIGNATORY */}
            <Box
              sx={{
                pt: 2.5,
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                flexWrap: 'wrap',
                gap: 2
              }}
            >
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.8rem' }}>
                  Thank you for your business.
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.72rem' }}>
                  This is a computer-generated Tax Invoice and is valid without a physical signature.
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right', minWidth: 190 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: '#64748b', fontSize: '0.72rem', display: 'block', mb: 3.5 }}>
                  For {company?.legalName || company?.name || 'Quantro Finance'}
                </Typography>
                <Box sx={{ borderTop: '1px solid #94a3b8', pt: 0.5 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#0f172a', fontSize: '0.74rem' }}>
                    Authorized Signatory
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
