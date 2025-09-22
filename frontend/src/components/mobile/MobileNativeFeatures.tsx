
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCamera } from '@/hooks/use-camera';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { useGeolocation } from '@/hooks/use-geolocation';
import { useDeviceInfo } from '@/hooks/use-device-info';
import { 
  Camera, 
  Bell, 
  MapPin, 
  Smartphone,
  Image,
  BatteryLow,
  Wifi
} from 'lucide-react';

const MobileNativeFeatures: React.FC = () => {
  const { takePicture, requestPermissions: requestCameraPermissions, isCapturing } = useCamera();
  const { requestPermissions: requestNotificationPermissions, scheduleLocalNotification, isRegistered } = usePushNotifications();
  const { getCurrentPosition, requestPermissions: requestLocationPermissions, location, isLoading } = useGeolocation();
  const { deviceInfo } = useDeviceInfo();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const handleTakePicture = async () => {
    const hasPermission = await requestCameraPermissions();
    if (!hasPermission) return;

    const imageData = await takePicture();
    if (imageData) {
      setCapturedImage(imageData);
    }
  };

  const handleTestNotification = async () => {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return;

    await scheduleLocalNotification({
      title: 'Test Notification',
      body: 'This is a test notification from your Emirati Pathways app!',
      data: { test: true }
    });
  };

  const handleGetLocation = async () => {
    const hasPermission = await requestLocationPermissions();
    if (!hasPermission) return;

    await getCurrentPosition();
  };

  return (
    <div className="space-y-6 p-4">
      {/* Device Info */}
      {deviceInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Smartphone className="h-5 w-5" />
              <span>Device Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="font-medium">Platform:</span>
                <Badge variant="outline" className="ml-2">
                  {deviceInfo.platform}
                </Badge>
              </div>
              <div>
                <span className="font-medium">OS:</span>
                <span className="ml-2">{deviceInfo.operatingSystem} {deviceInfo.osVersion}</span>
              </div>
              <div>
                <span className="font-medium">Model:</span>
                <span className="ml-2">{deviceInfo.model}</span>
              </div>
              <div>
                <span className="font-medium">Manufacturer:</span>
                <span className="ml-2">{deviceInfo.manufacturer}</span>
              </div>
              {deviceInfo.batteryLevel && (
                <div className="flex items-center">
                  <BatteryLow className="h-4 w-4 mr-1" />
                  <span>{Math.round(deviceInfo.batteryLevel * 100)}%</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Camera Feature */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Camera className="h-5 w-5" />
            <span>Camera</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Button 
              onClick={handleTakePicture} 
              disabled={isCapturing}
              className="w-full"
            >
              {isCapturing ? 'Capturing...' : 'Take Picture'}
            </Button>
            
            {capturedImage && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Image className="h-4 w-4" />
                  <span className="text-sm font-medium">Captured Image:</span>
                </div>
                <img 
                  src={capturedImage} 
                  alt="Captured" 
                  className="w-full h-32 object-cover rounded-lg border"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Push Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Notifications</span>
            {isRegistered && (
              <Badge variant="outline" className="text-green-600">
                Enabled
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Button 
              onClick={handleTestNotification}
              variant="outline"
              className="w-full"
            >
              Test Notification
            </Button>
            <p className="text-sm text-gray-600">
              {isRegistered 
                ? 'Notifications are enabled for this device' 
                : 'Tap to enable push notifications'
              }
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Geolocation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>Location</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Button 
              onClick={handleGetLocation} 
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              {isLoading ? 'Getting Location...' : 'Get Current Location'}
            </Button>
            
            {location && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-sm space-y-1">
                  <div><strong>Latitude:</strong> {location.latitude.toFixed(6)}</div>
                  <div><strong>Longitude:</strong> {location.longitude.toFixed(6)}</div>
                  {location.accuracy && (
                    <div><strong>Accuracy:</strong> {location.accuracy.toFixed(0)}m</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Feature Availability */}
      <Card>
        <CardHeader>
          <CardTitle>Native Features Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Camera</span>
              <Badge variant={deviceInfo?.platform !== 'web' ? 'default' : 'secondary'}>
                {deviceInfo?.platform !== 'web' ? 'Available' : 'Limited'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Notifications</span>
              <Badge variant={deviceInfo?.platform !== 'web' ? 'default' : 'secondary'}>
                {deviceInfo?.platform !== 'web' ? 'Available' : 'Limited'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Location</span>
              <Badge variant="default">Available</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Device Info</span>
              <Badge variant={deviceInfo?.platform !== 'web' ? 'default' : 'secondary'}>
                {deviceInfo?.platform !== 'web' ? 'Full' : 'Basic'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MobileNativeFeatures;
