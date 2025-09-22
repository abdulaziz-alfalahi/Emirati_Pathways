/**
 * Design System Tokens
 * Comprehensive token system for the Dubai Government EHRDC platform
 * Supporting all four citizen journey phases with unified standards
 */

// ============= Core Color System =============
export const colorTokens = {
  // EHRDC Brand Colors (Primary System)
  primary: {
    teal: '#006E6D',
    darkTeal: '#005A59',
    lightTeal: '#4A9B9A',
    gold: '#C3992A'
  },
  
  // Neutral Palette
  neutral: {
    white: '#FFFFFF',
    light: '#F5F5F5',
    medium: '#CCCCCC',
    dark: '#1A1A1A',
    black: '#000000'
  },
  
  // Semantic Colors
  semantic: {
    success: '#16A34A',
    error: '#EF4444',
    warning: '#F97316',
    info: '#3B82F6'
  },
  
  // Phase-Specific Color Extensions
  phases: {
    education: {
      primary: '#006E6D',      // EHRDC Teal
      secondary: '#B3DEDD',    // Light Teal
      accent: '#00A651',       // Green
      background: 'rgba(179, 222, 221, 0.1)',
      text: '#1A1A1A'
    },
    career: {
      primary: '#0079C1',      // Dubai Blue
      secondary: '#B3E0FF',    // Light Blue
      accent: '#00ABB3',       // Teal
      background: 'rgba(0, 121, 193, 0.05)',
      text: '#1A1A1A'
    },
    professional: {
      primary: '#7B1FA2',      // Purple
      secondary: '#E1BEE7',    // Light Purple
      accent: '#F57C00',       // Orange
      background: 'rgba(123, 31, 162, 0.05)',
      text: '#1A1A1A'
    },
    lifelong: {
      primary: '#D32F2F',      // Red
      secondary: '#FFCDD2',    // Light Red
      accent: '#00A651',       // Green
      background: 'rgba(211, 47, 47, 0.05)',
      text: '#1A1A1A'
    }
  }
};

// ============= Typography System =============
export const typographyTokens = {
  fontFamily: {
    primary: ['Dubai', 'Arial', 'sans-serif'],
    arabic: ['Dubai', 'Arial', 'sans-serif'],
    display: ['Dubai', 'Arial', 'sans-serif'],
    government: ['Dubai', 'Arial', 'sans-serif'],
    // All font families now use Dubai font
    sans: ['Dubai', 'Arial', 'sans-serif'],
    body: ['Dubai', 'Arial', 'sans-serif'],
    heading: ['Dubai', 'Arial', 'sans-serif']
  },
  
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem',    // 48px
    '6xl': '3.75rem', // 60px
    '7xl': '4.5rem',  // 72px
    '8xl': '6rem',    // 96px
    '9xl': '8rem'     // 128px
  },
  
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700'
  },
  
  lineHeight: {
    tight: '1.1',
    snug: '1.2',
    normal: '1.4',
    relaxed: '1.6',
    loose: '1.8'
  },
  
  letterSpacing: {
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em'
  }
};

// ============= Spacing System =============
export const spacingTokens = {
  // Base scale (4px)
  '0': '0',
  '1': '0.25rem',   // 4px
  '2': '0.5rem',    // 8px
  '3': '0.75rem',   // 12px
  '4': '1rem',      // 16px
  '5': '1.25rem',   // 20px
  '6': '1.5rem',    // 24px
  '8': '2rem',      // 32px
  '10': '2.5rem',   // 40px
  '12': '3rem',     // 48px
  '16': '4rem',     // 64px
  '20': '5rem',     // 80px
  '24': '6rem',     // 96px
  '32': '8rem',     // 128px
  '40': '10rem',    // 160px
  '48': '12rem',    // 192px
  '56': '14rem',    // 224px
  '64': '16rem',    // 256px
  
  // Semantic spacing
  section: {
    xs: '2rem',     // 32px
    sm: '3rem',     // 48px
    md: '4rem',     // 64px
    lg: '5rem',     // 80px
    xl: '6rem'      // 96px
  }
};

// ============= Border Radius System =============
export const borderRadiusTokens = {
  none: '0',
  sm: '0.125rem',   // 2px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px'
};

// ============= Shadow System =============
export const shadowTokens = {
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
  
  // Branded shadows
  dubai: '0 4px 20px rgba(0, 110, 109, 0.1)',
  dubaiLg: '0 8px 40px rgba(0, 110, 109, 0.15)',
  dubaiXl: '0 12px 60px rgba(0, 110, 109, 0.2)'
};

// ============= Animation System =============
export const animationTokens = {
  duration: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    slower: '500ms'
  },
  
  easing: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    elastic: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'
  }
};

// ============= Breakpoint System =============
export const breakpointTokens = {
  xs: '475px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
};

// ============= Component Tokens =============
export const componentTokens = {
  button: {
    height: {
      sm: '2rem',      // 32px
      md: '2.5rem',    // 40px
      lg: '3rem',      // 48px
      xl: '3.5rem'     // 56px
    },
    padding: {
      sm: '0.5rem 0.75rem',
      md: '0.625rem 1rem',
      lg: '0.75rem 1.5rem',
      xl: '1rem 2rem'
    },
    minWidth: '44px' // Accessibility requirement
  },
  
  input: {
    height: '3rem',   // 48px
    padding: '0.75rem 1rem',
    borderWidth: '1px'
  },
  
  card: {
    padding: {
      sm: '1rem',
      md: '1.5rem',
      lg: '2rem'
    },
    borderWidth: '1px'
  }
};

// ============= Layout Tokens =============
export const layoutTokens = {
  container: {
    maxWidth: '1280px',
    padding: {
      mobile: '1rem',
      tablet: '1.5rem',
      desktop: '2rem'
    }
  },
  
  grid: {
    columns: {
      mobile: 1,
      tablet: 2,
      desktop: 3,
      wide: 4
    },
    gap: {
      sm: '1rem',
      md: '1.5rem',
      lg: '2rem'
    }
  },
  
  navigation: {
    height: '4rem',   // 64px
    zIndex: 1000
  },
  
  sidebar: {
    width: '16rem',   // 256px
    collapsedWidth: '4rem' // 64px
  }
};

// ============= Design Patterns =============
export const designPatterns = {
  // Pattern Group 1: Government/Administrative (Education, some Career)
  group1: {
    colorScheme: 'teal-focused',
    primaryColor: colorTokens.primary.teal,
    accentColor: colorTokens.primary.lightTeal,
    style: 'formal',
    interactionLevel: 'standard',
    visualComplexity: 'minimal'
  },
  
  // Pattern Group 2: Innovation/Exploration (Career, Professional, Lifelong)
  group2: {
    colorScheme: 'multi-color',
    primaryColor: colorTokens.phases.career.primary,
    accentColor: colorTokens.phases.career.accent,
    style: 'modern',
    interactionLevel: 'enhanced',
    visualComplexity: 'moderate'
  }
};

// ============= Main Design Tokens Export =============
export const designTokens = {
  colors: colorTokens,
  typography: typographyTokens,
  spacing: spacingTokens,
  borderRadius: borderRadiusTokens,
  shadows: shadowTokens,
  animations: animationTokens,
  breakpoints: breakpointTokens,
  components: componentTokens,
  layout: layoutTokens,
  patterns: designPatterns
};

// Individual token categories are already exported above
