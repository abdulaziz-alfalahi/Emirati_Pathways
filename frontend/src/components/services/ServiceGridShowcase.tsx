
import React from 'react';
import { ServiceGrid } from './ServiceGrid';
import { 
  Briefcase, 
  GraduationCap, 
  FileText, 
  Award,
  Users,
  Calendar
} from 'lucide-react';

const featuredServices = [
  {
    id: 'job-matching',
    title: 'Job Matching',
    description: 'AI-powered job recommendations tailored to your skills and career goals.',
    category: 'Career Development',
    icon: <Briefcase className="h-6 w-6" />,
    path: '/job-matching',
    status: 'popular' as const,
    users: 2547,
    duration: 'Ongoing'
  },
  {
    id: 'cv-builder',
    title: 'CV Builder',
    description: 'Professional CV templates designed for the UAE job market.',
    category: 'Professional Tools',
    icon: <FileText className="h-6 w-6" />,
    path: '/cv-builder',
    status: 'available' as const,
    users: 1823,
    duration: '30 mins'
  },
  {
    id: 'scholarships',
    title: 'Scholarships',
    description: 'Educational funding opportunities for UAE nationals.',
    category: 'Education',
    icon: <GraduationCap className="h-6 w-6" />,
    path: '/scholarships',
    status: 'available' as const,
    users: 892,
    duration: 'Application based'
  },
  {
    id: 'training',
    title: 'Training Programs',
    description: 'Government-approved skill development and certification programs.',
    category: 'Skills Development',
    icon: <Award className="h-6 w-6" />,
    path: '/training',
    status: 'available' as const,
    users: 1456,
    duration: '2-12 weeks'
  },
  {
    id: 'communities',
    title: 'Professional Communities',
    description: 'Connect with professionals and expand your network.',
    category: 'Networking',
    icon: <Users className="h-6 w-6" />,
    path: '/communities',
    status: 'available' as const,
    users: 3210,
    duration: 'Ongoing'
  },
  {
    id: 'career-advisory',
    title: 'Career Advisory',
    description: 'One-on-one sessions with certified career advisors.',
    category: 'Professional Guidance',
    icon: <Calendar className="h-6 w-6" />,
    path: '/career-advisory',
    status: 'available' as const,
    users: 456,
    duration: '45-60 mins'
  }
];

export const ServiceGridShowcase: React.FC = () => {
  return (
    <div className="min-h-screen bg-ehrdc-neutral-light/20">
      {/* Featured Services Grid */}
      <ServiceGrid
        title="Featured Services"
        description="Essential tools and services to accelerate your professional journey in the UAE"
        services={featuredServices}
        columns={3}
        showCategory={true}
      />
      
      {/* Two Column Layout Demo */}
      <ServiceGrid
        title="Quick Access Tools"
        description="Frequently used services for your daily professional needs"
        services={featuredServices.slice(0, 4)}
        columns={2}
        showCategory={false}
      />
      
      {/* Four Column Layout Demo */}
      <ServiceGrid
        title="All Services"
        description="Complete range of government services available on the platform"
        services={featuredServices}
        columns={4}
        showCategory={true}
      />
    </div>
  );
};

export default ServiceGridShowcase;
