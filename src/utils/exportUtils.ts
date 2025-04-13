
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
  // Add event name to each record
  const attendeesWithEvent = attendees.map(attendee => ({
    event: eventTitle,
    name: attendee.name,
    email: attendee.email,
    timestamp: attendee.timestamp,
    status: attendee.status
  }));
  
  // Create a worksheet for the attendees data
  const ws = XLSX.utils.json_to_sheet(attendeesWithEvent);
  
  // Set column widths
  const wscols = [
    { wch: 30 }, // Event
    { wch: 30 }, // Name
    { wch: 40 }, // Email
    { wch: 25 }, // Timestamp
    { wch: 15 }, // Status
  ];
  ws['!cols'] = wscols;
  
  // Create a workbook
  const wb = XLSX.utils.book_new();
  
  // Add event title information as an additional sheet
  const titleData = [
    { A: 'Event Name', B: eventTitle },
    { A: 'Export Date', B: new Date().toLocaleString() },
    { A: 'Total Records', B: attendees.length }
  ];
  const titleSheet = XLSX.utils.json_to_sheet(titleData, { header: ['A', 'B'] });
  
  // Set column widths for the title sheet
  const titlewscols = [
    { wch: 20 }, // Label column
    { wch: 50 }, // Value column
  ];
  titleSheet['!cols'] = titlewscols;
  
  // Add the sheets to the workbook
  XLSX.utils.book_append_sheet(wb, titleSheet, 'Event Info');
  XLSX.utils.book_append_sheet(wb, ws, 'Users');
  
  // Generate Excel file name
  const safeEventTitle = eventTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const dateStr = new Date().toISOString().split('T')[0];
  const actualFilename = filename || `${safeEventTitle}_users_${dateStr}.xlsx`;
  
  // Write to file and trigger download
  XLSX.writeFile(wb, actualFilename);
};
