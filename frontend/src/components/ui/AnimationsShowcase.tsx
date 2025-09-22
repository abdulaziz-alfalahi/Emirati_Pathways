
import React, { useState } from 'react';
import { Button } from './button';
import { AnimatedCard, AnimatedIcon, FadeInView, LoadingSpinner, FormFeedback } from './interactive-animations';
import { PageTransition, StaggeredList } from './page-transition';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { DubaiHeading } from './dubai-heading';
import { DubaiSection } from './dubai-section';
import { Heart, Star, Zap, Trophy, Sparkles, CheckCircle } from 'lucide-react';

export const AnimationsShowcase: React.FC = () => {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'success' | 'error' | 'warning' | 'info'>('success');
  const [isLoading, setIsLoading] = useState(false);

  const handleFormSubmit = (type: 'success' | 'error' | 'warning' | 'info') => {
    setFeedbackType(type);
    setShowFeedback(true);
    setTimeout(() => setShowFeedback(false), 3000);
  };

  const handleLoadingDemo = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  const cardData = [
    { icon: Heart, title: 'Hover Lift', variant: 'hover-lift' as const },
    { icon: Star, title: 'Hover Glow', variant: 'hover-glow' as const },
    { icon: Zap, title: 'Interactive', variant: 'interactive' as const },
    { icon: Trophy, title: 'Default', variant: 'default' as const }
  ];

  return (
    <div className="min-h-screen bg-ehrdc-neutral-light/20">
      <PageTransition variant="fade" duration="normal">
        {/* Hero Section */}
        <DubaiSection background="gradient" padding="xl" className="text-center">
          <DubaiHeading
            level={1}
            color="white"
            badge="Interactive Elements"
            subtitle="Discover Dubai Government standard micro-animations and interactive elements designed for optimal user experience."
          >
            Animation Showcase
          </DubaiHeading>
        </DubaiSection>

        {/* Button Animations */}
        <DubaiSection background="white" padding="lg">
          <DubaiHeading
            level={2}
            subtitle="Interactive buttons with hover effects, focus states, and loading animations."
          >
            Button Animations
          </DubaiHeading>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
            <div className="space-y-4">
              <h3 className="font-semibold text-ehrdc-neutral-dark">Primary Buttons</h3>
              <Button variant="default">Default Button</Button>
              <Button variant="default" loading={isLoading} loadingText="Processing...">
                {isLoading ? '' : 'Load Demo'}
              </Button>
              <Button variant="success">Success Action</Button>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold text-ehrdc-neutral-dark">Secondary Buttons</h3>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline Style</Button>
              <Button variant="ghost">Ghost Button</Button>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold text-ehrdc-neutral-dark">Action Buttons</h3>
              <Button variant="warning">Warning</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="link">Link Style</Button>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-semibold text-ehrdc-neutral-dark">Interactive Demo</h3>
              <Button onClick={handleLoadingDemo}>Test Loading</Button>
              <Button onClick={() => handleFormSubmit('success')}>Show Success</Button>
              <Button onClick={() => handleFormSubmit('error')}>Show Error</Button>
            </div>
          </div>
        </DubaiSection>

        {/* Card Animations */}
        <DubaiSection background="light" padding="lg">
          <DubaiHeading
            level={2}
            subtitle="Cards with different hover effects and interactive states."
          >
            Card Animations
          </DubaiHeading>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
            {cardData.map((card, index) => (
              <AnimatedCard
                key={card.title}
                variant={card.variant}
                delay={index * 100}
                onClick={() => console.log(`${card.title} clicked`)}
              >
                <AnimatedIcon variant="scale">
                  <div className="w-12 h-12 bg-ehrdc-teal/10 rounded-xl flex items-center justify-center text-ehrdc-teal mb-4">
                    <card.icon className="h-6 w-6" />
                  </div>
                </AnimatedIcon>
                <h3 className="text-xl font-semibold text-ehrdc-neutral-dark mb-2">
                  {card.title}
                </h3>
                <p className="text-ehrdc-neutral-dark/70">
                  Hover to see the {card.variant} animation effect in action.
                </p>
              </AnimatedCard>
            ))}
          </div>
        </DubaiSection>

        {/* Staggered List Animation */}
        <DubaiSection background="white" padding="lg">
          <DubaiHeading
            level={2}
            subtitle="Lists that animate in sequence for better visual hierarchy."
          >
            Staggered Animations
          </DubaiHeading>
          
          <StaggeredList
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8"
            staggerDelay={150}
          >
            {[
              { title: 'Performance', desc: 'Optimized animations for smooth 60fps performance' },
              { title: 'Accessibility', desc: 'Respects user motion preferences and contrast needs' },
              { title: 'Consistency', desc: 'Follows Dubai Government design standards' },
              { title: 'Feedback', desc: 'Clear visual feedback for all user interactions' },
              { title: 'Loading States', desc: 'Elegant loading animations and skeleton screens' },
              { title: 'Focus Management', desc: 'Enhanced focus rings and keyboard navigation' }
            ].map((item, index) => (
              <Card key={index} className="dubai-card-hover">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-ehrdc-teal" />
                    {item.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{item.desc}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </StaggeredList>
        </DubaiSection>

        {/* Form Feedback Animations */}
        <DubaiSection background="light" padding="lg">
          <DubaiHeading
            level={2}
            subtitle="Animated feedback messages for forms and user actions."
          >
            Form Feedback
          </DubaiHeading>
          
          <div className="max-w-2xl mx-auto mt-8 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button 
                variant="success" 
                size="sm"
                onClick={() => handleFormSubmit('success')}
              >
                Success
              </Button>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => handleFormSubmit('error')}
              >
                Error
              </Button>
              <Button 
                variant="warning" 
                size="sm"
                onClick={() => handleFormSubmit('warning')}
              >
                Warning
              </Button>
              <Button 
                variant="secondary" 
                size="sm"
                onClick={() => handleFormSubmit('info')}
              >
                Info
              </Button>
            </div>
            
            <FormFeedback
              type={feedbackType}
              message={`This is a ${feedbackType} message with smooth animation transitions.`}
              visible={showFeedback}
            />
          </div>
        </DubaiSection>

        {/* Loading States */}
        <DubaiSection background="white" padding="lg">
          <DubaiHeading
            level={2}
            subtitle="Various loading animations and spinner components."
          >
            Loading States
          </DubaiHeading>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
            <Card className="text-center">
              <CardHeader>
                <CardTitle>Spinner Variants</CardTitle>
                <CardDescription>Different sizes and colors</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-center gap-4">
                  <LoadingSpinner size="sm" />
                  <LoadingSpinner size="md" />
                  <LoadingSpinner size="lg" />
                </div>
                <div className="flex justify-center gap-4">
                  <LoadingSpinner color="teal" />
                  <LoadingSpinner color="neutral" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardHeader>
                <CardTitle>Skeleton Loading</CardTitle>
                <CardDescription>Content placeholders</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="animate-skeleton h-4 rounded"></div>
                <div className="animate-skeleton h-4 rounded w-4/5"></div>
                <div className="animate-skeleton h-4 rounded w-3/5"></div>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardHeader>
                <CardTitle>Pulse Animation</CardTitle>
                <CardDescription>Notification indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center">
                  <div className="w-4 h-4 bg-ehrdc-teal rounded-full animate-pulse-notification"></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </DubaiSection>

        {/* Scroll-triggered Animations */}
        <DubaiSection background="light" padding="lg">
          <DubaiHeading
            level={2}
            subtitle="Animations that trigger when elements come into view."
          >
            Scroll Animations
          </DubaiHeading>
          
          <div className="space-y-12 mt-8">
            <FadeInView direction="up" delay={0}>
              <Card className="bg-white p-8 text-center">
                <Sparkles className="h-12 w-12 text-ehrdc-teal mx-auto mb-4" />
                <h3 className="text-2xl font-semibold mb-2">Fade Up</h3>
                <p className="text-ehrdc-neutral-dark/70">
                  This content fades in from below when scrolled into view.
                </p>
              </Card>
            </FadeInView>
            
            <FadeInView direction="left" delay={200}>
              <Card className="bg-white p-8 text-center">
                <Star className="h-12 w-12 text-ehrdc-teal mx-auto mb-4" />
                <h3 className="text-2xl font-semibold mb-2">Fade Left</h3>
                <p className="text-ehrdc-neutral-dark/70">
                  This content slides in from the left with a slight delay.
                </p>
              </Card>
            </FadeInView>
            
            <FadeInView direction="right" delay={400}>
              <Card className="bg-white p-8 text-center">
                <Trophy className="h-12 w-12 text-ehrdc-teal mx-auto mb-4" />
                <h3 className="text-2xl font-semibold mb-2">Fade Right</h3>
                <p className="text-ehrdc-neutral-dark/70">
                  This content slides in from the right with an even longer delay.
                </p>
              </Card>
            </FadeInView>
          </div>
        </DubaiSection>
      </PageTransition>
    </div>
  );
};

export default AnimationsShowcase;
