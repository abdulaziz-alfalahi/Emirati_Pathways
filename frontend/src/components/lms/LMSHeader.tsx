
import React from 'react';

interface LMSHeaderProps {
  title: string;
  description: string;
}

export const LMSHeader: React.FC<LMSHeaderProps> = ({ title, description }) => {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold tracking-tight mb-2">{title}</h1>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
};
