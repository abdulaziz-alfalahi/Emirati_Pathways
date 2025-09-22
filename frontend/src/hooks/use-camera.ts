
import { useState, useCallback } from 'react';
import { useMobileDetection } from './use-mobile-detection';

export const useCamera = () => {
  const { isCapacitor } = useMobileDetection();
  const [isCapturing, setIsCapturing] = useState(false);

  const requestPermissions = useCallback(async () => {
    if (!isCapacitor) {
      // Web camera permissions
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        return true;
      } catch (error) {
        console.error('Camera permission denied:', error);
        return false;
      }
    }

    try {
      const { Camera } = await import('@capacitor/camera');
      const permissions = await Camera.requestPermissions();
      return permissions.camera === 'granted';
    } catch (error) {
      console.error('Camera permission error:', error);
      return false;
    }
  }, [isCapacitor]);

  const takePicture = useCallback(async () => {
    if (!isCapacitor) {
      // Web implementation
      try {
        setIsCapturing(true);
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        
        // Create video element to capture frame
        const video = document.createElement('video');
        video.srcObject = stream;
        video.play();
        
        return new Promise<string>((resolve) => {
          video.onloadedmetadata = () => {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(video, 0, 0);
            
            const imageData = canvas.toDataURL('image/jpeg', 0.8);
            stream.getTracks().forEach(track => track.stop());
            setIsCapturing(false);
            resolve(imageData);
          };
        });
      } catch (error) {
        console.error('Camera capture error:', error);
        setIsCapturing(false);
        return null;
      }
    }

    try {
      setIsCapturing(true);
      const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
      
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera
      });

      setIsCapturing(false);
      return image.dataUrl || null;
    } catch (error) {
      console.error('Camera capture error:', error);
      setIsCapturing(false);
      return null;
    }
  }, [isCapacitor]);

  return {
    takePicture,
    requestPermissions,
    isCapturing,
    isAvailable: isCapacitor || !!navigator.mediaDevices?.getUserMedia
  };
};
