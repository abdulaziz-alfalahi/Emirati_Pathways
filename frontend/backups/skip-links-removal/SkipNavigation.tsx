
import React from 'react';

export const SkipNavigation: React.FC = () => {
  return (
    <>
      <a 
        href="#main-content" 
        className="skip-link"
        onFocus={(e) => e.target.scrollIntoView()}
      >
        Skip to main content
      </a>
      <a 
        href="#navigation" 
        className="skip-link"
        onFocus={(e) => e.target.scrollIntoView()}
      >
        Skip to navigation
      </a>
    </>
  );
};
