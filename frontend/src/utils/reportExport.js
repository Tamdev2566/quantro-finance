import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Export table data to Excel (.xlsx)
 * @param {string} fileName - Name of exported file (without extension)
 * @param {Array<object>|Array<Array<any>>} data - Rows to export
 * @param {string} sheetName - Optional sheet name
 */
export function exportToExcel(fileName, data, sheetName = 'Report') {
  try {
    let worksheet;
    if (Array.isArray(data) && Array.isArray(data[0])) {
      worksheet = XLSX.utils.aoa_to_sheet(data);
    } else {
      worksheet = XLSX.utils.json_to_sheet(data);
    }

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  } catch (err) {
    console.error('Excel export error:', err);
    alert('Failed to export Excel file: ' + err.message);
  }
}

/**
 * Export report to a clean, professional PDF
 * @param {object} options
 * @param {string} options.title - Report Title (e.g. Statement of Profit & Loss)
 * @param {string} options.subtitle - Subtitle or Fiscal Period
 * @param {object} options.company - Company information
 * @param {Array<string>} options.headers - Table column headers
 * @param {Array<Array<any>>} options.rows - Table rows data
 * @param {string} options.fileName - Output PDF filename
 */
export function exportToPdf({
  title,
  subtitle = 'Financial Period 2026-2027',
  company = null,
  headers = [],
  rows = [],
  fileName = 'Financial_Report',
  columnStyles = {}
}) {
  try {
    const doc = new jsPDF('p', 'pt', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();

    // 1. Company Header
    const companyName = company?.legalName || company?.name || 'Apex Global Enterprises Private Limited';
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(companyName, pageWidth / 2, 40, { align: 'center' });

    if (company?.gstin) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`GSTIN: ${company.gstin} | State Code: ${company.stateCode || '27'}`, pageWidth / 2, 54, { align: 'center' });
    }

    // 2. Report Title & Subtitle
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(30, 41, 59);
    doc.text(title.toUpperCase(), pageWidth / 2, 75, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(subtitle, pageWidth / 2, 90, { align: 'center' });

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(1);
    doc.line(40, 102, pageWidth - 40, 102);

    // 3. Render Table
    autoTable(doc, {
      startY: 112,
      head: [headers],
      body: rows,
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 9,
        cellPadding: 6,
        textColor: [30, 41, 59],
        lineColor: [226, 232, 240],
        lineWidth: 0.5
      },
      headStyles: {
        fillColor: [15, 23, 42], // #0f172a
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9.5
      },
      columnStyles: columnStyles,
      alternateRowStyles: {
        fillColor: [248, 250, 252] // #f8fafc
      },
      margin: { left: 40, right: 40, bottom: 40 },
      didDrawPage: (data) => {
        // Footer: Page Number and timestamp
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184);
        const str = `Page ${data.pageNumber} of ${pageCount}`;
        doc.text(str, pageWidth - 40, doc.internal.pageSize.getHeight() - 20, { align: 'right' });
        doc.text(`Generated on ${new Date().toLocaleString('en-IN')}`, 40, doc.internal.pageSize.getHeight() - 20);
      }
    });

    doc.save(`${fileName}_${new Date().toISOString().slice(0, 10)}.pdf`);
  } catch (err) {
    console.error('PDF export error:', err);
    alert('Failed to generate PDF: ' + err.message);
  }
}
