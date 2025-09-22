
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface MapTokenInputProps {
  token: string;
  onTokenChange: (value: string) => void;
  onTokenSubmit: () => void;
}

const MapTokenInput: React.FC<MapTokenInputProps> = ({
  token,
  onTokenChange,
  onTokenSubmit
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onTokenSubmit();
  };

  return (
    <div className="mb-4 p-4 border border-orange-300 bg-orange-50 rounded-md">
      <p className="text-sm text-orange-800 mb-2">
        Mapbox access token is required to display the map. Please enter your Mapbox public token below.
      </p>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="text"
          value={token}
          onChange={(e) => onTokenChange(e.target.value)}
          placeholder="Enter your Mapbox public token"
          className="flex-1"
        />
        <Button type="submit" size="sm">
          Apply Token
        </Button>
      </form>
      <p className="text-xs text-gray-600 mt-2">
        You can get a Mapbox token by creating an account at{" "}
        <a 
          href="https://mapbox.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          mapbox.com
        </a>
        . Find your public token in the Account {'>'} Access tokens section.
      </p>
    </div>
  );
};

export default MapTokenInput;
