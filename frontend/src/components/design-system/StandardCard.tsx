import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

interface StandardCardProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  iconColor?: string;
  href?: string;
  onClick?: () => void;
  badge?: string;
  badgeColor?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  children?: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const StandardCard: React.FC<StandardCardProps> = ({
  title,
  description,
  icon: Icon,
  iconColor = 'text-[#006E6D]',
  href,
  onClick,
  badge,
  badgeColor = 'blue',
  children,
  className = '',
  size = 'md'
}) => {
  const badgeColors = {
    blue: 'bg-[#E6F5F5] text-[#006E6D]',
    green: 'bg-green-50 text-green-700',
    yellow: 'bg-amber-50 text-amber-700',
    red: 'bg-red-50 text-red-700',
    purple: 'bg-purple-50 text-purple-700'
  };

  const sizeClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-7'
  };

  const CardContent = () => (
    <div className={`bg-white rounded-2xl border border-[#E2E5E9] hover:border-[#006E6D]/25 transition-all duration-200 ${sizeClasses[size]} ${className}`} style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
      {/* Badge */}
      {badge && (
        <div className="mb-3">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeColors[badgeColor]}`}>
            {badge}
          </span>
        </div>
      )}

      {/* Header with Icon */}
      <div className="flex items-start space-x-3 mb-3">
        {Icon && (
          <div className="flex-shrink-0 w-10 h-10 bg-[#E6F5F5] rounded-xl flex items-center justify-center">
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-[#1A1A1A] mb-1">
            {title}
          </h3>
          <p className="text-sm text-[#6B7280] leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      {/* Additional Content */}
      {children && (
        <div className="mt-4">
          {children}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link to={href} className="block group">
        <CardContent />
      </Link>
    );
  }

  if (onClick) {
    return (
      <button onClick={onClick} className="block w-full text-start group">
        <CardContent />
      </button>
    );
  }

  return <CardContent />;
};

// Feature Card Component for highlighting key features
interface FeatureCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  features: string[];
  href?: string;
  ctaText?: string;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  description,
  icon: Icon,
  features,
  href,
  ctaText = 'Learn More'
}) => {
  return (
    <StandardCard
      title={title}
      description={description}
      icon={Icon}
      size="lg"
      className="h-full"
    >
      {/* Features List */}
      <div className="space-y-2 mb-5">
        {features.map((feature, index) => (
          <div key={index} className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-[#006E6D] flex-shrink-0" />
            <span className="text-sm text-[#374151]">{feature}</span>
          </div>
        ))}
      </div>

      {/* CTA Button */}
      {href && (
        <Link
          to={href}
          className="inline-flex items-center px-5 py-2 text-sm font-medium rounded-xl text-white bg-[#006E6D] hover:bg-[#005A59] transition-colors"
        >
          {ctaText}
        </Link>
      )}
    </StandardCard>
  );
};

// Stats Card Component for displaying metrics
interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon?: LucideIcon;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon
}) => {
  const changeColors = {
    positive: 'text-green-600',
    negative: 'text-red-600',
    neutral: 'text-[#6B7280]'
  };

  return (
    <StandardCard
      title=""
      description=""
      className="text-center"
    >
      {Icon && (
        <div className="flex justify-center mb-3">
          <div className="w-10 h-10 bg-[#E6F5F5] rounded-xl flex items-center justify-center">
            <Icon className="h-5 w-5 text-[#006E6D]" />
          </div>
        </div>
      )}
      <div className="text-2xl font-bold text-[#1A1A1A] mb-1">
        {value}
      </div>
      <div className="text-sm font-medium text-[#6B7280] mb-1">
        {title}
      </div>
      {change && (
        <div className={`text-xs font-medium ${changeColors[changeType]}`}>
          {change}
        </div>
      )}
    </StandardCard>
  );
};

export default StandardCard;
