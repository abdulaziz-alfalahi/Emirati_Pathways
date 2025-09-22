
import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { debounce } from 'lodash';
import { LocationData } from '../types/location';
import { parseInitialLocation, geocodeLocation, updatePrivacyCircle } from './map/mapUtils';
import { useMapEvents } from './map/useMapEvents';

interface UseMapInitializationProps {
  mapContainerRef: React.RefObject<HTMLDivElement>;
  initialLocation: string;
  onLocationSelect: (location: LocationData) => void;
  getEffectiveToken: () => string | null;
  persistentCircle?: boolean;
}

export const useMapInitialization = ({
  mapContainerRef,
  initialLocation,
  onLocationSelect,
  getEffectiveToken,
  persistentCircle = false
}: UseMapInitializationProps) => {
  // Create refs to store instances that should persist across renders
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const circleRef = useRef<mapboxgl.GeoJSONSource | null>(null);
  const circleLayerAddedRef = useRef<boolean>(false);
  
  // Store the last valid location to prevent resets
  const lastValidLocationRef = useRef<{
    lng: number;
    lat: number;
    zoom: number;
  } | null>(null);
  
  // Track if map has been initialized
  const mapInitializedRef = useRef<boolean>(false);
  
  // Keep track of when map style is loaded
  const [mapStyleLoaded, setMapStyleLoaded] = useState(false);
  
  // Flag to prevent rendering the map more than once
  const renderingMapRef = useRef(false);
  
  // Flag to prevent recursive console calls
  const inConsoleOperationRef = useRef(false);

  // Create a debounced geocode function - with proper error handling
  const geocodeLocationCallback = useCallback(
    debounce(async (lng: number, lat: number) => {
      try {
        console.log('Starting geocoding process for:', lng, lat);
        const token = getEffectiveToken();
        if (!token) {
          console.error('No token available for geocoding');
          return;
        }
        
        console.log('Geocoding location with token available');
        const locationData = await geocodeLocation(lng, lat, token);
        
        if (locationData) {
          console.log('Geocoded location successfully:', locationData);
          onLocationSelect(locationData);
        } else {
          console.error('Geocoding returned null result');
        }
      } catch (error) {
        console.error('Error in geocodeLocationCallback:', error);
      }
    }, 300), 
    [getEffectiveToken, onLocationSelect]
  );

  // Setup map events
  const { 
    setupFeatures, 
    setupClickHandler, 
    setupMoveEndHandler, 
    setupStyleLoadHandler 
  } = useMapEvents({
    map: mapRef.current,
    markerRef,
    circleRef,
    circleLayerAddedRef,
    lastValidLocationRef,
    mapStyleLoaded,
    geocodeCallback: geocodeLocationCallback
  });

  // Reset map instance
  const resetMap = useCallback(() => {
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }
    
    mapInitializedRef.current = false;
    setMapStyleLoaded(false);
    renderingMapRef.current = false;
    circleLayerAddedRef.current = false;
  }, []);

  // Initialize the map when the component mounts
  useEffect(() => {
    // Skip if map is already being rendered
    if (renderingMapRef.current || !mapContainerRef.current) {
      return;
    }
    
    const accessToken = getEffectiveToken();
    
    if (!accessToken) {
      renderingMapRef.current = false;
      return;
    }
    
    renderingMapRef.current = true;
    
    try {
      console.log('Initializing map');
      // Set the token before creating the map
      mapboxgl.accessToken = accessToken;
      
      // Parse initial location
      const initialLocationData = parseInitialLocation(initialLocation, inConsoleOperationRef.current);
      lastValidLocationRef.current = {
        lng: initialLocationData.lng,
        lat: initialLocationData.lat,
        zoom: 12
      };
      
      // Create the map with safe and deliberate parameters
      const mapOptions: mapboxgl.MapOptions = {
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v11',
        center: [initialLocationData.lng, initialLocationData.lat],
        zoom: 12
      };
      
      const map = new mapboxgl.Map(mapOptions);
      
      // Save map instance in ref
      mapRef.current = map;
      
      // Setup event handlers
      setupStyleLoadHandler(() => {
        console.log('Map style loaded');
        setMapStyleLoaded(true);
      });
      setupClickHandler();
      setupMoveEndHandler();
      
      // Add navigation controls
      map.addControl(new mapboxgl.NavigationControl(), 'top-right');
      
      // Cleanup function
      return () => {
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
          circleLayerAddedRef.current = false;
          markerRef.current = null;
          mapInitializedRef.current = false;
        }
        renderingMapRef.current = false;
      };
    } catch (error) {
      console.error("Error initializing map:", error);
      renderingMapRef.current = false;
      return;
    }
  }, [
    getEffectiveToken, 
    initialLocation, 
    mapContainerRef, 
    setupClickHandler, 
    setupMoveEndHandler, 
    setupStyleLoadHandler
  ]);
  
  // Update map when initialLocation changes and map is already initialized
  useEffect(() => {
    if (!mapRef.current || !initialLocation) return;
    
    try {
      const locationData = parseInitialLocation(initialLocation, inConsoleOperationRef.current);
      const map = mapRef.current;
      
      // Update map center - using safe values
      map.flyTo({
        center: [locationData.lng, locationData.lat],
        zoom: 12,
        essential: true
      });
      
      // Update last valid location with properly typed values
      lastValidLocationRef.current = {
        lng: locationData.lng,
        lat: locationData.lat,
        zoom: 12
      };
      
      // Update marker and circle
      if (mapStyleLoaded && map.isStyleLoaded()) {
        setupFeatures(locationData.lng, locationData.lat);
      } else {
        // If style isn't loaded yet, add marker when style loads
        map.once('style.load', () => {
          // Small timeout to ensure style is fully loaded
          setTimeout(() => {
            setupFeatures(locationData.lng, locationData.lat);
          }, 100);
        });
      }
    } catch (error) {
      console.error("Error updating map with new location:", error);
    }
  }, [initialLocation, mapStyleLoaded, setupFeatures]);
  
  // Effect specifically for adding the privacy circle when the style is loaded
  useEffect(() => {
    if (!mapStyleLoaded || !mapRef.current || !lastValidLocationRef.current) return;
    
    // Wait a bit to ensure the style is completely loaded
    const timer = setTimeout(() => {
      if (persistentCircle && mapRef.current && mapRef.current.isStyleLoaded() && lastValidLocationRef.current) {
        const { lng, lat } = lastValidLocationRef.current;
        updatePrivacyCircle(
          mapRef.current, 
          circleRef, 
          circleLayerAddedRef, 
          lng, 
          lat
        );
      }
    }, 200);
    
    return () => clearTimeout(timer);
  }, [mapStyleLoaded, persistentCircle]);

  return {
    mapStyleLoaded,
    resetMap
  };
};
