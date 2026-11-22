import React from 'react';
import { Box, Button, ButtonGroup } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TableViewIcon from '@mui/icons-material/TableView';

export default function ReportActionsToolbar({ onPrint, onExportPdf, onExportExcel }) {
  return (
    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
      {onPrint && (
        <Button
          variant="outlined"
          size="small"
          startIcon={<PrintIcon />}
          onClick={onPrint}
          sx={{
            borderColor: '#cbd5e1',
            color: '#334155',
            fontWeight: 600,
            textTransform: 'none',
            borderRadius: '4px',
            '&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc' }
          }}
        >
          Print
        </Button>
      )}

      {onExportPdf && (
        <Button
          variant="outlined"
          size="small"
          startIcon={<PictureAsPdfIcon sx={{ color: '#ef4444' }} />}
          onClick={onExportPdf}
          sx={{
            borderColor: '#cbd5e1',
            color: '#334155',
            fontWeight: 600,
            textTransform: 'none',
            borderRadius: '4px',
            '&:hover': { borderColor: '#ef4444', bgcolor: '#fef2f2' }
          }}
        >
          PDF Export
        </Button>
      )}

      {onExportExcel && (
        <Button
          variant="contained"
          size="small"
          startIcon={<TableViewIcon />}
          onClick={onExportExcel}
          sx={{
            bgcolor: '#059669',
            color: '#ffffff',
            fontWeight: 600,
            textTransform: 'none',
            borderRadius: '4px',
            boxShadow: 'none',
            '&:hover': { bgcolor: '#047857' }
          }}
        >
          Excel Export
        </Button>
      )}
    </Box>
  );
}
