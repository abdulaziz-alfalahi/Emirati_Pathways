import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

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
  iconColor = 'text-teal-600',
  href,
  onClick,
  badge,
  badgeColor = 'blue',
  children,
  className = '',
  size = 'md'
}) => {
  const badgeColors = {
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    red: 'bg-red-100 text-red-800',
    purple: 'bg-purple-100 text-purple-800'
  };

  const sizeClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const CardContent = () => (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 ${sizeClasses[size]} ${className}`}>
      {/* Badge */}
      {badge && (
        <div className="mb-3">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeColors[badgeColor]}`}>
            {badge}
          </span>
        </div>
      )}

      {/* Header with Icon */}
      <div className="flex items-start space-x-3 mb-4">
        {Icon && (
          <div className={`flex-shrink-0 ${iconColor}`}>
            <Icon className="h-6 w-6" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {title}
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed">
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
        <div className="group-hover:scale-[1.02] transition-transform duration-200">
          <CardContent />
        </div>
      </Link>
    );
  }

  if (onClick) {
    return (
      <button onClick={onClick} className="block w-full text-left group">
        <div className="group-hover:scale-[1.02] transition-transform duration-200">
          <CardContent />
        </div>
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
      <div className="space-y-2 mb-6">
        {features.map((feature, index) => (
          <div key={index} className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-teal-600 rounded-full flex-shrink-0"></div>
            <span className="text-sm text-gray-600">{feature}</span>
          </div>
        ))}
      </div>

      {/* CTA Button */}
      {href && (
        <Link
          to={href}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors"
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
    neutral: 'text-gray-600'
  };

  return (
    <StandardCard
      title=""
      description=""
      className="text-center"
    >
      {Icon && (
        <div className="flex justify-center mb-3">
          <Icon className="h-8 w-8 text-teal-600" />
        </div>
      )}
      <div className="text-3xl font-bold text-gray-900 mb-1">
        {value}
      </div>
      <div className="text-sm font-medium text-gray-600 mb-2">
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
