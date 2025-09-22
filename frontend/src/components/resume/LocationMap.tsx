
import React, { useRef } from 'react';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useMapboxToken } from './hooks/useMapboxToken';
import { useMapInitialization } from './hooks/useMapInitialization';
import MapTokenInput from './MapTokenInput';
import { LocationData } from './types/location';

interface LocationMapProps {
  initialLocation?: string;
  onLocationSelect: (location: LocationData) => void;
  height?: string;
  persistentCircle?: boolean;
}

const LocationMap: React.FC<LocationMapProps> = ({
  initialLocation = '',
  onLocationSelect,
  height = '400px',
  persistentCircle = false
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  // Token management
  const {
    customMapboxToken,
    setCustomMapboxToken,
    showTokenInput,
    isLoadingApiKeys,
    handleTokenSubmit,
    getEffectiveToken
  } = useMapboxToken();
  
  // Map initialization and interaction 
  const { resetMap } = useMapInitialization({
    mapContainerRef,
    initialLocation,
    onLocationSelect,
    getEffectiveToken,
    persistentCircle
  });
  
  // Handle token submission
  const handleMapTokenSubmit = () => {
    if (handleTokenSubmit()) {
      resetMap();
    }
  };

  return (
    <div>
      {showTokenInput ? (
        <MapTokenInput
          token={customMapboxToken}
          onTokenChange={setCustomMapboxToken}
          onTokenSubmit={handleMapTokenSubmit}
        />
      ) : null}
      
      <div 
        ref={mapContainerRef} 
        className="rounded-md overflow-hidden border border-gray-300" 
        style={{ height, width: '100%' }}
      />
      
      {isLoadingApiKeys && !showTokenInput && (
        <div className="absolute inset-0 flex justify-center items-center bg-white bg-opacity-70">
          <p>Loading map...</p>
        </div>
      )}
    </div>
  );
};

export default LocationMap;
