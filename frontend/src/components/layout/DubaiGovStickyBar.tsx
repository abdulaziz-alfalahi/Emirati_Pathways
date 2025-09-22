
import React, { useState, useEffect } from 'react';
import './DubaiGovStickyBar.css';

const DubaiGovStickyBar = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Handle scroll behavior for showing/hiding the sticky bar
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      // Hide when scrolling down, show when scrolling up
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const handleChatbotClick = () => {
    // Enhanced chatbot functionality - could integrate with actual EHRDC chat service
    console.log('Opening Mawred chatbot...');
    // Placeholder for actual chat integration
    window.open('#chatbot', '_blank');
  };

  return (
    <div className={`dubai-gov-sticky-bar ${isVisible ? 'visible' : 'hidden'} ${isMinimized ? 'minimized' : ''}`}>
      {/* Minimize/Expand Button */}
      <button 
        onClick={() => setIsMinimized(!isMinimized)}
        className="minimize-toggle"
        aria-label={isMinimized ? "Expand sticky bar" : "Minimize sticky bar"}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path 
            d={isMinimized ? "M4 6l4 4 4-4" : "M12 10l-4-4-4 4"} 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {!isMinimized && (
        <div className="dubai-gov-sticky-icons">
          {/* Dubai.ae - Official Government Portal */}
          <a 
            href="https://www.dubai.ae" 
            target="_blank" 
            rel="noopener noreferrer"
            className="sticky-icon dubai-ae"
            aria-label="Dubai.ae - Official Portal of the Dubai Government"
          >
            <img 
              src="/images/dubai-ae-icon.svg" 
              alt="Dubai.ae" 
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMwMDZFNkQiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMyA5bDktNyA5IDd2MTFhMiAyIDAgMCAxLTIgMkg1YTIgMiAwIDAgMS0yLTJ6Ij48L3BhdGg+PHBvbHlsaW5lIHBvaW50cz0iOSAyMiA5IDEyIDE1IDEyIDE1IDIyIj48L3BvbHlsaW5lPjwvc3ZnPg==";
              }}
            />
            <span className="tooltip">Dubai.ae</span>
          </a>

          {/* Dubai AI */}
          <a 
            href="https://www.dubaidigital.ae/en/dubaiAI.html" 
            target="_blank" 
            rel="noopener noreferrer"
            className="sticky-icon dubai-ai"
            aria-label="Dubai AI - Artificial Intelligence Platform"
          >
            <img 
              src="/images/dubai-ai-icon.svg" 
              alt="Dubai AI" 
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMwMDZFNkQiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMTIgMmE0IDQgMCAwIDAgLTQgNHY0YTQgNCAwIDAgMCA4IDBWNmE0IDQgMCAwIDAgLTQgLTR6Ij48L3BhdGg+PHBhdGggZD0iTTQgMTJhOCA4IDAgMCAxIDggLThhOCA4IDAgMCAxIDggOCI+PC9wYXRoPjxwYXRoIGQ9Ik0xNS42IDE0LjFhMyAzIDAgMCAxIC00LjYgMi4xYTMgMyAwIDAgMSAtLjYgLTRMMTIgMTBsMS42IDIuMWEzIDMgMCAwIDEgMiAyeiI+PC9wYXRoPjwvc3ZnPg==";
              }}
            />
            <span className="tooltip">Dubai AI</span>
          </a>

          {/* 04 Platform - Government Feedback Portal */}
          <a 
            href="https://04.gov.ae/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="sticky-icon suggestions-04"
            aria-label="04 Platform - Submit suggestions, comments and complaints"
          >
            <img 
              src="/images/04-icon.svg" 
              alt="04 Platform" 
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIj48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1zaXplPSIxMiIgZm9udC13ZWlnaHQ9ImJvbGQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIGZpbGw9IiMwMDZFNkQiPjA0PC90ZXh0Pjwvc3ZnPg==";
              }}
            />
            <span className="tooltip">04 Platform</span>
          </a>

          {/* EHRDC Contact */}
          <a 
            href="tel:600545555" 
            className="sticky-icon ehrdc-contact"
            aria-label="Call EHRDC Support - 600 54 5555"
          >
            <div className="icon-phone">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
            </div>
            <span className="tooltip">Call EHRDC</span>
          </a>

          {/* Mawred Chatbot */}
          <button 
            onClick={handleChatbotClick}
            className="sticky-icon mawred-chatbot"
            aria-label="Chat with Mawred - EHRDC Virtual Assistant"
          >
            <img 
              src="/images/mawred-icon.svg" 
              alt="Mawred Chatbot" 
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0OCIgaGVpZ2h0PSI0OCIgdmlld0JveD0iMCAwIDQ4IDQ4IiBmaWxsPSJub25lIj48cGF0aCBkPSJNMzYgMjBDMzYgMjguODM2NiAyOC44MzY2IDM2IDIwIDM2TDQgNDRWMzZDNCAyNy4xNjM0IDExLjE2MzQgMjAgMjAgMjBIMzZaIiBmaWxsPSIjMDA2RTZEIi8+PGNpcmNsZSBjeD0iMjAiIGN5PSIyNiIgcj0iNCIgZmlsbD0id2hpdGUiLz48cGF0aCBkPSJNMTYgMzJDMTYgMjkuNzkwOSAxNy43OTA5IDI4IDIwIDI4QzIyLjIwOTEgMjggMjQgMjkuNzkwOSAyNCAzMlYzNkgxNlYzMloiIGZpbGw9IndoaXRlIi8+PHBhdGggZD0iTTI2IDI4TDMwIDI0TDM0IDI4IiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjxwYXRoIGQ9Ik0zMCAyNFYzNCIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz48L3N2Zz4=";
              }}
            />
            <span className="tooltip">Chat with Mawred</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default DubaiGovStickyBar;
