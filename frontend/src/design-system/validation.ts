/**
 * Design System Validation
 * Tools and utilities for validating design system compliance
 */

import { designTokens } from './tokens';
import { designGuidelines } from './guidelines';

// ============= Validation Types =============
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  score: number; // 0-100
}

export interface ValidationError {
  type: 'color' | 'typography' | 'spacing' | 'accessibility' | 'component';
  message: string;
  element?: string;
  severity: 'high' | 'medium' | 'low';
  suggestion?: string;
}

export interface ValidationWarning {
  type: 'color' | 'typography' | 'spacing' | 'accessibility' | 'component';
  message: string;
  element?: string;
  suggestion?: string;
}

// ============= Color Validation =============
class ColorValidator {
  private validColors = new Set([
    ...Object.values(designTokens.colors.primary),
    ...Object.values(designTokens.colors.semantic),
    ...Object.values(designTokens.colors.neutral)
  ]);

  validateColor(color: string): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check if color is from design system
    if (!this.validColors.has(color as any) && !this.isValidUtilityClass(color)) {
      errors.push({
        type: 'color',
        message: `Color "${color}" is not part of the design system`,
        severity: 'medium',
        suggestion: 'Use colors from designTokens.colors or semantic utility classes'
      });
    }

    // Check contrast ratio (simplified validation)
    if (this.isLowContrast(color)) {
      errors.push({
        type: 'accessibility',
        message: `Color "${color}" may not meet accessibility contrast requirements`,
        severity: 'high',
        suggestion: 'Use higher contrast colors for text and important UI elements'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: this.calculateScore(errors, warnings)
    };
  }

  private isValidUtilityClass(color: string): boolean {
    const validPrefixes = [
      'text-ehrdc-', 'bg-ehrdc-', 'border-ehrdc-',
      'text-blue-', 'bg-blue-', 'border-blue-',
      'text-green-', 'bg-green-', 'border-green-',
      'text-red-', 'bg-red-', 'border-red-',
      'text-orange-', 'bg-orange-', 'border-orange-'
    ];
    
    return validPrefixes.some(prefix => color.startsWith(prefix));
  }

  private isLowContrast(color: string): boolean {
    // Simplified contrast check - in real implementation, 
    // calculate actual contrast ratios
    const lowContrastColors = ['#CCCCCC', '#DDDDDD', '#EEEEEE'];
    return lowContrastColors.includes(color);
  }

  private calculateScore(errors: ValidationError[], warnings: ValidationWarning[]): number {
    const errorPenalty = errors.reduce((penalty, error) => {
      return penalty + (error.severity === 'high' ? 20 : error.severity === 'medium' ? 10 : 5);
    }, 0);

    const warningPenalty = warnings.length * 2;
    
    return Math.max(0, 100 - errorPenalty - warningPenalty);
  }
}

// ============= Typography Validation =============
class TypographyValidator {
  private validFontSizes = new Set(Object.values(designTokens.typography.fontSize));
  private validFontWeights = new Set(Object.values(designTokens.typography.fontWeight));

  validateTypography(element: {
    fontSize?: string;
    fontWeight?: string;
    lineHeight?: string;
    fontFamily?: string;
  }): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Validate font size
    if (element.fontSize && !this.validFontSizes.has(element.fontSize as any)) {
      errors.push({
        type: 'typography',
        message: `Font size "${element.fontSize}" is not part of the design system`,
        severity: 'medium',
        suggestion: 'Use font sizes from designTokens.typography.fontSize'
      });
    }

    // Validate font weight
    if (element.fontWeight && !this.validFontWeights.has(element.fontWeight as any)) {
      errors.push({
        type: 'typography',
        message: `Font weight "${element.fontWeight}" is not part of the design system`,
        severity: 'low',
        suggestion: 'Use font weights from designTokens.typography.fontWeight'
      });
    }

    // Check for proper heading hierarchy
    if (this.isHeadingElement(element) && !this.hasProperHierarchy(element)) {
      warnings.push({
        type: 'typography',
        message: 'Heading hierarchy may not be properly structured',
        suggestion: 'Ensure headings follow logical h1 > h2 > h3 structure'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: this.calculateScore(errors, warnings)
    };
  }

  private isHeadingElement(element: any): boolean {
    // Check if element has heading characteristics
    return element.fontSize && ['2.25rem', '1.875rem', '1.5rem'].includes(element.fontSize);
  }

  private hasProperHierarchy(element: any): boolean {
    // Simplified hierarchy check - real implementation would analyze DOM structure
    return true;
  }

  private calculateScore(errors: ValidationError[], warnings: ValidationWarning[]): number {
    const errorPenalty = errors.reduce((penalty, error) => {
      return penalty + (error.severity === 'high' ? 20 : error.severity === 'medium' ? 10 : 5);
    }, 0);

    const warningPenalty = warnings.length * 2;
    
    return Math.max(0, 100 - errorPenalty - warningPenalty);
  }
}

// ============= Spacing Validation =============
class SpacingValidator {
  private validSpacing = new Set(Object.values(designTokens.spacing));

