
import { useState, useCallback } from 'react';
import { useMobileDetection } from './use-mobile-detection';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  heading?: number;
  speed?: number;
}

export const useGeolocation = () => {
  const { isCapacitor } = useMobileDetection();
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const requestPermissions = useCallback(async () => {
    if (!isCapacitor) {
      return 'geolocation' in navigator;
    }

    try {
      const { Geolocation } = await import('@capacitor/geolocation');
      const permissions = await Geolocation.requestPermissions();
      return permissions.location === 'granted';
    } catch (error) {
      console.error('Geolocation permission error:', error);
      return false;
    }
  }, [isCapacitor]);

  const getCurrentPosition = useCallback(async () => {
    if (!isCapacitor) {
      setIsLoading(true);
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000
          });
        });

        const locationData: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude || undefined,
          heading: position.coords.heading || undefined,
          speed: position.coords.speed || undefined
        };

        setLocation(locationData);
        setIsLoading(false);
        return locationData;
      } catch (error) {
        console.error('Geolocation error:', error);
        setIsLoading(false);
        return null;
      }
    }

    try {
      setIsLoading(true);
      const { Geolocation } = await import('@capacitor/geolocation');
      
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });

      const locationData: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude || undefined,
        heading: position.coords.heading || undefined,
        speed: position.coords.speed || undefined
      };

      setLocation(locationData);
      setIsLoading(false);
      return locationData;
    } catch (error) {
      console.error('Geolocation error:', error);
      setIsLoading(false);
      return null;
    }
  }, [isCapacitor]);

  return {
    location,
    getCurrentPosition,
    requestPermissions,
    isLoading,
    isAvailable: isCapacitor || 'geolocation' in navigator
  };
};
