
import React from 'react';
import { DubaiSection } from './dubai-section';
import { DubaiHeading } from './dubai-heading';
import { BackgroundPattern } from './background-patterns';
import { Button } from './button';
import { Briefcase, GraduationCap, Users, Award } from 'lucide-react';

export const DubaiSectionShowcase: React.FC = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section with Wave Divider */}
      <DubaiSection
        background="gradient"
        padding="xl"
        dividerBottom={{ variant: 'wave', color: 'white', direction: 'down' }}
        className="relative overflow-hidden"
      >
        <BackgroundPattern pattern="geometric" color="white" opacity={0.1} />
        <DubaiHeading
          level={1}
          color="white"
          badge="Government Services"
          subtitle="Empowering UAE citizens through comprehensive digital services and innovative solutions designed for every stage of your professional journey."
        >
          Dubai Government Services Platform
        </DubaiHeading>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <Button className="ehrdc-button-primary px-8 py-3">
            Get Started
          </Button>
          <Button variant="outline" className="border-white text-white hover:bg-white hover:text-ehrdc-teal px-8 py-3">
            Learn More
          </Button>
        </div>
      </DubaiSection>

      {/* Services Section with Dots Background */}
      <DubaiSection
        background="light"
        padding="lg"
        className="relative"
      >
        <BackgroundPattern pattern="dots" color="teal" opacity={0.05} />
        <DubaiHeading
          level={2}
          badge="Core Services"
          subtitle="Essential tools and resources to support your career development and professional growth."
        >
          Platform Services
        </DubaiHeading>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-12">
          {[
            { icon: Briefcase, title: 'Job Matching', desc: 'AI-powered career opportunities' },
            { icon: GraduationCap, title: 'Education', desc: 'Learning and development programs' },
            { icon: Users, title: 'Networking', desc: 'Professional community connections' },
            { icon: Award, title: 'Recognition', desc: 'Achievements and certifications' }
          ].map((service, index) => (
            <div key={index} className="bg-white p-6 rounded-2xl shadow-dubai hover:shadow-dubai-lg transition-all duration-300">
              <div className="w-12 h-12 bg-ehrdc-teal/10 rounded-xl flex items-center justify-center text-ehrdc-teal mb-4">
                <service.icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-ehrdc-neutral-dark mb-2">{service.title}</h3>
              <p className="text-ehrdc-neutral-dark/70">{service.desc}</p>
            </div>
          ))}
        </div>
      </DubaiSection>

      {/* Statistics Section with Gradient Dividers */}
      <DubaiSection
        background="white"
        padding="lg"
        dividerTop={{ variant: 'gradient', color: 'teal' }}
        dividerBottom={{ variant: 'gradient', color: 'teal' }}
      >
        <DubaiHeading
          level={2}
          color="teal"
          align="center"
          subtitle="Join thousands of UAE citizens who have transformed their careers through our platform."
        >
          Platform Impact
        </DubaiHeading>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
          {[
            { number: '15,000+', label: 'Active Users', desc: 'UAE citizens using our platform' },
            { number: '8,500+', label: 'Job Placements', desc: 'Successful career matches' },
            { number: '95%', label: 'Satisfaction Rate', desc: 'User satisfaction score' }
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-ehrdc-teal mb-2">{stat.number}</div>
              <div className="text-xl font-semibold text-ehrdc-neutral-dark mb-1">{stat.label}</div>
              <div className="text-ehrdc-neutral-dark/70">{stat.desc}</div>
            </div>
          ))}
        </div>
      </DubaiSection>

      {/* Call to Action with Wave Pattern */}
      <DubaiSection
        background="teal"
        padding="lg"
        dividerTop={{ variant: 'wave', color: 'white', direction: 'up' }}
        className="relative overflow-hidden"
      >
        <BackgroundPattern pattern="waves" color="white" opacity={0.1} />
        <DubaiHeading
          level={2}
          color="white"
          subtitle="Start your journey today and join the thousands of UAE citizens who have found success through our comprehensive platform."
        >
          Ready to Transform Your Career?
        </DubaiHeading>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <Button className="bg-white text-ehrdc-teal hover:bg-ehrdc-neutral-light px-8 py-3">
            Join Now
          </Button>
          <Button variant="outline" className="border-white text-white hover:bg-white/10 px-8 py-3">
            Explore Services
          </Button>
        </div>
      </DubaiSection>
    </div>
  );
};

export default DubaiSectionShowcase;