  validateSpacing(spacing: string): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check if spacing follows design system
    if (!this.validSpacing.has(spacing as any) && !this.isValidSpacingClass(spacing)) {
      errors.push({
        type: 'spacing',
        message: `Spacing value "${spacing}" is not part of the design system`,
        severity: 'medium',
        suggestion: 'Use spacing tokens from designTokens.spacing'
      });
    }

    // Check for inconsistent spacing patterns
    if (this.isInconsistentSpacing(spacing)) {
      warnings.push({
        type: 'spacing',
        message: 'Spacing may not follow consistent patterns',
        suggestion: 'Use multiples of base spacing unit (4px/8px)'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: this.calculateScore(errors, warnings)
    };
  }

  private isValidSpacingClass(spacing: string): boolean {
    const validPrefixes = ['p-', 'px-', 'py-', 'pt-', 'pb-', 'pl-', 'pr-', 'm-', 'mx-', 'my-', 'mt-', 'mb-', 'ml-', 'mr-'];
    return validPrefixes.some(prefix => spacing.startsWith(prefix));
  }

  private isInconsistentSpacing(spacing: string): boolean {
    // Check for non-standard spacing values
    const nonStandardValues = ['3px', '5px', '7px', '9px', '11px', '13px', '15px'];
    return nonStandardValues.some(value => spacing.includes(value));
  }

  private calculateScore(errors: ValidationError[], warnings: ValidationWarning[]): number {
    const errorPenalty = errors.reduce((penalty, error) => {
      return penalty + (error.severity === 'high' ? 20 : error.severity === 'medium' ? 10 : 5);
    }, 0);

    const warningPenalty = warnings.length * 2;
    
    return Math.max(0, 100 - errorPenalty - warningPenalty);
  }
}

// ============= Component Validation =============
class ComponentValidator {
  validateComponent(component: {
    type: string;
    props?: Record<string, any>;
    className?: string;
  }): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Validate button components
    if (component.type === 'button') {
      this.validateButton(component, errors, warnings);
    }

    // Validate card components
    if (component.type === 'card') {
      this.validateCard(component, errors, warnings);
    }

    // Validate form components
    if (['input', 'textarea', 'select'].includes(component.type)) {
      this.validateFormField(component, errors, warnings);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: this.calculateScore(errors, warnings)
    };
  }

  private validateButton(
    component: any, 
    errors: ValidationError[], 
    warnings: ValidationWarning[]
  ): void {
    // Check for proper button styling
    if (!component.className?.includes('ds-button') && 
        !component.className?.includes('gov-action-button')) {
      warnings.push({
        type: 'component',
        message: 'Button should use design system button classes',
        suggestion: 'Use ds-button or gov-action-button utility classes'
      });
    }

    // Check for accessibility
    if (!component.props?.['aria-label'] && !component.props?.children) {
      errors.push({
        type: 'accessibility',
        message: 'Button missing accessible label',
        severity: 'high',
        suggestion: 'Add aria-label or descriptive text content'
      });
    }

    // Check for minimum touch target
    if (!this.hasTouchTarget(component)) {
      errors.push({
        type: 'accessibility',
        message: 'Button may not meet minimum touch target size',
        severity: 'medium',
        suggestion: 'Ensure minimum 44px touch target size'
      });
    }
  }

  private validateCard(
    component: any, 
    errors: ValidationError[], 
    warnings: ValidationWarning[]
  ): void {
    // Check for proper card styling
    if (!component.className?.includes('ds-card') && 
        !component.className?.includes('gov-service-card')) {
      warnings.push({
        type: 'component',
        message: 'Card should use design system card classes',
        suggestion: 'Use ds-card or gov-service-card utility classes'
      });
    }
  }

