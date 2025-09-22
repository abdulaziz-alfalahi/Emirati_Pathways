
import React from 'react';
import { cn } from '@/lib/utils';

interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  variant?: 'default' | 'hover-lift' | 'hover-glow' | 'interactive';
  delay?: number;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  className,
  onClick,
  variant = 'default',
  delay = 0
}) => {
  const variants = {
    default: "transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
    'hover-lift': "transition-all duration-300 hover:shadow-xl hover:-translate-y-2 hover:shadow-ehrdc-teal/10",
    'hover-glow': "transition-all duration-300 hover:shadow-lg hover:shadow-ehrdc-teal/20 hover:border-ehrdc-teal/30",
    interactive: "transition-all duration-300 hover:shadow-xl hover:-translate-y-2 hover:shadow-ehrdc-teal/15 active:scale-[0.98] cursor-pointer"
  };

  return (
    <div
      className={cn(
        "animate-fade-in bg-white rounded-xl border border-gray-100 p-6",
        variants[variant],
        onClick && "cursor-pointer",
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

interface AnimatedIconProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'pulse' | 'bounce' | 'rotate' | 'scale';
  trigger?: 'hover' | 'focus' | 'always';
}

export const AnimatedIcon: React.FC<AnimatedIconProps> = ({
  children,
  className,
  variant = 'scale',
  trigger = 'hover'
}) => {
  const variants = {
    pulse: "animate-pulse",
    bounce: "animate-bounce",
    rotate: "hover:rotate-12 transition-transform duration-300",
    scale: "hover:scale-110 transition-transform duration-300"
  };

  const triggerClasses = {
    hover: `group-hover:${variants[variant]}`,
    focus: `group-focus:${variants[variant]}`,
    always: variants[variant]
  };

  return (
    <div className={cn(
      "transition-transform duration-300",
      trigger === 'always' ? variants[variant] : `hover:${variants[variant].replace('hover:', '')}`,
      className
    )}>
      {children}
    </div>
  );
};

interface FadeInViewProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
}

export const FadeInView: React.FC<FadeInViewProps> = ({
  children,
  className,
  delay = 0,
  direction = 'up'
}) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [delay]);

  const directions = {
    up: 'translate-y-8',
    down: '-translate-y-8',
    left: 'translate-x-8',
    right: '-translate-x-8'
  };

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-700 ease-out",
        isVisible
          ? "opacity-100 translate-x-0 translate-y-0"
          : `opacity-0 ${directions[direction]}`,
        className
      )}
    >
      {children}
    </div>
  );
};

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'teal' | 'neutral' | 'white';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'teal',
  className
}) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const colors = {
    teal: 'text-ehrdc-teal',
    neutral: 'text-ehrdc-neutral-dark',
    white: 'text-white'
  };

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-current border-t-transparent",
        sizes[size],
        colors[color],
        className
      )}
    />
  );
};

// Form feedback animations
interface FormFeedbackProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  visible: boolean;
  className?: string;
}

export const FormFeedback: React.FC<FormFeedbackProps> = ({
  type,
  message,
  visible,
  className
}) => {
  const typeStyles = {
    success: 'bg-green-50 text-green-800 border-green-200',
    error: 'bg-red-50 text-red-800 border-red-200',
    warning: 'bg-orange-50 text-orange-800 border-orange-200',
    info: 'bg-blue-50 text-blue-800 border-blue-200'
  };

  return (
    <div
      className={cn(
        "transition-all duration-300 ease-out border rounded-lg p-3 text-sm",
        visible
          ? "opacity-100 translate-y-0 max-h-20"
          : "opacity-0 -translate-y-2 max-h-0 overflow-hidden",
        typeStyles[type],
        className
      )}
    >
      {message}
    </div>
  );
};
