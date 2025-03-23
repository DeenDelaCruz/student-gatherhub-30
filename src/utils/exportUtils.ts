
import * as XLSX from 'xlsx';

interface ExportableUser {
  name: string | null;
  email: string | null;
  timestamp: string | null;
  status: string;
}

export const exportUsersToExcel = (
  eventTitle: string,
  attendees: ExportableUser[],
  filename?: string
): void => {
  // Create a worksheet
  const ws = XLSX.utils.json_to_sheet(attendees);
  
  // Set column widths
  const wscols = [
    { wch: 30 }, // Name
    { wch: 40 }, // Email
    { wch: 25 }, // Timestamp
    { wch: 15 }, // Status
  ];
  ws['!cols'] = wscols;
  
  // Create a workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Users');
  
  // Generate Excel file name
  const safeEventTitle = eventTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const dateStr = new Date().toISOString().split('T')[0];
  const actualFilename = filename || `${safeEventTitle}_users_${dateStr}.xlsx`;
  
  // Write to file and trigger download
  XLSX.writeFile(wb, actualFilename);
};