  private validateFormField(
    component: any, 
    errors: ValidationError[], 
    warnings: ValidationWarning[]
  ): void {
    // Check for proper form field styling
    if (!component.className?.includes('ds-input') && 
        !component.className?.includes('gov-form-field')) {
      warnings.push({
        type: 'component',
        message: 'Form field should use design system input classes',
        suggestion: 'Use ds-input or gov-form-field utility classes'
      });
    }

    // Check for labels
    if (!component.props?.['aria-label'] && !component.props?.id) {
      errors.push({
        type: 'accessibility',
        message: 'Form field missing proper labeling',
        severity: 'high',
        suggestion: 'Add aria-label or associate with a label element'
      });
    }
  }

  private hasTouchTarget(component: any): boolean {
    // Simplified check - real implementation would measure actual dimensions
    return component.className?.includes('touch-target') ||
           component.className?.includes('min-h-11') ||
           component.className?.includes('h-11') ||
           component.className?.includes('h-12');
  }

  private calculateScore(errors: ValidationError[], warnings: ValidationWarning[]): number {
    const errorPenalty = errors.reduce((penalty, error) => {
      return penalty + (error.severity === 'high' ? 20 : error.severity === 'medium' ? 10 : 5);
    }, 0);

    const warningPenalty = warnings.length * 2;
    
    return Math.max(0, 100 - errorPenalty - warningPenalty);
  }
}

// ============= Main Design System Validator =============
class DesignSystemValidator {
  private colorValidator = new ColorValidator();
  private typographyValidator = new TypographyValidator();
  private spacingValidator = new SpacingValidator();
  private componentValidator = new ComponentValidator();

  validatePage(pageData: {
    colors?: string[];
    typography?: any[];
    spacing?: string[];
    components?: any[];
  }): ValidationResult {
    const allErrors: ValidationError[] = [];
    const allWarnings: ValidationWarning[] = [];

    // Validate colors
    if (pageData.colors) {
      pageData.colors.forEach(color => {
        const result = this.colorValidator.validateColor(color);
        allErrors.push(...result.errors);
        allWarnings.push(...result.warnings);
      });
    }

    // Validate typography
    if (pageData.typography) {
      pageData.typography.forEach(typo => {
        const result = this.typographyValidator.validateTypography(typo);
        allErrors.push(...result.errors);
        allWarnings.push(...result.warnings);
      });
    }

    // Validate spacing
    if (pageData.spacing) {
      pageData.spacing.forEach(spacing => {
        const result = this.spacingValidator.validateSpacing(spacing);
        allErrors.push(...result.errors);
        allWarnings.push(...result.warnings);
      });
    }

    // Validate components
    if (pageData.components) {
      pageData.components.forEach(component => {
        const result = this.componentValidator.validateComponent(component);
        allErrors.push(...result.errors);
        allWarnings.push(...result.warnings);
      });
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
      score: this.calculateOverallScore(allErrors, allWarnings)
    };
  }

  private calculateOverallScore(errors: ValidationError[], warnings: ValidationWarning[]): number {
    const errorPenalty = errors.reduce((penalty, error) => {
      return penalty + (error.severity === 'high' ? 15 : error.severity === 'medium' ? 8 : 3);
    }, 0);

    const warningPenalty = warnings.length * 1.5;
    
    return Math.max(0, 100 - errorPenalty - warningPenalty);
  }

  generateReport(validationResult: ValidationResult): string {
    const { isValid, errors, warnings, score } = validationResult;

    let report = `Design System Validation Report\n`;
    report += `=====================================\n`;
    report += `Overall Score: ${score}/100\n`;
    report += `Status: ${isValid ? 'VALID' : 'INVALID'}\n\n`;

    if (errors.length > 0) {
      report += `Errors (${errors.length}):\n`;
      errors.forEach((error, index) => {
        report += `${index + 1}. [${error.severity.toUpperCase()}] ${error.message}\n`;
        if (error.suggestion) {
          report += `   Suggestion: ${error.suggestion}\n`;
        }
        report += `\n`;
      });
    }

    if (warnings.length > 0) {
      report += `Warnings (${warnings.length}):\n`;
      warnings.forEach((warning, index) => {
        report += `${index + 1}. ${warning.message}\n`;
        if (warning.suggestion) {
          report += `   Suggestion: ${warning.suggestion}\n`;
        }
        report += `\n`;
      });
    }

    if (errors.length === 0 && warnings.length === 0) {
      report += `✅ No issues found! Your design follows the design system guidelines.\n`;
    }

    return report;
  }
}

// Export validation utilities
const designSystemValidator = new DesignSystemValidator();

export { 
  ColorValidator, 
  TypographyValidator, 
  SpacingValidator, 
  ComponentValidator,
  DesignSystemValidator,
  designSystemValidator
};
