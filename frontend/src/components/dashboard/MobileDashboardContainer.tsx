
import React from 'react';
import { UserRole } from '@/types/auth';
import MobileTouchOptimizedDashboard from '@/components/mobile/MobileTouchOptimizedDashboard';
import MobileNotifications from '@/components/mobile/MobileNotifications';
import { useMobileDetection } from '@/hooks/use-mobile-detection';

interface MobileDashboardContainerProps {
  user: User | null;
  roles: UserRole[];
}

const MobileDashboardContainer: React.FC<MobileDashboardContainerProps> = ({ 
  user, 
  roles 
}) => {
  const { isMobile, isCapacitor } = useMobileDetection();

  if (!isMobile && !isCapacitor) {
    return null;
  }

  return (
    <div className="space-y-6">
      <MobileTouchOptimizedDashboard user={user} roles={roles} />
    </div>
  );
};

export default MobileDashboardContainer;
