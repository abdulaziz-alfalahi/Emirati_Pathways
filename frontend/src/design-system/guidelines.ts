/**
 * Design System Guidelines
 * Comprehensive guidelines for the Dubai Government EHRDC platform
 * Ensuring consistency across all four citizen journey phases
 */

import { designTokens } from './tokens';

// ============= Core Design Principles =============
export const designGuidelines = {
  principles: {
    accessibility: {
      title: 'Accessibility First',
      description: 'All interfaces must meet WCAG 2.1 AA standards',
      requirements: [
        'Color contrast ratio minimum 4.5:1 for normal text',
        'Color contrast ratio minimum 3:1 for large text',
        'Touch targets minimum 44x44px',
        'Focus indicators clearly visible',
        'Screen reader compatibility',
        'Keyboard navigation support'
      ]
    },
    
    consistency: {
      title: 'Unified Experience',
      description: 'Maintain consistency across all phases while allowing phase-specific character',
      requirements: [
        'Use unified color system with phase variants',
        'Consistent typography hierarchy',
        'Standardized component behavior',
        'Unified interaction patterns',
        'Consistent spacing system'
      ]
    },
    
    responsiveness: {
      title: 'Multi-Device Excellence',
      description: 'Optimized experience across all devices and screen sizes',
      requirements: [
        'Mobile-first design approach',
        'Touch-friendly interactions',
        'Scalable typography',
        'Flexible layouts',
        'Performance optimization'
      ]
    },
    
    localization: {
      title: 'Arabic-English Excellence',
      description: 'Native support for both Arabic and English languages',
      requirements: [
        'RTL layout support',
        'Appropriate font selection',
        'Cultural sensitivity',
        'Text expansion considerations',
        'Direction-aware icons'
      ]
    }
  },
  
  phaseArchitecture: {
    title: 'Four-Phase Journey Design',
    description: 'Design system supporting citizen lifecycle from education to lifelong engagement',
    phases: {
      education: {
        name: 'Education Pathway',
        character: 'Foundational, structured, supportive',
        targetAudience: 'Students, parents, educators',
        designEmphasis: 'Clarity, guidance, trust-building'
      },
      career: {
        name: 'Career Entry',
        character: 'Professional, aspirational, opportunity-focused',
        targetAudience: 'Job seekers, graduates, career changers',
        designEmphasis: 'Professionalism, growth, achievement'
      },
      professional: {
        name: 'Professional Growth',
        character: 'Dynamic, innovative, skill-focused',
        targetAudience: 'Working professionals, entrepreneurs',
        designEmphasis: 'Innovation, networking, advancement'
      },
      lifelong: {
        name: 'Lifelong Engagement',
        character: 'Community-oriented, impactful, legacy-focused',
        targetAudience: 'Experienced professionals, community leaders',
        designEmphasis: 'Community, mentorship, giving back'
      }
    }
  }
};

// ============= Color Guidelines =============
export const colorGuidelines = {
  usage: {
    primary: {
      description: 'Primary brand colors for main actions and branding',
      usage: [
        'Primary buttons and CTAs',
        'Navigation active states',
        'Brand elements',
        'Key information highlights'
      ],
      accessibility: 'Ensure 4.5:1 contrast ratio with text'
    },
    
    semantic: {
      description: 'Colors that convey meaning and status',
      colors: {
        success: {
          color: designTokens.colors.semantic.success,
          usage: ['Success messages', 'Completed states', 'Positive indicators'],
          contrast: 'White or dark text depending on background'
        },
        error: {
          color: designTokens.colors.semantic.error,
          usage: ['Error messages', 'Required field indicators', 'Destructive actions'],
          contrast: 'White text recommended'
        },
        warning: {
          color: designTokens.colors.semantic.warning,
          usage: ['Warning messages', 'Caution indicators', 'Attention-needed states'],
          contrast: 'Dark text recommended'
        },
        info: {
          color: designTokens.colors.semantic.info,
          usage: ['Information messages', 'Help text', 'Neutral notifications'],
          contrast: 'White text recommended'
        }
      }
    },
    
    phases: {
      description: 'Phase-specific color applications',
      guidelines: [
        'Use phase colors for section headers and key elements',
        'Maintain EHRDC teal as the unified primary color',
        'Apply phase colors sparingly for accent and differentiation',
        'Ensure phase colors complement the overall design system'
      ]
    }
  },
  
  combinations: {
    recommended: [
      {
        name: 'Primary Combination',
        background: designTokens.colors.primary.teal,
        text: designTokens.colors.neutral.white,
        contrast: '12.6:1',
        usage: 'Primary buttons, headers'
      },
      {
        name: 'Light Background',
        background: designTokens.colors.neutral.light,
        text: designTokens.colors.neutral.dark,
        contrast: '15.8:1',
        usage: 'Card backgrounds, form fields'
      },
      {
        name: 'White Background',
        background: designTokens.colors.neutral.white,
        text: designTokens.colors.neutral.dark,
        contrast: '16.8:1',
        usage: 'Main content areas, modals'
      }
    ]
  }
};

