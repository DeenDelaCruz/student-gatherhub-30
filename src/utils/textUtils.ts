
import React from 'react';

export const convertUrlsToLinks = (text: string): React.ReactNode[] => {
  // Regex to match URLs (supports http, https, www)
  const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/g;
  
  if (!text) return [React.createElement('span', { key: 'empty' })];

  const parts = text.split(urlRegex);
  const matches = text.match(urlRegex) || [];
  
  const result: React.ReactNode[] = [];
  let matchIndex = 0;
  
  parts.forEach((part, index) => {
    if (part) {
      result.push(React.createElement('span', { key: `text-${index}` }, part));
    }
    
    if (matchIndex < matches.length) {
      const url = matches[matchIndex];
      const href = url.startsWith('www.') ? `https://${url}` : url;
      
      result.push(
        React.createElement('a', {
          key: `link-${matchIndex}`,
          href: href,
          target: "_blank",
          rel: "noopener noreferrer",
          className: "text-blue-600 hover:underline"
        }, url)
      );
      
      matchIndex++;
    }
  });
  
  return result;
};
