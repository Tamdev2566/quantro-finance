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
  Chip,
  Grid
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import CloseIcon from '@mui/icons-material/Close';

const getStatusStyle = (status) => {
  switch (status) {
    case 'Paid':
      return { bg: '#10b981', color: '#ffffff' };
    case 'Partially Paid':
      return { bg: '#f59e0b', color: '#0f172a' };
    case 'Posted':
      return { bg: '#3b82f6', color: '#ffffff' };
    case 'Approved':
      return { bg: '#8b5cf6', color: '#ffffff' };
    case 'Cancelled':
      return { bg: '#ef4444', color: '#ffffff' };
    default:
      return { bg: '#64748b', color: '#ffffff' };
  }
};

export default function PrintableInvoiceModal({ open, invoice, onClose }) {
  const company = useSelector((state) => state.finance.company);
  if (!invoice) return null;

  const statusStyle = getStatusStyle(invoice.status);

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
          borderRadius: '12px',
          overflow: 'hidden'
        }
      }}
    >
      {/* Dialog Toolbar (Hidden in Print) */}
      <DialogActions
        className="no-print"
        sx={{
          px: 3,
          py: 1.8,
          backgroundColor: '#0f172a',
          borderBottom: '1px solid #1e293b',
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: '#e5a93c',
              boxShadow: '0 0 8px #e5a93c'
            }}
          />
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#ffffff', fontSize: '0.95rem' }}>
            Tax Invoice Preview — {invoice.invoiceNumber}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.2 }}>
          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
            sx={{
              bgcolor: '#e5a93c',
              color: '#0f172a',
              fontWeight: 800,
              textTransform: 'none',
              borderRadius: '6px',
              px: 2.5,
              boxShadow: 'none',
              '&:hover': { bgcolor: '#d4982e', boxShadow: 'none' }
            }}
          >
            Print / Save PDF
          </Button>
          <Button
            variant="outlined"
            onClick={onClose}
            startIcon={<CloseIcon />}
            sx={{
              color: '#cbd5e1',
              borderColor: '#334155',
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

      <DialogContent sx={{ p: { xs: 2, sm: 3.5 }, backgroundColor: '#f1f5f9' }}>
        <Box
          id="printable-invoice"
          sx={{
            backgroundColor: '#ffffff',
            color: '#0f172a',
            borderRadius: '10px',
            overflow: 'hidden',
            boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
            border: '1px solid #e2e8f0'
          }}
        >
          {/* 1. PREMIUM DARK & GOLD EXECUTIVE BANNER */}
          <Box
            sx={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #1e1b4b 100%)',
              color: '#ffffff',
              p: { xs: 2.5, sm: 3.5 },
              borderBottom: '4px solid #e5a93c',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: 2
            }}
          >
            <Box sx={{ maxWidth: '60%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.2 }}>
                <Box
                  sx={{
                    width: 38,
                    height: 38,
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #f3c64f 0%, #d49b28 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(229, 169, 60, 0.35)',
                    flexShrink: 0
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M4 6C4 4.89543 4.89543 4 6 4H8C9.10457 4 10 4.89543 10 6V18C10 19.1046 9.10457 20 8 20H6C4.89543 20 4 19.1046 4 18V6Z" fill="#0f172a" />
                    <path d="M11 9C11 7.89543 11.8954 7 13 7H15C16.1046 7 17 7.89543 17 9V18C17 19.1046 16.1046 20 15 20H13C11.8954 20 11 19.1046 11 18V9Z" fill="#0f172a" fillOpacity="0.8" />
                    <path d="M18 12C18 10.8954 18.8954 10 20 10H22V18C22 19.1046 21.1046 20 20 20H18V12Z" fill="#0f172a" fillOpacity="0.6" />
                  </svg>
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                  {company?.legalName || company?.name || 'Quantro Finance'}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: '#cbd5e1', fontSize: '0.82rem', mb: 0.4 }}>
                {company?.address || 'Registered Office Address'}
              </Typography>
              <Typography variant="body2" sx={{ color: '#cbd5e1', fontSize: '0.82rem', mb: 0.4 }}>
                GSTIN: <strong style={{ color: '#f3c64f' }}>{company?.gstin || 'Not Configured'}</strong> &nbsp;|&nbsp; State: {company?.state || 'Local'} ({company?.stateCode || '27'})
              </Typography>
              {company?.email && (
                <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                  Email: {company.email}
                </Typography>
              )}
            </Box>

            <Box sx={{ textAlign: 'right' }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 900,
                  letterSpacing: '0.1em',
                  color: '#f3c64f',
                  fontSize: '1.35rem',
                  mb: 0.5
                }}
              >
                TAX INVOICE
              </Typography>
              <Box
                sx={{
                  display: 'inline-block',
                  px: 1.5,
                  py: 0.4,
                  borderRadius: '6px',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  mb: 1
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#ffffff', letterSpacing: '0.03em' }}>
                  {invoice.invoiceNumber}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: '#cbd5e1', fontSize: '0.82rem' }}>
                Date: <strong style={{ color: '#ffffff' }}>{invoice.invoiceDate}</strong>
              </Typography>
              <Typography variant="body2" sx={{ color: '#cbd5e1', fontSize: '0.82rem', mb: 1 }}>
                Due Date: <strong style={{ color: '#ffffff' }}>{invoice.dueDate}</strong>
              </Typography>
              <Chip
                label={invoice.status}
                size="small"
                sx={{
                  backgroundColor: statusStyle.bg,
                  color: statusStyle.color,
                  fontWeight: 800,
                  fontSize: '0.72rem',
                  px: 0.8,
                  borderRadius: '6px'
                }}
              />
            </Box>
          </Box>

          {/* INVOICE BODY */}
          <Box sx={{ p: { xs: 2.5, sm: 3.5 } }}>
            {/* 2. COLORFUL BILL TO & PAYMENT TERMS CARDS */}
            <Grid container spacing={2.5} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={7}>
                <Box
                  sx={{
                    p: 2,
                    height: '100%',
                    borderRadius: '8px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderLeft: '4px solid #3b82f6'
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#2563eb', letterSpacing: '0.06em', display: 'block', mb: 0.6 }}>
                    BILLED TO
                  </Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', mb: 0.3 }}>
                    {invoice.customerName}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.83rem', mb: 0.5 }}>
                    {invoice.customerAddress || 'Address on file'}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                    <Chip
                      size="small"
                      label={`GSTIN: ${invoice.customerGstin || 'Unregistered'}`}
                      sx={{
                        bgcolor: '#eff6ff',
                        color: '#1d4ed8',
                        fontWeight: 700,
                        fontSize: '0.72rem',
                        borderRadius: '4px',
                        border: '1px solid #bfdbfe'
                      }}
                    />
                    <Chip
                      size="small"
                      label={`Place of Supply: ${invoice.partyStateCode} (${invoice.taxType === 'INTER' ? 'Inter-State' : 'Intra-State'})`}
                      sx={{
                        bgcolor: '#f1f5f9',
                        color: '#334155',
                        fontWeight: 600,
                        fontSize: '0.72rem',
                        borderRadius: '4px'
                      }}
                    />
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} sm={5}>
                <Box
                  sx={{
                    p: 2,
                    height: '100%',
                    borderRadius: '8px',
                    backgroundColor: '#fffbeb',
                    border: '1px solid #fde68a',
                    borderLeft: '4px solid #e5a93c',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#b45309', letterSpacing: '0.06em', display: 'block', mb: 0.6 }}>
                      PAYMENT & BILLING DETAILS
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#78350f', fontSize: '0.82rem' }}>Payment Terms:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>{invoice.paymentTerms || 'Net 30 Days'}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#78350f', fontSize: '0.82rem' }}>Currency:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#0f172a' }}>{invoice.currency || 'INR (₹)'}</Typography>
                    </Box>
                  </Box>

                  <Box sx={{ pt: 1, mt: 1, borderTop: '1px dashed #fcd34d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#92400e' }}>BALANCE DUE:</Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 900, color: (invoice.outstandingAmount || 0) > 0 ? '#dc2626' : '#059669' }}>
                      ₹{(invoice.outstandingAmount || 0).toLocaleString('en-IN')}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>

            {/* 3. LINE ITEMS TABLE */}
            <Table
              size="small"
              sx={{
                mb: 3,
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                overflow: 'hidden',
                borderCollapse: 'separate',
                borderSpacing: 0
              }}
            >
              <TableHead>
                <TableRow
                  sx={{
                    backgroundColor: '#0f172a',
                    '& th': {
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '0.78rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      py: 1.3,
                      borderBottom: '2px solid #e5a93c'
                    }
                  }}
                >
                  <TableCell width="5%">#</TableCell>
                  <TableCell width="37%">Description</TableCell>
                  <TableCell align="right" width="8%">Qty</TableCell>
                  <TableCell align="right" width="14%">Unit Price</TableCell>
                  <TableCell align="right" width="14%">Taxable</TableCell>
                  <TableCell align="right" width="9%">GST</TableCell>
                  <TableCell align="right" width="13%">Total (₹)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(invoice.items || []).map((item, idx) => (
                  <TableRow
                    key={idx}
                    sx={{
                      backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                      '& td': { py: 1.3, borderBottom: '1px solid #f1f5f9', fontSize: '0.84rem' }
                    }}
                  >
                    <TableCell sx={{ color: '#64748b', fontWeight: 600 }}>{idx + 1}</TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#0f172a' }}>{item.description}</TableCell>
                    <TableCell align="right" sx={{ color: '#334155' }}>{item.quantity}</TableCell>
                    <TableCell align="right" sx={{ color: '#334155' }}>₹{item.unitPrice?.toLocaleString('en-IN')}</TableCell>
                    <TableCell align="right" sx={{ color: '#334155' }}>₹{item.taxableAmount?.toLocaleString('en-IN')}</TableCell>
                    <TableCell align="right">
                      <Chip
                        size="small"
                        label={`${item.taxRate}%`}
                        sx={{
                          height: 20,
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          bgcolor: '#eff6ff',
                          color: '#2563eb',
                          borderRadius: '4px'
                        }}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: '#0f172a' }}>
                      ₹{item.totalAmount?.toLocaleString('en-IN')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* 4. BANK DETAILS & FINANCIAL SUMMARY */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: '8px',
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderTop: '3px solid #10b981'
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#047857', letterSpacing: '0.05em', display: 'block', mb: 0.8 }}>
                    BANK ACCOUNT DETAILS FOR REMITTANCE
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#065f46', mb: 0.3 }}>
                    <strong>Bank:</strong> HDFC Bank &nbsp;|&nbsp; <strong>Branch:</strong> Fort, Mumbai
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#065f46', mb: 0.3 }}>
                    <strong>Account No:</strong> 50200012345678
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#065f46' }}>
                    <strong>IFSC Code:</strong> HDFC0000060
                  </Typography>
                </Box>

                {invoice.notes && (
                  <Box sx={{ mt: 2, p: 1.5, borderRadius: '6px', bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', display: 'block' }}>
                      NOTES:
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.8rem', color: '#475569' }}>
                      {invoice.notes}
                    </Typography>
                  </Box>
                )}
              </Grid>

              <Grid item xs={12} sm={6}>
                <Box sx={{ p: 2, borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>Subtotal:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a' }}>₹{invoice.subtotal?.toLocaleString('en-IN')}</Typography>
                  </Box>
                  {invoice.totalDiscount > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, color: '#dc2626' }}>
                      <Typography variant="body2">Discount:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>-₹{invoice.totalDiscount?.toLocaleString('en-IN')}</Typography>
                    </Box>
                  )}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>Taxable Value:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a' }}>₹{invoice.taxableTotal?.toLocaleString('en-IN')}</Typography>
                  </Box>
                  {invoice.cgstTotal > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#64748b' }}>Central GST (CGST):</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a' }}>₹{invoice.cgstTotal?.toLocaleString('en-IN')}</Typography>
                    </Box>
                  )}
                  {invoice.sgstTotal > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#64748b' }}>State GST (SGST):</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a' }}>₹{invoice.sgstTotal?.toLocaleString('en-IN')}</Typography>
                    </Box>
                  )}
                  {invoice.igstTotal > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                      <Typography variant="body2" sx={{ color: '#64748b' }}>Integrated GST (IGST):</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a' }}>₹{invoice.igstTotal?.toLocaleString('en-IN')}</Typography>
                    </Box>
                  )}

                  {/* Grand Total Dark Highlight Bar */}
                  <Box
                    sx={{
                      mt: 1.5,
                      mb: 1.2,
                      px: 2,
                      py: 1.2,
                      borderRadius: '6px',
                      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#ffffff' }}>Grand Total</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 900, color: '#f3c64f' }}>
                      ₹{invoice.grandTotal?.toLocaleString('en-IN')}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.4, color: '#059669' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Paid Amount:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>₹{(invoice.paidAmount || 0).toLocaleString('en-IN')}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.4, color: (invoice.outstandingAmount || 0) > 0 ? '#dc2626' : '#059669' }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>Balance Outstanding:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>₹{(invoice.outstandingAmount || 0).toLocaleString('en-IN')}</Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>

            {/* 5. FOOTER & SIGNATORY */}
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b' }}>
                  Thank you for your business!
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  This is a computer-generated Tax Invoice and is valid without a physical signature.
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center', width: 210 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', display: 'block', mb: 3 }}>
                  For {company?.legalName || company?.name || 'Quantro Finance'}
                </Typography>
                <Divider sx={{ borderColor: '#94a3b8' }} />
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#0f172a', mt: 0.5, display: 'block' }}>
                  Authorized Signatory
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
