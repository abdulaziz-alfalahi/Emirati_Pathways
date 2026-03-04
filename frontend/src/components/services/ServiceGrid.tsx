
import React from 'react';
import { ServiceCard } from '@/components/cards/ServiceCard';
import {
  Briefcase,
  GraduationCap,
  FileText,
  Award,
  Users,
  MapPin,
  BarChart3,
  Calendar,
  MessageSquare,
  Shield,
  Globe,
  Zap
} from 'lucide-react';

interface Service {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  path: string;
  status?: 'available' | 'coming-soon' | 'popular';
  users?: number;
  duration?: string;
}

interface ServiceGridProps {
  title?: string;
  description?: string;
  services?: Service[];
  columns?: 2 | 3 | 4;
  showCategory?: boolean;
}

const defaultServices: Service[] = [
  {
    id: 'job-matching',
    title: 'Job Matching',
    description: 'Find career opportunities that match your skills and aspirations with AI-powered recommendations.',
    category: 'Career Development',
    icon: <Briefcase className="h-6 w-6" />,
    path: '/job-matching',
    status: 'popular',
    users: 2547,
    duration: 'Ongoing'
  },
  {
    id: 'cv-builder',
    title: 'CV Builder',
    description: 'Create professional CVs with UAE-specific templates and industry standards.',
    category: 'Professional Tools',
    icon: <FileText className="h-6 w-6" />,
    path: '/cv-builder',
    status: 'available',
    users: 1823,
    duration: '30 mins'
  },
  {
    id: 'scholarships',
    title: 'Scholarships',
    description: 'Access educational funding opportunities and scholarship programs for UAE nationals.',
    category: 'Education',
    icon: <GraduationCap className="h-6 w-6" />,
    path: '/scholarships',
    status: 'available',
    users: 892,
    duration: 'Application based'
  },
  {
    id: 'training',
    title: 'Training Programs',
    description: 'Enhance your skills with government-approved training and certification programs.',
    category: 'Skills Development',
    icon: <Award className="h-6 w-6" />,
    path: '/training',
    status: 'available',
    users: 1456,
    duration: '2-12 weeks'
  },
  {
    id: 'communities',
    title: 'Professional Communities',
    description: 'Connect with like-minded professionals and expand your network.',
    category: 'Networking',
    icon: <Users className="h-6 w-6" />,
    path: '/communities',
    status: 'available',
    users: 3210,
    duration: 'Ongoing'
  },
  {
    id: 'career-journey',
    title: 'Career Journey',
    description: 'Map your career path and track your professional development milestones.',
    category: 'Career Planning',
    icon: <MapPin className="h-6 w-6" />,
    path: '/career-journey',
    status: 'available',
    users: 967,
    duration: 'Self-paced'
  },
  {
    id: 'analytics',
    title: 'Career Analytics',
    description: 'Get insights into your career progress and market trends.',
    category: 'Data & Insights',
    icon: <BarChart3 className="h-6 w-6" />,
    path: '/analytics',
    status: 'available',
    users: 1234,
    duration: 'Real-time'
  },
  {
    id: 'career-advisory',
    title: 'Career Advisory',
    description: 'Book one-on-one sessions with certified career advisors.',
    category: 'Professional Guidance',
    icon: <Calendar className="h-6 w-6" />,
    path: '/career-advisory',
    status: 'available',
    users: 456,
    duration: '45-60 mins'
  },
  {
    id: 'messaging',
    title: 'Messaging Center',
    description: 'Communicate with advisors, recruiters, and your professional network.',
    category: 'Communication',
    icon: <MessageSquare className="h-6 w-6" />,
    path: '/candidate-dashboard?tab=messages',
    status: 'available',
    users: 2890,
    duration: 'Real-time'
  },
  {
    id: 'blockchain',
    title: 'Digital Credentials',
    description: 'Secure, verifiable digital credentials and certificates.',
    category: 'Security',
    icon: <Shield className="h-6 w-6" />,
    path: '/blockchain',
    status: 'coming-soon',
    duration: 'Instant'
  },
  {
    id: 'global-opportunities',
    title: 'Global Opportunities',
    description: 'Explore international career and education opportunities.',
    category: 'International',
    icon: <Globe className="h-6 w-6" />,
    path: '/global',
    status: 'coming-soon',
    duration: 'Varies'
  },
  {
    id: 'ai-assistant',
    title: 'AI Career Assistant',
    description: 'Get personalized career guidance powered by artificial intelligence.',
    category: 'AI Tools',
    icon: <Zap className="h-6 w-6" />,
    path: '/ai-assistant',
    status: 'coming-soon',
    duration: '24/7'
  }
];

export const ServiceGrid: React.FC<ServiceGridProps> = ({
  title = "Platform Services",
  description = "Comprehensive tools and services designed to support your professional journey",
  services = defaultServices,
  columns = 3,
  showCategory = true
}) => {
  const gridColumns = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
  };

  return (
    <section className="py-12 px-4 bg-background">
      <div className="dubai-container max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-block mb-6 px-4 py-2 rounded-full bg-ehrdc-teal/10 border border-ehrdc-teal/20">
            <p className="text-ehrdc-teal font-medium text-sm">Government Services</p>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-ehrdc-neutral-dark mb-4">
            {title}
          </h2>
          <p className="text-lg text-ehrdc-neutral-dark/70 max-w-3xl mx-auto leading-relaxed">
            {description}
          </p>
        </div>

        {/* Services Grid */}
        <div className={`grid ${gridColumns[columns]} gap-6 md:gap-8`}>
          {services.map((service, index) => (
            <div
              key={service.id}
              className="group transition-all duration-300 hover:-translate-y-1"
              style={{
                animationDelay: `${index * 100}ms`
              }}
            >
              <ServiceCard
                title={service.title}
                description={service.description}
                category={showCategory ? service.category : undefined}
                duration={service.duration}
                users={service.users}
                status={service.status}
                icon={service.icon}
                actionLabel="Explore Service"
                onClick={() => {
                  // Navigate to service
                  window.location.href = service.path;
                }}
              />
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-ehrdc-teal/5 to-ehrdc-dark-teal/5 rounded-2xl p-8 border border-ehrdc-teal/10">
            <h3 className="text-2xl font-semibold text-ehrdc-neutral-dark mb-4">
              Ready to Start Your Journey?
            </h3>
            <p className="text-ehrdc-neutral-dark/70 mb-6 max-w-2xl mx-auto">
              Join thousands of UAE nationals who have accelerated their careers through our platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="ehrdc-button-primary px-8 py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-lg">
                Get Started Today
              </button>
              <button className="ehrdc-button-secondary px-8 py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-md">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ServiceGrid;
