
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DubaiCard, DubaiCardContent, DubaiCardDescription, DubaiCardHeader, DubaiCardTitle } from '@/components/ui/dubai-card';
import { DubaiHeading } from '@/components/ui/dubai-heading';
import { DubaiSection } from '@/components/ui/dubai-section';
import { FormField } from '@/components/ui/form-field';
import { BackgroundPattern } from '@/components/ui/background-patterns';
import { AnimatedCard, LoadingSpinner, FormFeedback } from '@/components/ui/interactive-animations';
import { PageTransition } from '@/components/ui/page-transition';
import { 
  Palette, 
  Type, 
  Layout, 
  Zap, 
  Check, 
  Eye, 
  Smartphone, 
  Monitor, 
  Users,
  Star,
  Heart,
  Shield,
  Settings
} from 'lucide-react';

export const DesignSystemShowcase: React.FC = () => {
  const [selectedComponent, setSelectedComponent] = useState<string>('overview');
  const [formValues, setFormValues] = useState({
    email: '',
    consent: false,
    preference: '',
    country: ''
  });

  const sections = [
    { id: 'overview', label: 'Overview', icon: Eye },
    { id: 'colors', label: 'Colors', icon: Palette },
    { id: 'typography', label: 'Typography', icon: Type },
    { id: 'spacing', label: 'Spacing', icon: Layout },
    { id: 'buttons', label: 'Buttons', icon: Zap },
    { id: 'forms', label: 'Forms', icon: Settings },
    { id: 'cards', label: 'Cards', icon: Star },
    { id: 'patterns', label: 'Patterns', icon: Shield },
    { id: 'responsive', label: 'Responsive', icon: Smartphone }
  ];

  const renderOverview = () => (
    <div className="space-y-12">
      <div className="text-center">
        <DubaiHeading
          level={1}
          badge="EHRDC Design System"
          subtitle="A comprehensive design system following Dubai Government guidelines and EHRDC brand standards. Ensuring consistency, accessibility, and excellent user experience across the platform."
        >
          Design System Documentation
        </DubaiHeading>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <DubaiCard variant="service" interactive>
          <DubaiCardHeader>
            <DubaiCardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-ehrdc-teal" />
              Accessibility First
            </DubaiCardTitle>
            <DubaiCardDescription>
              WCAG 2.1 AA compliant with focus management, color contrast, and screen reader support.
            </DubaiCardDescription>
          </DubaiCardHeader>
        </DubaiCard>

        <DubaiCard variant="service" interactive>
          <DubaiCardHeader>
            <DubaiCardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-ehrdc-teal" />
              Mobile Responsive
            </DubaiCardTitle>
            <DubaiCardDescription>
              Designed for all devices with touch-friendly interactions and scalable interfaces.
            </DubaiCardDescription>
          </DubaiCardHeader>
        </DubaiCard>

        <DubaiCard variant="service" interactive>
          <DubaiCardHeader>
            <DubaiCardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-ehrdc-teal" />
              Government Standards
            </DubaiCardTitle>
            <DubaiCardDescription>
              Follows Dubai Government design principles and EHRDC brand guidelines.
            </DubaiCardDescription>
          </DubaiCardHeader>
        </DubaiCard>
      </div>
    </div>
  );

  const renderColors = () => (
    <div className="space-y-8">
      <DubaiHeading level={2} subtitle="EHRDC color palette following Dubai Government standards">
        Color System
      </DubaiHeading>

      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold mb-4 text-ehrdc-neutral-dark">Primary Colors</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="w-full h-24 bg-ehrdc-teal rounded-lg flex items-center justify-center">
                <span className="text-white font-medium">#006E6D</span>
              </div>
              <p className="text-sm font-medium">EHRDC Teal (Primary)</p>
              <p className="text-xs text-ehrdc-neutral-dark/70">Main brand color</p>
            </div>
            <div className="space-y-2">
              <div className="w-full h-24 bg-ehrdc-dark-teal rounded-lg flex items-center justify-center">
                <span className="text-white font-medium">#005A59</span>
              </div>
              <p className="text-sm font-medium">EHRDC Dark Teal</p>
              <p className="text-xs text-ehrdc-neutral-dark/70">Hover states</p>
            </div>
            <div className="space-y-2">
              <div className="w-full h-24 bg-ehrdc-light-teal rounded-lg flex items-center justify-center">
                <span className="text-ehrdc-neutral-dark font-medium">#4A9B9A</span>
              </div>
              <p className="text-sm font-medium">EHRDC Light Teal</p>
              <p className="text-xs text-ehrdc-neutral-dark/70">Accent color</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-4 text-ehrdc-neutral-dark">Neutral Colors</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="w-full h-24 bg-ehrdc-neutral-dark rounded-lg flex items-center justify-center">
                <span className="text-white font-medium">#1A1A1A</span>
              </div>
              <p className="text-sm font-medium">Neutral Dark</p>
              <p className="text-xs text-ehrdc-neutral-dark/70">Text color</p>
            </div>
            <div className="space-y-2">
              <div className="w-full h-24 bg-ehrdc-neutral-light rounded-lg flex items-center justify-center border">
                <span className="text-ehrdc-neutral-dark font-medium">#F5F5F5</span>
              </div>
              <p className="text-sm font-medium">Neutral Light</p>
              <p className="text-xs text-ehrdc-neutral-dark/70">Background color</p>
            </div>
            <div className="space-y-2">
              <div className="w-full h-24 bg-white rounded-lg flex items-center justify-center border">
                <span className="text-ehrdc-neutral-dark font-medium">#FFFFFF</span>
              </div>
              <p className="text-sm font-medium">White</p>
              <p className="text-xs text-ehrdc-neutral-dark/70">Card backgrounds</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-4 text-ehrdc-neutral-dark">Semantic Colors</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="w-full h-20 bg-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-medium">Success</span>
              </div>
              <p className="text-sm font-medium">#16A34A</p>
            </div>
            <div className="space-y-2">
              <div className="w-full h-20 bg-red-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-medium">Error</span>
              </div>
              <p className="text-sm font-medium">#EF4444</p>
            </div>
            <div className="space-y-2">
              <div className="w-full h-20 bg-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-medium">Warning</span>
              </div>
              <p className="text-sm font-medium">#F97316</p>
            </div>
            <div className="space-y-2">
              <div className="w-full h-20 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-medium">Info</span>
              </div>
              <p className="text-sm font-medium">#3B82F6</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTypography = () => (
    <div className="space-y-8">
      <DubaiHeading level={2} subtitle="Typography scale and usage guidelines">
        Typography System
      </DubaiHeading>

      <div className="space-y-8">
        <div>
          <h3 className="text-xl font-semibold mb-6 text-ehrdc-neutral-dark">Font Family</h3>
          <div className="p-6 bg-white rounded-lg border">
            <p className="text-2xl font-medium mb-2">Inter Font Family</p>
            <p className="text-ehrdc-neutral-dark/70 mb-4">Primary font for all text content</p>
            <div className="space-y-2 text-sm">
              <p><span className="font-normal">Regular (400):</span> Body text, descriptions</p>
              <p><span className="font-medium">Medium (500):</span> Labels, captions</p>
              <p><span className="font-semibold">Semibold (600):</span> Subheadings</p>
              <p><span className="font-bold">Bold (700):</span> Headings, emphasis</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-6 text-ehrdc-neutral-dark">Heading Scale</h3>
          <div className="space-y-6">
            <div className="p-6 bg-white rounded-lg border">
              <h1 className="dubai-text-display text-ehrdc-neutral-dark mb-2">Display Text</h1>
              <p className="text-sm text-ehrdc-neutral-dark/70">64px-96px / Bold / Line height 1.1</p>
            </div>
            <div className="p-6 bg-white rounded-lg border">
              <h1 className="dubai-text-heading-1 text-ehrdc-neutral-dark mb-2">Heading 1</h1>
              <p className="text-sm text-ehrdc-neutral-dark/70">40px-64px / Bold / Line height 1.2</p>
            </div>
            <div className="p-6 bg-white rounded-lg border">
              <h2 className="dubai-text-heading-2 text-ehrdc-neutral-dark mb-2">Heading 2</h2>
              <p className="text-sm text-ehrdc-neutral-dark/70">32px-48px / Semibold / Line height 1.3</p>
            </div>
            <div className="p-6 bg-white rounded-lg border">
              <h3 className="dubai-text-heading-3 text-ehrdc-neutral-dark mb-2">Heading 3</h3>
              <p className="text-sm text-ehrdc-neutral-dark/70">24px-36px / Semibold / Line height 1.4</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-6 text-ehrdc-neutral-dark">Body Text</h3>
          <div className="space-y-4">
            <div className="p-6 bg-white rounded-lg border">
              <p className="dubai-text-body-large text-ehrdc-neutral-dark mb-2">
                Large body text for important content and introductions
              </p>
              <p className="text-sm text-ehrdc-neutral-dark/70">18px-20px / Regular / Line height 1.6</p>
            </div>
            <div className="p-6 bg-white rounded-lg border">
              <p className="dubai-text-body text-ehrdc-neutral-dark mb-2">
                Regular body text for main content areas and descriptions
              </p>
              <p className="text-sm text-ehrdc-neutral-dark/70">16px-18px / Regular / Line height 1.6</p>
            </div>
            <div className="p-6 bg-white rounded-lg border">
              <p className="dubai-text-caption text-ehrdc-neutral-dark mb-2">
                Caption text for labels, metadata, and secondary information
              </p>
              <p className="text-sm text-ehrdc-neutral-dark/70">14px-16px / Medium / Line height 1.5</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSpacing = () => (
    <div className="space-y-8">
      <DubaiHeading level={2} subtitle="Consistent spacing system for layouts and components">
        Spacing System
      </DubaiHeading>

      <div className="space-y-8">
        <div>
          <h3 className="text-xl font-semibold mb-6 text-ehrdc-neutral-dark">Base Scale (4px)</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 6, 8, 12, 16, 20, 24, 32, 40].map((size) => (
              <div key={size} className="p-4 bg-white rounded-lg border text-center">
                <div 
                  className="bg-ehrdc-teal/20 border-2 border-ehrdc-teal mx-auto mb-2"
                  style={{ width: `${size * 4}px`, height: `${size * 4}px` }}
                />
                <p className="text-sm font-medium">{size * 4}px</p>
                <p className="text-xs text-ehrdc-neutral-dark/70">space-{size}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-6 text-ehrdc-neutral-dark">Section Spacing</h3>
          <div className="space-y-4">
            <div className="p-6 bg-white rounded-lg border">
              <p className="font-medium mb-2">Small sections (32px-48px)</p>
              <p className="text-sm text-ehrdc-neutral-dark/70 mb-4">For compact content areas</p>
              <div className="h-12 bg-ehrdc-teal/10 rounded border-2 border-dashed border-ehrdc-teal/30"></div>
            </div>
            <div className="p-6 bg-white rounded-lg border">
              <p className="font-medium mb-2">Medium sections (48px-64px)</p>
              <p className="text-sm text-ehrdc-neutral-dark/70 mb-4">For standard content sections</p>
              <div className="h-16 bg-ehrdc-teal/10 rounded border-2 border-dashed border-ehrdc-teal/30"></div>
            </div>
            <div className="p-6 bg-white rounded-lg border">
              <p className="font-medium mb-2">Large sections (64px-80px)</p>
              <p className="text-sm text-ehrdc-neutral-dark/70 mb-4">For major page sections</p>
              <div className="h-20 bg-ehrdc-teal/10 rounded border-2 border-dashed border-ehrdc-teal/30"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderButtons = () => (
    <div className="space-y-8">
      <DubaiHeading level={2} subtitle="Button variants, sizes, and interaction states">
        Button Components
      </DubaiHeading>

      <div className="space-y-8">
        <div>
          <h3 className="text-xl font-semibold mb-6 text-ehrdc-neutral-dark">Button Variants</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium">Primary</h4>
              <Button variant="default">Primary Button</Button>
              <p className="text-sm text-ehrdc-neutral-dark/70">Main actions, CTAs</p>
            </div>
            <div className="space-y-4">
              <h4 className="font-medium">Secondary</h4>
              <Button variant="secondary">Secondary Button</Button>
              <p className="text-sm text-ehrdc-neutral-dark/70">Secondary actions</p>
            </div>
            <div className="space-y-4">
              <h4 className="font-medium">Outline</h4>
              <Button variant="outline">Outline Button</Button>
              <p className="text-sm text-ehrdc-neutral-dark/70">Alternative actions</p>
            </div>
            <div className="space-y-4">
              <h4 className="font-medium">Ghost</h4>
              <Button variant="ghost">Ghost Button</Button>
              <p className="text-sm text-ehrdc-neutral-dark/70">Subtle actions</p>
            </div>
            <div className="space-y-4">
              <h4 className="font-medium">Destructive</h4>
              <Button variant="destructive">Delete</Button>
              <p className="text-sm text-ehrdc-neutral-dark/70">Destructive actions</p>
            </div>
            <div className="space-y-4">
              <h4 className="font-medium">Success</h4>
              <Button variant="success">Success</Button>
              <p className="text-sm text-ehrdc-neutral-dark/70">Positive actions</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-6 text-ehrdc-neutral-dark">Button Sizes</h3>
          <div className="flex flex-wrap items-center gap-4">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button size="xl">Extra Large</Button>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-6 text-ehrdc-neutral-dark">States</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button>Normal</Button>
            <Button loading>Loading</Button>
            <Button disabled>Disabled</Button>
            <Button variant="outline" className="hover:bg-ehrdc-teal hover:text-white">Hover Me</Button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderForms = () => (
    <div className="space-y-8">
      <DubaiHeading level={2} subtitle="Form components with validation and accessibility">
        Form Components
      </DubaiHeading>

      <div className="space-y-8">
        <div className="max-w-2xl">
          <h3 className="text-xl font-semibold mb-6 text-ehrdc-neutral-dark">Form Elements</h3>
          <div className="space-y-6">
            <FormField 
              label="Email Address" 
              description="Enter your work email address"
              required
            >
              <Input 
                type="email" 
                placeholder="john.doe@company.ae"
                value={formValues.email}
                onChange={(e) => setFormValues(prev => ({ ...prev, email: e.target.value }))}
              />
            </FormField>

            <FormField label="Country Selection">
              <Select value={formValues.country} onValueChange={(value) => setFormValues(prev => ({ ...prev, country: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ae">United Arab Emirates</SelectItem>
                  <SelectItem value="sa">Saudi Arabia</SelectItem>
                  <SelectItem value="qa">Qatar</SelectItem>
                  <SelectItem value="kw">Kuwait</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Notification Preferences">
              <RadioGroup value={formValues.preference} onValueChange={(value) => setFormValues(prev => ({ ...prev, preference: value }))}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="email" id="email" />
                  <Label htmlFor="email">Email notifications</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="sms" id="sms" />
                  <Label htmlFor="sms">SMS notifications</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="none" id="none" />
                  <Label htmlFor="none">No notifications</Label>
                </div>
              </RadioGroup>
            </FormField>

            <FormField label="Terms and Conditions">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="consent" 
                  checked={formValues.consent}
                  onCheckedChange={(checked) => setFormValues(prev => ({ ...prev, consent: checked as boolean }))}
                />
                <Label htmlFor="consent" className="text-sm">
                  I agree to the terms and conditions and privacy policy
                </Label>
              </div>
            </FormField>

            <div className="flex gap-4">
              <Button variant="default">Submit Form</Button>
              <Button variant="outline">Cancel</Button>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-6 text-ehrdc-neutral-dark">Form States</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField 
              label="Success State" 
              success="Email address is valid"
            >
              <Input value="valid@example.com" readOnly />
            </FormField>
            
            <FormField 
              label="Error State" 
              error="Please enter a valid email address"
            >
              <Input value="invalid-email" />
            </FormField>
            
            <FormField 
              label="Disabled State"
            >
              <Input placeholder="Disabled input" disabled />
            </FormField>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCards = () => (
    <div className="space-y-8">
      <DubaiHeading level={2} subtitle="Card components for content organization">
        Card Components
      </DubaiHeading>

      <div className="space-y-8">
        <div>
          <h3 className="text-xl font-semibold mb-6 text-ehrdc-neutral-dark">Standard Cards</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Card</CardTitle>
                <CardDescription>Standard card component for general content</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-ehrdc-neutral-dark/70">
                  This is a basic card with header and content sections.
                </p>
              </CardContent>
            </Card>

            <DubaiCard variant="service">
              <DubaiCardHeader>
                <DubaiCardTitle>Service Card</DubaiCardTitle>
                <DubaiCardDescription>Enhanced card for service presentations</DubaiCardDescription>
              </DubaiCardHeader>
              <DubaiCardContent>
                <p className="text-sm text-ehrdc-neutral-dark/70">
                  Dubai Government styled card with enhanced hover effects.
                </p>
              </DubaiCardContent>
            </DubaiCard>

            <DubaiCard variant="information">
              <DubaiCardHeader>
                <DubaiCardTitle>Information Card</DubaiCardTitle>
                <DubaiCardDescription>For displaying important information</DubaiCardDescription>
              </DubaiCardHeader>
              <DubaiCardContent>
                <p className="text-sm text-ehrdc-neutral-dark/70">
                  Styled for presenting key information and data.
                </p>
              </DubaiCardContent>
            </DubaiCard>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-6 text-ehrdc-neutral-dark">Interactive Cards</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatedCard variant="hover-lift">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-ehrdc-teal/10 rounded-xl flex items-center justify-center">
                  <Heart className="h-6 w-6 text-ehrdc-teal" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Hover Lift Effect</h3>
                  <p className="text-sm text-ehrdc-neutral-dark/70">Subtle elevation on hover</p>
                </div>
              </div>
              <p className="text-sm text-ehrdc-neutral-dark/70">
                This card lifts slightly when you hover over it, providing visual feedback.
              </p>
            </AnimatedCard>

            <AnimatedCard variant="hover-glow">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-ehrdc-teal/10 rounded-xl flex items-center justify-center">
                  <Star className="h-6 w-6 text-ehrdc-teal" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Hover Glow Effect</h3>
                  <p className="text-sm text-ehrdc-neutral-dark/70">Glowing border on hover</p>
                </div>
              </div>
              <p className="text-sm text-ehrdc-neutral-dark/70">
                This card shows a glowing border effect when hovered.
              </p>
            </AnimatedCard>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPatterns = () => (
    <div className="space-y-8">
      <DubaiHeading level={2} subtitle="Background patterns and section dividers">
        Visual Patterns
      </DubaiHeading>

      <div className="space-y-8">
        <div>
          <h3 className="text-xl font-semibold mb-6 text-ehrdc-neutral-dark">Background Patterns</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative h-32 rounded-lg overflow-hidden border">
              <BackgroundPattern pattern="dots" color="teal" opacity={0.1} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-ehrdc-neutral-dark font-medium">Dots Pattern</span>
              </div>
            </div>
            
            <div className="relative h-32 rounded-lg overflow-hidden border">
              <BackgroundPattern pattern="grid" color="teal" opacity={0.1} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-ehrdc-neutral-dark font-medium">Grid Pattern</span>
              </div>
            </div>
            
            <div className="relative h-32 rounded-lg overflow-hidden border">
              <BackgroundPattern pattern="geometric" color="teal" opacity={0.1} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-ehrdc-neutral-dark font-medium">Geometric Pattern</span>
              </div>
            </div>
            
            <div className="relative h-32 rounded-lg overflow-hidden border">
              <BackgroundPattern pattern="waves" color="teal" opacity={0.1} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-ehrdc-neutral-dark font-medium">Waves Pattern</span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-6 text-ehrdc-neutral-dark">Loading States</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white rounded-lg border text-center">
              <LoadingSpinner size="sm" className="mx-auto mb-2" />
              <p className="text-sm font-medium">Small Spinner</p>
            </div>
            <div className="p-6 bg-white rounded-lg border text-center">
              <LoadingSpinner size="md" className="mx-auto mb-2" />
              <p className="text-sm font-medium">Medium Spinner</p>
            </div>
            <div className="p-6 bg-white rounded-lg border text-center">
              <LoadingSpinner size="lg" className="mx-auto mb-2" />
              <p className="text-sm font-medium">Large Spinner</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-6 text-ehrdc-neutral-dark">Feedback Messages</h3>
          <div className="space-y-4 max-w-2xl">
            <FormFeedback type="success" message="Your changes have been saved successfully!" visible={true} />
            <FormFeedback type="error" message="Please correct the errors before submitting." visible={true} />
            <FormFeedback type="warning" message="This action cannot be undone." visible={true} />
            <FormFeedback type="info" message="This feature is currently in beta testing." visible={true} />
          </div>
        </div>
      </div>
    </div>
  );

  const renderResponsive = () => (
    <div className="space-y-8">
      <DubaiHeading level={2} subtitle="Responsive design principles and breakpoints">
        Responsive Design
      </DubaiHeading>

      <div className="space-y-8">
        <div>
          <h3 className="text-xl font-semibold mb-6 text-ehrdc-neutral-dark">Breakpoints</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-lg border text-center">
              <Monitor className="h-8 w-8 text-ehrdc-teal mx-auto mb-2" />
              <p className="font-medium">Desktop</p>
              <p className="text-sm text-ehrdc-neutral-dark/70">1024px+</p>
            </div>
            <div className="p-4 bg-white rounded-lg border text-center">
              <Monitor className="h-8 w-8 text-ehrdc-teal mx-auto mb-2" />
              <p className="font-medium">Tablet</p>
              <p className="text-sm text-ehrdc-neutral-dark/70">768px - 1023px</p>
            </div>
            <div className="p-4 bg-white rounded-lg border text-center">
              <Smartphone className="h-8 w-8 text-ehrdc-teal mx-auto mb-2" />
              <p className="font-medium">Mobile</p>
              <p className="text-sm text-ehrdc-neutral-dark/70">0px - 767px</p>
            </div>
            <div className="p-4 bg-white rounded-lg border text-center">
              <Smartphone className="h-8 w-8 text-ehrdc-teal mx-auto mb-2" />
              <p className="font-medium">Large Mobile</p>
              <p className="text-sm text-ehrdc-neutral-dark/70">480px - 767px</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-6 text-ehrdc-neutral-dark">Touch Targets</h3>
          <p className="text-ehrdc-neutral-dark/70 mb-4">
            All interactive elements meet minimum touch target size of 44px on mobile devices.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button size="sm" className="min-h-[44px]">Touch Safe</Button>
            <Button className="min-h-[44px]">Standard</Button>
            <Button size="lg" className="min-h-[44px]">Large</Button>
            <Button size="xl" className="min-h-[44px]">Extra Large</Button>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-6 text-ehrdc-neutral-dark">Responsive Grid</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="p-4 bg-ehrdc-teal/10 rounded-lg text-center">
                <p className="font-medium">Mobile: 1 Column</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-ehrdc-teal/10 rounded-lg text-center">
                <p className="font-medium">Tablet: 2 Columns</p>
              </div>
              <div className="p-4 bg-ehrdc-teal/10 rounded-lg text-center">
                <p className="font-medium">Tablet: 2 Columns</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-ehrdc-teal/10 rounded-lg text-center">
                <p className="font-medium">Desktop: 3 Columns</p>
              </div>
              <div className="p-4 bg-ehrdc-teal/10 rounded-lg text-center">
                <p className="font-medium">Desktop: 3 Columns</p>
              </div>
              <div className="p-4 bg-ehrdc-teal/10 rounded-lg text-center">
                <p className="font-medium">Desktop: 3 Columns</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (selectedComponent) {
      case 'overview': return renderOverview();
      case 'colors': return renderColors();
      case 'typography': return renderTypography();
      case 'spacing': return renderSpacing();
      case 'buttons': return renderButtons();
      case 'forms': return renderForms();
      case 'cards': return renderCards();
      case 'patterns': return renderPatterns();
      case 'responsive': return renderResponsive();
      default: return renderOverview();
    }
  };

  return (
    <PageTransition variant="fade">
      <div className="min-h-screen bg-ehrdc-neutral-light/20">
        <DubaiSection background="gradient" padding="lg">
          <div className="text-center">
            <DubaiHeading
              level={1}
              color="white"
              badge="EHRDC Platform"
              subtitle="Complete documentation and implementation of the Dubai Government design system for the Emirati Pathways platform."
            >
              Design System
            </DubaiHeading>
          </div>
        </DubaiSection>

        <div className="flex">
          {/* Sidebar Navigation */}
          <div className="w-64 bg-white border-r border-ehrdc-neutral-light min-h-screen sticky top-0">
            <div className="p-6">
              <h2 className="font-semibold text-ehrdc-neutral-dark mb-4">Components</h2>
              <nav className="space-y-2">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setSelectedComponent(section.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      selectedComponent === section.id
                        ? 'bg-ehrdc-teal text-white'
                        : 'text-ehrdc-neutral-dark hover:bg-ehrdc-teal/10 hover:text-ehrdc-teal'
                    }`}
                  >
                    <section.icon className="h-4 w-4" />
                    {section.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="dubai-container py-12">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default DesignSystemShowcase;
