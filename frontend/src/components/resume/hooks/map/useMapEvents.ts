import { useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { setupMapFeatures } from './mapUtils';

interface UseMapEventsProps {
  map: mapboxgl.Map | null;
  markerRef: React.MutableRefObject<mapboxgl.Marker | null>;
  circleRef: React.MutableRefObject<mapboxgl.GeoJSONSource | null>;
  circleLayerAddedRef: React.MutableRefObject<boolean>;
  lastValidLocationRef: React.MutableRefObject<{
    lng: number;
    lat: number;
    zoom: number;
  } | null>;
  mapStyleLoaded: boolean;
  geocodeCallback: (lng: number, lat: number) => void;
}

export const useMapEvents = ({
  map,
  markerRef,
  circleRef,
  circleLayerAddedRef,
  lastValidLocationRef,
  mapStyleLoaded,
  geocodeCallback
}: UseMapEventsProps) => {
  
  // Function to setup map features (marker, circle) after style is loaded
  const setupFeatures = useCallback((lng: number, lat: number) => {
    if (!map) {
      console.error('Map not available in setupFeatures');
      return;
    }
    
    console.log(`Setting up features at ${lng},${lat}`);
    setupMapFeatures(
      map,
      markerRef,
      circleRef,
      circleLayerAddedRef,
      lng,
      lat,
      mapStyleLoaded,
      geocodeCallback
    );
  }, [map, markerRef, circleRef, circleLayerAddedRef, mapStyleLoaded, geocodeCallback]);

  // Setup click event handler
  const setupClickHandler = useCallback(() => {
    if (!map) {
      console.error('Map not available in setupClickHandler');
      return;
    }
    
    console.log('Setting up click handler');
    map.on('click', (e) => {
      // Safely access coordinates using MapboxGL's API
      const { lng, lat } = e.lngLat;
      console.log(`Map clicked at ${lng},${lat}`);
      
      // Update last valid location using proper properties
      lastValidLocationRef.current = {
        lng: lng,
        lat: lat,
        zoom: map.getZoom()
      };
      
      // Setup map features when user clicks
      setupFeatures(lng, lat);
    });
  }, [map, lastValidLocationRef, setupFeatures]);

  // Setup movement end handler
  const setupMoveEndHandler = useCallback(() => {
    if (!map) {
      console.error('Map not available in setupMoveEndHandler');
      return;
    }
    
    console.log('Setting up moveend handler');
    map.on('moveend', () => {
      if (!map) return;
      
      const center = map.getCenter();
      const zoom = map.getZoom();
      
      // Only update if moved by user (not programmatically) and there's a previous location
      if (lastValidLocationRef.current && 
          (Math.abs(center.lng - lastValidLocationRef.current.lng) > 0.001 || 
           Math.abs(center.lat - lastValidLocationRef.current.lat) > 0.001)) {
        lastValidLocationRef.current = {
          lng: center.lng,
          lat: center.lat,
          zoom
        };
      }
    });
  }, [map, lastValidLocationRef]);

  // Setup style load handler
  const setupStyleLoadHandler = useCallback((callback: () => void) => {
    if (!map) {
      console.error('Map not available in setupStyleLoadHandler');
      return;
    }
    
    console.log('Setting up style.load handler');
    map.on('style.load', () => {
      console.log('Map style loaded - from event handler');
      callback();
      
      // Wait a brief moment to ensure style is fully loaded
      setTimeout(() => {
        // Add initial marker and circle after style is loaded
        if (lastValidLocationRef.current && map.isStyleLoaded()) {
          console.log('Setting up initial features after style load');
          const { lng, lat } = lastValidLocationRef.current;
          setupFeatures(lng, lat);
        } else {
          console.log('Style not fully loaded or no valid location after timeout');
        }
      }, 200);
    });
  }, [map, lastValidLocationRef, setupFeatures]);

  return {
    setupFeatures,
    setupClickHandler,
    setupMoveEndHandler,
    setupStyleLoadHandler
  };
};