// ============= Typography Guidelines =============
export const typographyGuidelines = {
  hierarchy: {
    display: {
      usage: 'Hero sections, major page titles',
      size: designTokens.typography.fontSize['6xl'],
      weight: designTokens.typography.fontWeight.bold,
      lineHeight: designTokens.typography.lineHeight.tight,
      guidelines: ['Use sparingly', 'Ensure sufficient contrast', 'Consider mobile scaling']
    },
    
    h1: {
      usage: 'Primary page headings',
      size: designTokens.typography.fontSize['4xl'],
      weight: designTokens.typography.fontWeight.bold,
      lineHeight: designTokens.typography.lineHeight.snug,
      guidelines: ['One per page recommended', 'Clear hierarchy', 'Descriptive and concise']
    },
    
    h2: {
      usage: 'Major section headings',
      size: designTokens.typography.fontSize['3xl'],
      weight: designTokens.typography.fontWeight.semibold,
      lineHeight: designTokens.typography.lineHeight.normal,
      guidelines: ['Logical hierarchy', 'Scannable content', 'Consistent spacing']
    },
    
    h3: {
      usage: 'Subsection headings',
      size: designTokens.typography.fontSize['2xl'],
      weight: designTokens.typography.fontWeight.semibold,
      lineHeight: designTokens.typography.lineHeight.normal,
      guidelines: ['Support content structure', 'Clear relationship to parent', 'Balanced spacing']
    },
    
    body: {
      usage: 'Main content text',
      size: designTokens.typography.fontSize.base,
      weight: designTokens.typography.fontWeight.normal,
      lineHeight: designTokens.typography.lineHeight.relaxed,
      guidelines: ['Optimized for readability', 'Consistent line height', 'Appropriate contrast']
    },
    
    caption: {
      usage: 'Secondary information, labels',
      size: designTokens.typography.fontSize.sm,
      weight: designTokens.typography.fontWeight.medium,
      lineHeight: designTokens.typography.lineHeight.normal,
      guidelines: ['Support primary content', 'Clear hierarchy', 'Sufficient contrast']
    }
  },
  
  accessibility: {
    requirements: [
      'Minimum 16px base font size for body text',
      'Line height minimum 1.5 for paragraph text',
      'Sufficient color contrast (4.5:1 for normal text)',
      'Scalable typography that responds to user preferences',
      'Clear visual hierarchy for screen readers'
    ]
  },
  
  multilingual: {
    arabic: {
      fontFamily: designTokens.typography.fontFamily.arabic,
      direction: 'rtl',
      considerations: [
        'Right-to-left text flow',
        'Appropriate Arabic font selection',
        'Text expansion allowances (Arabic typically 20-30% longer)',
        'Direction-sensitive layouts'
      ]
    },
    english: {
      fontFamily: designTokens.typography.fontFamily.primary,
      direction: 'ltr',
      considerations: [
        'Left-to-right text flow',
        'Optimized for digital reading',
        'Cross-platform consistency'
      ]
    }
  }
};

// ============= Spacing Guidelines =============
export const spacingGuidelines = {
  system: {
    base: '4px',
    scale: 'Multiples of 4px for consistency',
    philosophy: 'Predictable, mathematical spacing creates visual rhythm'
  },
  
  application: {
    components: {
      tight: designTokens.spacing['2'],     // 8px - Between related elements
      normal: designTokens.spacing['4'],    // 16px - Standard component spacing
      loose: designTokens.spacing['6']      // 24px - Between different components
    },
    
    sections: {
      small: designTokens.spacing.section.sm,   // 48px - Compact sections
      medium: designTokens.spacing.section.md,  // 64px - Standard sections
      large: designTokens.spacing.section.lg    // 80px - Major sections
    },
    
    layouts: {
      container: designTokens.layout.container.padding,
      grid: designTokens.layout.grid.gap
    }
  },
  
  responsive: {
    mobile: 'Reduce spacing by 25-50% on mobile devices',
    tablet: 'Standard spacing with minor adjustments',
    desktop: 'Full spacing scale for optimal reading experience'
  }
};

// ============= Component Guidelines =============
export const componentGuidelines = {
  buttons: {
    hierarchy: {
      primary: {
        usage: 'Main actions, form submissions',
        styling: 'Filled background, high contrast',
        guidelines: ['One primary button per section', 'Clear action labeling', 'Prominent placement']
      },
      secondary: {
        usage: 'Alternative actions, secondary flows',
        styling: 'Outlined or subtle background',
        guidelines: ['Support primary actions', 'Clear hierarchy', 'Complementary styling']
      },
      tertiary: {
        usage: 'Minor actions, links',
        styling: 'Text-based, minimal styling',
        guidelines: ['Lowest visual weight', 'Clear affordance', 'Accessible contrast']
      }
    },
    
    accessibility: [
      'Minimum 44x44px touch target',
      'Clear focus indicators',
      'Descriptive labels',
      'Loading states for async actions',
      'Disabled state clarity'
    ]
  },
  
  forms: {
    fields: {
      height: designTokens.components.input.height,
      padding: designTokens.components.input.padding,
      guidelines: [
        'Consistent field heights',
        'Clear labels and descriptions',
        'Error state indicators',
        'Success feedback',
        'Keyboard navigation support'
      ]
    },
    
    validation: {
      timing: 'Real-time validation for better UX',
      display: 'Clear, helpful error messages',
      styling: 'Distinct error states without relying on color alone'
    }
  },
  
  cards: {
    variants: {
      basic: 'Simple content containers',
      interactive: 'Clickable cards with hover states',
      elevated: 'Prominent cards with enhanced shadows'
    },
    
    content: [
      'Clear content hierarchy',
      'Consistent padding',
      'Logical information organization',
      'Appropriate call-to-action placement'
    ]
  }
};

