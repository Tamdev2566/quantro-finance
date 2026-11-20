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
  Chip
} from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import CloseIcon from '@mui/icons-material/Close';

export default function PrintableInvoiceModal({ open, invoice, onClose }) {
  const company = useSelector((state) => state.finance.company);
  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogActions sx={{ p: 2, borderBottom: '1px solid #e2e8f0', justifyContent: 'space-between' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Tax Invoice Preview – {invoice.invoiceNumber}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="contained" startIcon={<PrintIcon />} onClick={handlePrint}>
            Print / Save PDF
          </Button>
          <Button variant="outlined" color="inherit" onClick={onClose} startIcon={<CloseIcon />}>
            Close
          </Button>
        </Box>
      </DialogActions>

      <DialogContent sx={{ p: 4 }}>
        <Box id="printable-invoice" sx={{ backgroundColor: 'white', color: '#0f172a' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#2563eb' }}>
                {company?.legalName || company?.name || 'Quantro Finance'}
              </Typography>
              <Typography variant="body2" sx={{ color: '#475569' }}>
                {company?.address || 'Registered Office Address'}
              </Typography>
              <Typography variant="body2" sx={{ color: '#475569' }}>
                GSTIN: <strong>{company?.gstin || 'Not Configured'}</strong> | State: {company?.state || 'Local'} ({company?.stateCode || '27'})
              </Typography>
              {company?.email && (
                <Typography variant="body2" sx={{ color: '#475569' }}>
                  Email: {company.email}
                </Typography>
              )}
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '0.05em' }}>
                TAX INVOICE
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#2563eb' }}>
                {invoice.invoiceNumber}
              </Typography>
              <Typography variant="body2">Date: {invoice.invoiceDate}</Typography>
              <Typography variant="body2">Due Date: {invoice.dueDate}</Typography>
              <Chip
                label={invoice.status}
                size="small"
                color={invoice.status === 'Paid' ? 'success' : invoice.status === 'Posted' ? 'primary' : 'default'}
                sx={{ mt: 1, fontWeight: 600 }}
              />
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
                BILL TO:
              </Typography>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {invoice.customerName}
              </Typography>
              <Typography variant="body2" sx={{ color: '#475569' }}>
                {invoice.customerAddress || 'Address on file'}
              </Typography>
              <Typography variant="body2" sx={{ color: '#475569' }}>
                GSTIN: {invoice.customerGstin || 'Unregistered'}
              </Typography>
              <Typography variant="body2" sx={{ color: '#475569' }}>
                Place of Supply: State Code {invoice.partyStateCode} ({invoice.taxType === 'INTER' ? 'Inter-State' : 'Intra-State'})
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b' }}>
                PAYMENT TERMS:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {invoice.paymentTerms || 'Net 30 Days'}
              </Typography>
              <Typography variant="body2">Currency: {invoice.currency || 'INR'}</Typography>
            </Box>
          </Box>

          <Table size="small" sx={{ mb: 3, border: '1px solid #e2e8f0' }}>
            <TableHead sx={{ backgroundColor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Description</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Qty</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Unit Price</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Taxable</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>GST Rate</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Total (₹)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(invoice.items || []).map((item, idx) => (
                <TableRow key={idx}>
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>{item.description}</TableCell>
                  <TableCell align="right">{item.quantity}</TableCell>
                  <TableCell align="right">₹{item.unitPrice?.toLocaleString('en-IN')}</TableCell>
                  <TableCell align="right">₹{item.taxableAmount?.toLocaleString('en-IN')}</TableCell>
                  <TableCell align="right">{item.taxRate}%</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    ₹{item.totalAmount?.toLocaleString('en-IN')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
            <Box sx={{ width: 340 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                <Typography variant="body2">Subtotal:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>₹{invoice.subtotal?.toLocaleString('en-IN')}</Typography>
              </Box>
              {invoice.totalDiscount > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, color: '#dc2626' }}>
                  <Typography variant="body2">Discount:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>-₹{invoice.totalDiscount?.toLocaleString('en-IN')}</Typography>
                </Box>
              )}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                <Typography variant="body2">Taxable Value:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>₹{invoice.taxableTotal?.toLocaleString('en-IN')}</Typography>
              </Box>
              {invoice.cgstTotal > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                  <Typography variant="body2">Central GST (CGST):</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>₹{invoice.cgstTotal?.toLocaleString('en-IN')}</Typography>
                </Box>
              )}
              {invoice.sgstTotal > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                  <Typography variant="body2">State GST (SGST):</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>₹{invoice.sgstTotal?.toLocaleString('en-IN')}</Typography>
                </Box>
              )}
              {invoice.igstTotal > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                  <Typography variant="body2">Integrated GST (IGST):</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>₹{invoice.igstTotal?.toLocaleString('en-IN')}</Typography>
                </Box>
              )}
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Grand Total:</Typography>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#2563eb' }}>
                  ₹{invoice.grandTotal?.toLocaleString('en-IN')}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, color: '#059669' }}>
                <Typography variant="body2">Paid Amount:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>₹{invoice.paidAmount?.toLocaleString('en-IN')}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, color: '#dc2626' }}>
                <Typography variant="body2">Balance Outstanding:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>₹{invoice.outstandingAmount?.toLocaleString('en-IN')}</Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={{ borderTop: '1px solid #e2e8f0', pt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <Box>
              <Typography variant="caption" sx={{ fontWeight: 700 }}>Bank Account Details for Payment:</Typography>
              <Typography variant="caption" display="block">Bank: HDFC Bank | A/c No: 50200012345678</Typography>
              <Typography variant="caption" display="block">IFSC Code: HDFC0000060 | Branch: Fort, Mumbai</Typography>
            </Box>
            <Box sx={{ textAlign: 'center', width: 200 }}>
              <Box sx={{ height: 40 }} />
              <Divider />
              <Typography variant="caption" sx={{ fontWeight: 600 }}>Authorized Signatory</Typography>
            </Box>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
