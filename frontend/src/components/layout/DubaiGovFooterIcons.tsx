
import React, { useState } from 'react';
import './DubaiGovFooterIcons.css';

export function DubaiGovFooterIcons() {
  const [showTooltips, setShowTooltips] = useState(true);

  return (
    <div className="dubai-gov-footer-icons">
      {/* Dubai AI Icon */}
      <a 
        href="https://www.dubaidigital.ae/en/dubaiAI.html" 
        target="_blank" 
        rel="noopener noreferrer"
        className="dubai-gov-footer-icon"
        aria-label="Dubai AI - Opens in a new window"
      >
        <img 
          src="/images/dubai-ai-icon.svg" 
          alt="Dubai AI" 
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMwMDc5QzEiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMTIgMmE0IDQgMCAwIDAgLTQgNHY0YTQgNCAwIDAgMCA4IDBWNmE0IDQgMCAwIDAgLTQgLTR6Ij48L3BhdGg+PHBhdGggZD0iTTQgMTJhOCA4IDAgMCAxIDggLThhOCA4IDAgMCAxIDggOCI+PC9wYXRoPjxwYXRoIGQ9Ik0xNS42IDE0LjFhMyAzIDAgMCAxIC00LjYgMi4xYTMgMyAwIDAgMSAtLjYgLTRMMTIgMTBsMS42IDIuMWEzIDMgMCAwIDEgMiAyeiI+PC9wYXRoPjwvc3ZnPg==";
          }}
        />
        {showTooltips && <span className="tooltip">Dubai AI</span>}
      </a>

      {/* 04 Suggestions Icon */}
      <a 
        href="tel:04" 
        className="dubai-gov-footer-icon"
        aria-label="Call 04 for suggestions"
      >
        <div className="flex flex-col items-center justify-center">
          <span className="text-04">04</span>
        </div>
        {showTooltips && <span className="tooltip">Call 04</span>}
      </a>

      {/* Complaints Icon */}
      <a 
        href="#complaints" 
        className="dubai-gov-footer-icon"
        aria-label="Submit Complaints"
        onClick={(e) => {
          e.preventDefault();
          // You can add a modal or redirect logic here
          alert('Complaints form will open here');
        }}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        >
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        {showTooltips && <span className="tooltip">Submit Complaints</span>}
      </a>

      {/* Chatbot Icon */}
      <a 
        href="#chatbot" 
        className="dubai-gov-footer-icon has-notification"
        aria-label="Chat with us"
        onClick={(e) => {
          e.preventDefault();
          // You can add chatbot open logic here
          alert('Chatbot will open here');
        }}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        >
          <path d="M21 15a2 2 0 0 1-2 2h-2a2 2 0 0 0-2 2v3h-2a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3h6a2 2 0 0 1 2 2v8z"></path>
          <path d="M7 13H5a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h2.5"></path>
          <circle cx="17" cy="9" r="1"></circle>
        </svg>
        {showTooltips && <span className="tooltip">Chat with us</span>}
      </a>

      {/* Happiness Meter Icon */}
      <a 
        href="#happiness-meter" 
        className="dubai-gov-footer-icon"
        aria-label="Happiness Meter"
        onClick={(e) => {
          e.preventDefault();
          // You can add happiness meter open logic here
          alert('Happiness meter will open here');
        }}
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        >
          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
        </svg>
        {showTooltips && <span className="tooltip">Happiness Meter</span>}
      </a>
    </div>
  );
}

export default DubaiGovFooterIcons;
