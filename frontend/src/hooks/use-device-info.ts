
import { useState, useEffect } from 'react';
import { useMobileDetection } from './use-mobile-detection';

export interface DeviceInfo {
  platform: string;
  model?: string;
  manufacturer?: string;
  operatingSystem: string;
  osVersion?: string;
  batteryLevel?: number;
  isCharging?: boolean;
  networkStatus?: string;
}

export const useDeviceInfo = () => {
  const { isCapacitor } = useMobileDetection();
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);

  useEffect(() => {
    const getDeviceInfo = async () => {
      if (!isCapacitor) {
        // Web implementation with limited info
        const info: DeviceInfo = {
          platform: 'web',
          operatingSystem: navigator.platform,
          networkStatus: navigator.onLine ? 'online' : 'offline'
        };

        // Try to get battery info if available
        if ('getBattery' in navigator) {
          try {
            const battery = await (navigator as any).getBattery();
            info.batteryLevel = battery.level;
            info.isCharging = battery.charging;
          } catch (error) {
            console.log('Battery API not available');
          }
        }

        setDeviceInfo(info);
        return;
      }

      try {
        const { Device } = await import('@capacitor/device');
        const deviceData = await Device.getInfo();
        
        const info: DeviceInfo = {
          platform: deviceData.platform,
          model: deviceData.model,
          manufacturer: deviceData.manufacturer,
          operatingSystem: deviceData.operatingSystem,
          osVersion: deviceData.osVersion
        };

        // Get battery info if available
        try {
          const batteryInfo = await Device.getBatteryInfo();
          info.batteryLevel = batteryInfo.batteryLevel;
          info.isCharging = batteryInfo.isCharging;
        } catch (error) {
          console.log('Battery info not available');
        }

        setDeviceInfo(info);
      } catch (error) {
        console.error('Error getting device info:', error);
      }
    };

    getDeviceInfo();
  }, [isCapacitor]);

  return { deviceInfo };
};
