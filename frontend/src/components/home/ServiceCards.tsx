import React, { useState, useEffect } from 'react';
import { Calendar, Award, Hand as HelpingHand, BadgeCheck, GraduationCap, FileText as BookText, Compass, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
interface Service {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  path?: string; // Optional path for navigation
}
const ServiceCards: React.FC = () => {
  const navigate = useNavigate();
  const [visibleItems, setVisibleItems] = useState<number[]>([]);
  const services: Service[] = [{
    id: 'knowledge-camps',
    title: 'Knowledge Camps',
    description: 'Discover enriching summer camp programs to enhance your skills and experience.',
    icon: <Calendar size={24} />,
    path: '/knowledge-camps'
  }, {
    id: 'scholarships',
    title: 'Scholarships',
    description: 'Access scholarship opportunities and funding for your educational journey.',
    icon: <Award size={24} />,
    path: '/scholarships'
  }, {
    id: 'internships',
    title: 'Internships',
    description: 'Find and apply for internship opportunities aligned with your career goals.',
    icon: <HelpingHand size={24} />,
    path: '/internships'
  }, {
    id: 'assessments',
    title: 'Assessments',
    description: 'Take professional assessments to identify your strengths and areas for development.',
    icon: <BadgeCheck size={24} />,
    path: '/assessments'
  }, {
    id: 'training',
    title: 'Training',
    description: 'Access personalized AI-recommended training opportunities to develop your professional skills.',
    icon: <GraduationCap size={24} />,
    path: '/training'
  }, {
    id: 'portfolio',
    title: 'Portfolio Builder',
    description: 'Create and showcase your professional portfolio with UAE-specific templates designed for different career stages.',
    icon: <BookText size={24} />,
    path: '/cv-builder'
  }, {
    id: 'career',
    title: 'Career Exploration',
    description: 'Explore career opportunities matching your skills, preferences, and goals with advanced AI-powered guidance.',
    icon: <Compass size={24} />,
    path: '/job-matching'
  }, {
    id: 'candidate',
    title: 'Retiree Services',
    description: 'Access specialized services and opportunities designed to support UAE citizens during their retirement journey.',
    icon: <Briefcase size={24} />,
    path: '/retiree'
  }];
  const handleServiceClick = (service: Service) => {
    if (service.path) {
      console.log(`Navigating to: ${service.path}`);
      navigate(service.path);
    } else {
      console.log(`Service ${service.id} has no path defined`);
    }
  };
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const index = parseInt(entry.target.getAttribute('data-index') || '0');
          setVisibleItems(prev => [...prev, index]);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    });
    document.querySelectorAll('.service-card').forEach(card => {
      observer.observe(card);
    });
    return () => {
      observer.disconnect();
    };
  }, []);
  return <section id="services" className="section">
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-16">
        <div className="inline-block mb-6 px-4 py-2 rounded-full bg-white shadow-subtle border border-gray-100">
          <p className="text-emirati-navy font-medium">Comprehensive Tools</p>
        </div>
        <h2 className="text-3xl md:text-5xl font-display font-semibold mb-6">Platform Services</h2>
        <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
          The Emirati Human Development platform offers a wide range of services designed to support
          UAE citizens throughout their career development.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {services.map((service, index) => <div key={service.id} className={cn("service-card glass-card rounded-2xl p-6 border border-gray-100 transition-all duration-700 transform", visibleItems.includes(index) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12", service.path ? "cursor-pointer hover:shadow-md hover:border-emirati-teal/30" : "")} style={{
          transitionDelay: `${index % 3 * 100}ms`,
          backdropFilter: 'blur(10px)'
        }} data-index={index} onClick={() => handleServiceClick(service)}>
          <div className="w-12 h-12 rounded-xl bg-emirati-teal/10 flex items-center justify-center text-emirati-teal mb-5">
            {service.icon}
          </div>
          <h3 className="text-xl font-display font-medium mb-3">{service.title}</h3>
          <p className="text-foreground/70 leading-relaxed">{service.description}</p>
          {service.path && <div className="mt-4 text-emirati-teal text-sm font-medium">
            Click to explore
          </div>}
        </div>)}
      </div>

      <div className="mt-16 text-center">

      </div>
    </div>
  </section>;
};
export default ServiceCards;
