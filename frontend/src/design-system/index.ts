/**
 * Design System Entry Point
 * Consolidated exports for the unified Dubai Government design system
 */

// Import and re-export design tokens
import { designTokens, colorTokens, typographyTokens, spacingTokens, borderRadiusTokens, shadowTokens, animationTokens, breakpointTokens, componentTokens, layoutTokens, designPatterns } from './tokens';
export { designTokens, colorTokens, typographyTokens, spacingTokens, borderRadiusTokens, shadowTokens, animationTokens, breakpointTokens, componentTokens, layoutTokens, designPatterns };

// Import and re-export design guidelines  
import { designGuidelines, colorGuidelines, typographyGuidelines, spacingGuidelines, componentGuidelines, layoutGuidelines, patternSelectionGuidelines, accessibilityGuidelines, bestPractices } from './guidelines';
export { designGuidelines, colorGuidelines, typographyGuidelines, spacingGuidelines, componentGuidelines, layoutGuidelines, patternSelectionGuidelines, accessibilityGuidelines, bestPractices };

// Import and re-export validation utilities
import { designSystemValidator, ColorValidator, TypographyValidator, SpacingValidator, ComponentValidator } from './validation';
export { designSystemValidator, ColorValidator, TypographyValidator, SpacingValidator, ComponentValidator };
export type { ValidationResult, ValidationError, ValidationWarning } from './validation';

// Export commonly used design system utilities
export const ds = {
  // Quick access to tokens
  get tokens() { return designTokens; },
  
  // Quick access to guidelines
  get guidelines() { return designGuidelines; },
  
  // Quick access to validator
  get validator() { return designSystemValidator; },
  
  // Utility functions for common design system operations
  utils: {
    /**
     * Get color value by path
     * @param path - Color path like 'primary.teal' or 'semantic.success'
     */
    getColor: (path: string): string => {
      const keys = path.split('.');
      let value: any = designTokens.colors;
      
      for (const key of keys) {
        value = value[key];
        if (!value) return '';
      }
      
      return value;
    },
    
    /**
     * Get spacing value by key
     * @param key - Spacing key like 'md', 'lg', 'xl'
     */
    getSpacing: (key: string): string => {
      return (designTokens.spacing as any)[key] || '';
    },
    
    /**
     * Get typography values by category
     * @param category - Typography category like 'fontSize', 'fontWeight'
     * @param key - Specific key within category
     */
    getTypography: (category: string, key: string): string => {
      return ((designTokens.typography as any)[category] as any)[key] || '';
    },
    
    /**
     * Determine which design pattern to use based on context
     * @param context - Context like 'compliance_auditor', 'innovation', 'education'
     */
    getDesignPattern: (context: 'compliance_auditor' | 'innovation' | 'education' | 'default') => {
      switch (context) {
        case 'compliance_auditor':
          return designTokens.patterns.group1;
        case 'innovation':
        case 'education':
          return designTokens.patterns.group2;
        default:
          return designTokens.patterns.group1;
      }
    },
    
    /**
     * Generate consistent shadow based on elevation level
     * @param level - Shadow level from 0-4
     */
    getShadow: (level: 0 | 1 | 2 | 3 | 4): string => {
      const shadows = ['none', 'sm', 'md', 'lg', 'xl'];
      return (designTokens.shadows as any)[shadows[level]];
    },
    
    /**
     * Generate responsive classes for consistent breakpoints
     * @param baseClass - Base class name
     * @param values - Object with breakpoint values
     */
    generateResponsiveClasses: (baseClass: string, values: Record<string, string>): string => {
      const classes = [baseClass];
      
      Object.entries(values).forEach(([breakpoint, value]) => {
        if (breakpoint === 'base') {
          classes[0] = `${baseClass}-${value}`;
        } else {
          classes.push(`${breakpoint}:${baseClass}-${value}`);
        }
      });
      
      return classes.join(' ');
    }
  },
  
  // Common class generators
  classes: {
    /**
     * Generate button classes based on variant and size
     */
    button: (variant: 'primary' | 'secondary' | 'destructive' = 'primary', size: 'sm' | 'md' | 'lg' = 'md'): string => {
      const baseClasses = 'ds-button';
      const variantClasses = {
        primary: 'gov-action-button',
        secondary: 'ehrdc-secondary hover:bg-ehrdc-neutral-light/80',
        destructive: 'bg-red-500 text-white hover:bg-red-600'
      };
      const sizeClasses = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg'
      };
      
      return `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`;
    },
    
    /**
     * Generate card classes based on variant
     */
    card: (variant: 'default' | 'elevated' | 'interactive' = 'default'): string => {
      const baseClasses = 'ds-card';
      const variantClasses = {
        default: '',
        elevated: 'shadow-lg',
        interactive: 'ds-interactive gov-service-card'
      };
      
      return `${baseClasses} ${variantClasses[variant]}`.trim();
    },
    
    /**
     * Generate input classes based on state
     */
    input: (state: 'default' | 'error' | 'success' = 'default'): string => {
      const baseClasses = 'ds-input gov-form-field';
      const stateClasses = {
        default: '',
        error: 'form-field-error',
        success: 'form-field-success'
      };
      
      return `${baseClasses} ${stateClasses[state]}`.trim();
    },
    
    /**
     * Generate typography classes
     */
    typography: (level: 'display' | 'h1' | 'h2' | 'h3' | 'body' | 'caption'): string => {
      const classes = {
        display: 'ds-text-display ds-heading',
        h1: 'ds-text-h1 ds-heading',
        h2: 'ds-text-h2 ds-heading',
        h3: 'ds-text-h3 ds-heading',
        body: 'ds-text-body',
        caption: 'ds-text-caption'
      };
      
      return classes[level];
    }
  }
};

// Default export for convenience
export default ds;
