
import { useState, useEffect, useCallback } from 'react';
import { useMobileDetection } from './use-mobile-detection';
import { toast } from 'sonner';

export interface NotificationPayload {
  title: string;
  body: string;
  data?: any;
}

export const usePushNotifications = () => {
  const { isCapacitor } = useMobileDetection();
  const [isRegistered, setIsRegistered] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const requestPermissions = useCallback(async () => {
    if (!isCapacitor) return false;

    try {
      const { PushNotifications } = await import('@capacitor/push-notifications');
      const result = await PushNotifications.requestPermissions();
      if (result.receive === 'granted') {
        await PushNotifications.register();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Push notification permission error:', error);
      return false;
    }
  }, [isCapacitor]);

  const scheduleLocalNotification = useCallback(async (notification: NotificationPayload) => {
    if (!isCapacitor) {
      toast.info(`${notification.title}: ${notification.body}`);
      return;
    }

    try {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      await LocalNotifications.schedule({
        notifications: [
          {
            title: notification.title,
            body: notification.body,
            id: Date.now(),
            schedule: { at: new Date(Date.now() + 1000) },
            extra: notification.data
          }
        ]
      });
    } catch (error) {
      console.error('Local notification error:', error);
    }
  }, [isCapacitor]);

  useEffect(() => {
    if (!isCapacitor) return;

    const setupNotifications = async () => {
      try {
        const { PushNotifications } = await import('@capacitor/push-notifications');
        
        // Listen for registration
        PushNotifications.addListener('registration', (token) => {
          console.log('Push registration success, token: ' + token.value);
          setToken(token.value);
          setIsRegistered(true);
        });

        // Listen for registration errors
        PushNotifications.addListener('registrationError', (error) => {
          console.error('Error on registration: ' + JSON.stringify(error));
        });

        // Listen for push notifications
        PushNotifications.addListener('pushNotificationReceived', (notification) => {
          console.log('Push received: ' + JSON.stringify(notification));
          toast.info(`${notification.title}: ${notification.body}`);
        });

        // Listen for notification actions
        PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
          console.log('Push action performed: ' + JSON.stringify(notification));
        });
      } catch (error) {
        console.error('Error setting up notifications:', error);
      }
    };

    setupNotifications();

    return () => {
      if (isCapacitor) {
        import('@capacitor/push-notifications').then(({ PushNotifications }) => {
          PushNotifications.removeAllListeners();
        });
      }
    };
  }, [isCapacitor]);

  return {
    requestPermissions,
    scheduleLocalNotification,
    isRegistered,
    token,
    isAvailable: isCapacitor
  };
};