// ============= Layout Guidelines =============
export const layoutGuidelines = {
  grid: {
    system: 'CSS Grid and Flexbox hybrid approach',
    breakpoints: designTokens.breakpoints,
    columns: {
      mobile: 1,
      tablet: 2,
      desktop: 3,
      wide: 4
    },
    
    principles: [
      'Mobile-first responsive design',
      'Flexible, content-aware layouts',
      'Consistent gutter spacing',
      'Logical content flow'
    ]
  },
  
  containers: {
    maxWidth: designTokens.layout.container.maxWidth,
    padding: designTokens.layout.container.padding,
    principles: [
      'Centered content for optimal reading',
      'Responsive padding adjustments',
      'Clear content boundaries'
    ]
  },
  
  navigation: {
    height: designTokens.layout.navigation.height,
    principles: [
      'Consistent navigation placement',
      'Clear current page indication',
      'Mobile-friendly interactions',
      'Logical information architecture'
    ]
  }
};

// ============= Pattern Selection Guidelines =============
export const patternSelectionGuidelines = {
  group1: {
    name: 'Government Standard',
    phases: ['Education Pathway'],
    characteristics: [
      'Formal, trustworthy design language',
      'EHRDC teal primary color',
      'Structured, hierarchical layouts',
      'Minimal visual complexity',
      'Clear, direct messaging'
    ],
    usage: 'Government services, official processes, educational content'
  },
  
  group2: {
    name: 'Innovation Focus',
    phases: ['Career Entry', 'Professional Growth', 'Lifelong Engagement'],
    characteristics: [
      'Modern, dynamic design language',
      'Multi-color accent system',
      'Flexible, adaptive layouts',
      'Enhanced interactivity',
      'Inspiring, growth-oriented messaging'
    ],
    usage: 'Career development, professional networking, innovation programs'
  }
};

// ============= Accessibility Guidelines =============
export const accessibilityGuidelines = {
  standards: {
    compliance: 'WCAG 2.1 AA',
    testing: 'Regular automated and manual testing',
    documentation: 'Accessibility compliance documentation required'
  },
  
  colorContrast: {
    normalText: '4.5:1 minimum ratio',
    largeText: '3:1 minimum ratio (18pt or 14pt bold)',
    nonTextElements: '3:1 minimum ratio for UI components',
    testing: 'Use automated tools and manual verification'
  },
  
  keyboard: {
    navigation: 'All interactive elements keyboard accessible',
    focusManagement: 'Logical focus order and visible indicators',
    shortcuts: 'Standard keyboard shortcuts supported',
    traps: 'Focus traps for modal dialogs'
  },
  
  screenReaders: {
    markup: 'Semantic HTML structure',
    labels: 'Descriptive labels for all form elements',
    headings: 'Logical heading hierarchy',
    landmarks: 'ARIA landmarks for page sections'
  },
  
  testing: {
    automated: [
      'axe-core integration',
      'Lighthouse accessibility audits',
      'Color contrast analyzers',
      'Keyboard navigation testing'
    ],
    manual: [
      'Screen reader testing',
      'Keyboard-only navigation',
      'High contrast mode testing',
      'Mobile accessibility testing'
    ]
  }
};

// ============= Best Practices =============
export const bestPractices = {
  implementation: {
    consistency: [
      'Use design tokens instead of hard-coded values',
      'Follow established component patterns',
      'Maintain consistent spacing rhythms',
      'Apply unified interaction patterns'
    ],
    
    performance: [
      'Optimize images and assets',
      'Use efficient CSS methodologies',
      'Minimize bundle sizes',
      'Implement lazy loading where appropriate'
    ],
    
    maintenance: [
      'Document design decisions',
      'Version control design assets',
      'Regular design system updates',
      'Cross-team collaboration'
    ]
  },
  
  phaseCustomization: {
    guidelines: [
      'Maintain core design system integrity',
      'Use phase colors as accents, not replacements',
      'Ensure cross-phase navigation consistency',
      'Test phase transitions thoroughly'
    ],
    
    approved: [
      'Phase-specific color accents',
      'Contextual iconography',
      'Phase-appropriate messaging tone',
      'Targeted interaction patterns'
    ],
    
    restricted: [
      'Core typography modifications',
      'Base component structure changes',
      'Accessibility standard deviations',
      'Brand color replacements'
    ]
  }
};

// Individual guidelines are already exported above
