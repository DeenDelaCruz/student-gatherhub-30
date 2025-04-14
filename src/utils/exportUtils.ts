
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
  // Create a workbook
  const wb = XLSX.utils.book_new();
  
  // Add event title information as a summary sheet
  const titleData = [
    { A: 'Event Name', B: eventTitle },
    { A: 'Export Date', B: new Date().toLocaleString() },
    { A: 'Total Attendees', B: attendees.filter(a => a.status === "Attended").length },
    { A: 'Total Interested', B: attendees.filter(a => a.status === "Interested").length }
  ];
  const titleSheet = XLSX.utils.json_to_sheet(titleData, { header: ['A', 'B'] });
  
  // Set column widths for the title sheet
  const titlewscols = [
    { wch: 20 }, // Label column
    { wch: 50 }, // Value column
  ];
  titleSheet['!cols'] = titlewscols;
  
  // Add the event info sheet to the workbook
  XLSX.utils.book_append_sheet(wb, titleSheet, 'Event Info');
  
  // Filter for attendees only and prepare data
  const attendeesOnly = attendees
    .filter(a => a.status === "Attended")
    .map(attendee => ({
      event: eventTitle,
      name: attendee.name,
      email: attendee.email,
      check_in_time: attendee.timestamp
    }));
  
  // Create attendees worksheet
  const attendeesSheet = XLSX.utils.json_to_sheet(attendeesOnly);
  
  // Set column widths for attendees
  const attendeesCols = [
    { wch: 30 }, // Event
    { wch: 30 }, // Name
    { wch: 40 }, // Email
    { wch: 25 }, // Check-in Time
  ];
  attendeesSheet['!cols'] = attendeesCols;
  
  // Add the attendees sheet
  XLSX.utils.book_append_sheet(wb, attendeesSheet, 'Attendees');
  
  // Filter for interested users only
  const interestedOnly = attendees
    .filter(a => a.status === "Interested")
    .map(user => ({
      event: eventTitle,
      name: user.name,
      email: user.email
    }));
  
  // Create interested users worksheet
  const interestedSheet = XLSX.utils.json_to_sheet(interestedOnly);
  
  // Set column widths for interested users
  const interestedCols = [
    { wch: 30 }, // Event
    { wch: 30 }, // Name
    { wch: 40 }, // Email
  ];
  interestedSheet['!cols'] = interestedCols;
  
  // Add the interested users sheet
  XLSX.utils.book_append_sheet(wb, interestedSheet, 'Interested Users');
  
  // Generate Excel file name
  const safeEventTitle = eventTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const dateStr = new Date().toISOString().split('T')[0];
  const actualFilename = filename || `${safeEventTitle}_users_${dateStr}.xlsx`;
  
  // Write to file and trigger download
  XLSX.writeFile(wb, actualFilename);
};
