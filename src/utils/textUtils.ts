
import React from 'react';

export const convertUrlsToLinks = (text: string): React.ReactNode[] => {
  // Regex to match URLs (supports http, https, www)
  const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/g;
  
  if (!text) return [<span key="empty"></span>];

  const parts = text.split(urlRegex);
  const matches = text.match(urlRegex) || [];
  
  const result: React.ReactNode[] = [];
  let matchIndex = 0;
  
  parts.forEach((part, index) => {
    if (part) {
      result.push(<span key={`text-${index}`}>{part}</span>);
    }
    if (matchIndex < matches.length) {
      const url = matches[matchIndex];
      const href = url.startsWith('www.') ? `https://${url}` : url;
      result.push(
        <a
          key={`link-${matchIndex}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          {url}
        </a>
      );
      matchIndex++;
    }
  });
  
  return result;
};
