# Code Quality Standards

## Overview

This document outlines the code quality standards and practices for the Mawred platform.

## TypeScript Standards

### Type Safety
- **NO `any` types** - Use proper type definitions
- Use strict TypeScript configuration
- Prefer `unknown` over `any` when type is truly unknown
- Use type assertions sparingly and with type guards

```typescript
// ✅ Good
interface User {
  id: string;
  email: string;
  roles: UserRole[];
}

// ❌ Bad
interface User {
  id: any;
  email: any;
  roles: any[];
}
```

### Function Signatures
- All public functions must have explicit return types
- Use JSDoc comments for complex functions
- Prefer readonly arrays and objects where applicable

```typescript
/**
 * Validates user authentication and returns user data
 * @param token - JWT authentication token
 * @returns Promise resolving to user data or null if invalid
 */
export async function validateUser(token: string): Promise<User | null> {
  // Implementation
}
```

## Component Standards

### React Components
- Use TypeScript interfaces for props
- Implement proper error boundaries
- Use semantic HTML elements
- Follow accessibility guidelines (WCAG 2.1 AA)

```typescript
interface ButtonProps {
  readonly variant: 'primary' | 'secondary' | 'danger';
  readonly size: 'sm' | 'md' | 'lg';
  readonly disabled?: boolean;
  readonly children: React.ReactNode;
  readonly onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

export const Button: React.FC<ButtonProps> = ({
  variant,
  size,
  disabled = false,
  children,
  onClick,
}) => {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(buttonVariants({ variant, size }))}
      aria-disabled={disabled}
    >
      {children}
    </button>
  );
};
```

### Styling Guidelines
- Use semantic design tokens from `index.css`
- Avoid hardcoded colors - use CSS custom properties
- Follow mobile-first responsive design
- Use Tailwind utility classes consistently

```css
/* ✅ Good - Using semantic tokens */
.button-primary {
  background-color: var(--primary);
  color: var(--primary-foreground);
}

/* ❌ Bad - Hardcoded colors */
.button-primary {
  background-color: #007bff;
  color: white;
}
```

## Performance Standards

### Core Web Vitals Targets
- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1
- **FCP (First Contentful Paint)**: < 1.8s
- **TTFB (Time to First Byte)**: < 800ms

### Code Splitting
- Implement route-based code splitting
- Lazy load non-critical components
- Use dynamic imports for large dependencies

```typescript
// ✅ Good - Lazy loading
const LazyComponent = React.lazy(() => import('./HeavyComponent'));

// ✅ Good - Code splitting
const routes = [
  {
    path: '/dashboard',
    component: React.lazy(() => import('./pages/Dashboard')),
  },
];
```

## Testing Standards

### Unit Tests
- Minimum 80% code coverage
- Test all public functions and components
- Use meaningful test descriptions
- Follow AAA pattern (Arrange, Act, Assert)

```typescript
describe('Button Component', () => {
  it('should render with correct variant class', () => {
    // Arrange
    const variant = 'primary';
    
    // Act
    render(<Button variant={variant}>Click me</Button>);
    
    // Assert
    expect(screen.getByRole('button')).toHaveClass('bg-primary');
  });
});
```

### Integration Tests
- Test complete user workflows
- Test API integrations
- Test error scenarios
- Use realistic test data

### E2E Tests
- Test critical user journeys
- Test across multiple browsers
- Test responsive layouts
- Include accessibility checks

## Security Standards

### Input Validation
- Validate all user inputs
- Use Zod for runtime type checking
- Sanitize data before database operations
- Implement rate limiting for sensitive operations

```typescript
const userSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['user', 'admin', 'moderator']),
});

export function validateUserInput(input: unknown): User {
  return userSchema.parse(input);
}
```

### Authentication & Authorization
- Use secure token storage
- Implement proper session management
- Follow principle of least privilege
- Log security events

## Documentation Standards

### Code Documentation
- Use JSDoc for all public APIs
- Include examples in documentation
- Document complex business logic
- Keep documentation up to date

### README Requirements
- Clear setup instructions
- API documentation
- Architecture overview
- Contributing guidelines

### Architecture Decision Records (ADRs)
- Document significant technical decisions
- Include context, options considered, and rationale
- Store in `/docs/adr/` directory
- Follow ADR template format

## Git Standards

### Commit Messages
```
type(scope): subject

body

footer
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

### Branch Naming
- `feature/description`
- `bugfix/description`
- `hotfix/description`
- `release/version`

### Pull Request Requirements
- All CI checks must pass
- Code review required
- Documentation updated
- Tests included for new features

## Monitoring & Alerting

### Error Tracking
- All errors logged to Sentry
- Include relevant context
- Set up alerts for critical errors
- Monitor error rates and trends

### Performance Monitoring
- Track Core Web Vitals
- Monitor bundle size changes
- Set up performance budgets
- Alert on performance regressions

## Accessibility Standards

### WCAG 2.1 AA Compliance
- Proper semantic HTML
- Keyboard navigation support
- Screen reader compatibility
- Color contrast compliance
- Focus management

### Testing
- Automated accessibility testing
- Manual testing with screen readers
- Keyboard-only navigation testing
- Color blindness testing

## Review Checklist

Before submitting code for review:

- [ ] TypeScript strict mode passes
- [ ] ESLint passes with no warnings
- [ ] Prettier formatting applied
- [ ] Tests written and passing
- [ ] Performance impact considered
- [ ] Accessibility requirements met
- [ ] Security implications reviewed
- [ ] Documentation updated
- [ ] Error handling implemented
- [ ] Mobile responsiveness verified