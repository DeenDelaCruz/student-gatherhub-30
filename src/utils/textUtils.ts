import React from 'react';

export const convertUrlsToLinks = (text: string): React.ReactNode[] => {
  // Return empty array if no text is provided
  if (!text) return [React.createElement('span', { key: 'empty' }, '')];

  // Regex to match URLs (supports http, https, www)
  const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/g;
  
  // If no URLs, return text as a single span
  if (!text.match(urlRegex)) {
    return [React.createElement('span', { key: 'text-only' }, text)];
  }
  
  // Split text by URLs and create an array of text and link elements
  let result: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  let segmentIndex = 0;
  
  // Use exec to iterate through matches while keeping track of indices
  while ((match = urlRegex.exec(text)) !== null) {
    // Add text segment before the URL if there is any
    if (match.index > lastIndex) {
      const textBefore = text.substring(lastIndex, match.index);
      result.push(React.createElement('span', { key: `text-${segmentIndex}` }, textBefore));
      segmentIndex++;
    }
    
    // Add the URL as a link
    const url = match[0];
    const href = url.startsWith('www.') ? `https://${url}` : url;
    
    result.push(
      React.createElement('a', {
        key: `link-${segmentIndex}`,
        href: href,
        target: "_blank",
        rel: "noopener noreferrer",
        className: "text-blue-600 hover:underline"
      }, url)
    );
    
    segmentIndex++;
    lastIndex = match.index + url.length;
  }
  
  // Add any remaining text after the last URL
  if (lastIndex < text.length) {
    result.push(React.createElement('span', { key: `text-${segmentIndex}` }, text.substring(lastIndex)));
  }
  
  return result;
};
