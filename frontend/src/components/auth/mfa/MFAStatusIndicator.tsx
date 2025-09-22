import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Shield, ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react';
import { MFAStatus } from '@/types/mfa';

interface MFAStatusIndicatorProps {
  status: MFAStatus;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const MFAStatusIndicator: React.FC<MFAStatusIndicatorProps> = ({
  status,
  showText = true,
  size = 'md'
}) => {
  const getStatusVariant = () => {
    if (status.setup_required) return 'destructive';
    if (status.enabled && status.verified_factors.length > 0) return 'default';
    if (status.required) return 'destructive';
    return 'secondary';
  };

  const getStatusIcon = () => {
    const iconSize = size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';
    
    if (status.setup_required) {
      return <AlertTriangle className={iconSize} />;
    }
    if (status.enabled && status.verified_factors.length > 0) {
      return <ShieldCheck className={iconSize} />;
    }
    if (status.required) {
      return <ShieldAlert className={iconSize} />;
    }
    return <Shield className={iconSize} />;
  };

  const getStatusText = () => {
    if (status.setup_required) {
      return 'MFA Setup Required';
    }
    if (status.enabled && status.verified_factors.length > 0) {
      return `MFA Active (${status.verified_factors.length} method${status.verified_factors.length > 1 ? 's' : ''})`;
    }
    if (status.required) {
      return 'MFA Required';
    }
    if (status.grace_period_remaining && status.grace_period_remaining > 0) {
      const hours = Math.floor(status.grace_period_remaining);
      return `Setup Required (${hours}h remaining)`;
    }
    return 'MFA Optional';
  };

  const getStatusDescription = () => {
    if (status.setup_required) {
      return 'Multi-factor authentication must be configured';
    }
    if (status.enabled && status.verified_factors.length > 0) {
      const methods = status.verified_factors.map(factor => 
        factor.factor_type === 'totp' ? 'Authenticator' : 'SMS'
      ).join(', ');
      return `Protected with: ${methods}`;
    }
    if (status.required) {
      return 'Your role requires multi-factor authentication';
    }
    return 'Additional security available';
  };

  // Map size prop to text size classes - THIS IS THE KEY FIX
  const getTextSizeClass = () => {
    switch (size) {
      case 'sm':
        return 'text-xs';
      case 'lg':
        return 'text-lg';
      default:
        return 'text-sm';
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Badge variant={getStatusVariant()} className="gap-1">
        {getStatusIcon()}
        {showText && (
          <span className={getTextSizeClass()}>
            {getStatusText()}
          </span>
        )}
      </Badge>
      
      {size === 'lg' && (
        <span className="text-sm text-muted-foreground">
          {getStatusDescription()}
        </span>
      )}
    </div>
  );
};

