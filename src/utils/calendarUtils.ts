
/**
 * Generate a Google Calendar event URL
 * @param title Event title
 * @param description Event description
 * @param location Event location
 * @param startDate Start date and time
 * @param endDate End date and time (optional, defaults to 1 hour after start)
 * @returns URL string for adding to Google Calendar
 */
export const createGoogleCalendarLink = (
  title: string,
  description: string,
  location: string,
  startDate: Date,
  endDate?: Date
): string => {
  // Default end time to 1 hour after start if not provided
  const calculatedEndDate = endDate || new Date(startDate.getTime() + 60 * 60 * 1000);
  
  // Format dates for Google Calendar URL (YYYYMMDDTHHMMSS format)
  const formatDateForGCal = (date: Date): string => {
    return date.toISOString().replace(/-|:|\.\d+/g, '');
  };
  
  // Clean and encode parameters for URL
  const encodeParameter = (param: string): string => {
    return encodeURIComponent(param).replace(/%20/g, '+');
  };
  
  const params = new URLSearchParams();
  params.append('action', 'TEMPLATE');
  params.append('text', title);
  params.append('dates', `${formatDateForGCal(startDate)}/${formatDateForGCal(calculatedEndDate)}`);
  
  if (description) {
    params.append('details', description);
  }
  
  if (location) {
    params.append('location', location);
  }
  
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};
