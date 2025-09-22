
import React from 'react';
import { LucideProps } from 'lucide-react';

export const DirhamSign: React.FC<LucideProps> = ({ 
  size = 24, 
  color = "currentColor", 
  strokeWidth = 2,
  className,
  ...props 
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Capital D shape */}
      <path d="M4 4 L4 20 L12 20 C16.4183 20 20 16.4183 20 12 C20 7.58172 16.4183 4 12 4 L4 4 Z" />
      {/* First horizontal line */}
      <line x1="2" y1="9" x2="16" y2="9" />
      {/* Second horizontal line */}
      <line x1="2" y1="15" x2="16" y2="15" />
    </svg>
  );
};
