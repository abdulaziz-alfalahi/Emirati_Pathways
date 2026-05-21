import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Users,
  Building2,
  GraduationCap,
  UserCheck,
  Award,
  Sparkles,
  Shield,
  Globe,
  TrendingUp,
  CheckCircle,
  Star,
  Play
} from 'lucide-react';
import HybridGovernmentNavFixed from '@/components/layout/HybridGovernmentNavFixed';

const HomePage: React.FC = () => {
  const personas = [
    {
      id: 'job_seeker',
      title: 'Job Seeker',
      description: 'Find your dream career with AI-powered job matching and personalized career guidance',
      icon: Users,
      features: ['AI Job Matching', 'CV Builder', 'Career Planning', 'Skill Assessment'],
      popular: true
    },
    {
      id: 'hr_recruiter',
      title: 'HR / Recruiter',
      description: 'Streamline hiring with advanced recruitment tools and candidate analytics',
      icon: Building2,
      features: ['Talent Pipeline', 'Video Interviews', 'Analytics Dashboard', 'Compliance Tools']
    },
    {
      id: 'educator',
      title: 'Educator',
      description: 'Enhance student outcomes with curriculum management and industry integration',
      icon: GraduationCap,
      features: ['Curriculum Tools', 'Student Tracking', 'Industry Partnerships', 'Career Guidance']
    },
    {
      id: 'mentor',
      title: 'Mentor',
      description: 'Guide the next generation of professionals with AI-powered mentorship matching',
      icon: UserCheck,
      features: ['Smart Matching', 'Progress Tracking', 'Resource Library', 'Impact Analytics']
    },
    {
      id: 'assessor',
      title: 'Assessor',
      description: 'Evaluate and validate professional competencies with advanced assessment tools',
      icon: Award,
      features: ['Competency Validation', 'Certification Tracking', 'Quality Assurance', 'Analytics']
    }
  ];

  const platformFeatures = [
    {
      icon: Sparkles,
      title: 'AI-Powered Intelligence',
      description: 'Advanced AI integration for personalized career guidance and matching'
    },
    {
      icon: Shield,
      title: 'UAE-Focused Security',
      description: 'Secure platform exclusively for UAE Nationals with government-grade security'
    },
    {
      icon: Globe,
      title: 'Cultural Intelligence',
      description: 'Built-in understanding of UAE workplace culture and Emiratization goals'
    },
    {
      icon: TrendingUp,
      title: 'Career Excellence',
      description: 'Comprehensive career development ecosystem supporting professional growth'
    }
  ];

  const testimonials = [
    {
      name: 'Ahmed Al Mansouri',
      role: 'Software Engineer',
      company: 'Dubai Municipality',
      content: 'The AI-powered job matching helped me find the perfect role that aligns with my career goals and UAE vision.',
      rating: 5
    },
    {
      name: 'Fatima Al Zahra',
      role: 'HR Director',
      company: 'ADNOC',
      content: 'Our recruitment process became 60% more efficient with the advanced analytics and candidate matching.',
      rating: 5
    },
    {
      name: 'Dr. Mohammed Al Rashid',
      role: 'Education Specialist',
      company: 'Ministry of Education',
      content: 'The platform bridges the gap between education and industry needs perfectly.',
      rating: 5
    }
  ];

  const stats = [
    { number: '10,000+', label: 'UAE Professionals' },
    { number: '500+', label: 'Partner Companies' },
    { number: '95%', label: 'Success Rate' },
    { number: '50+', label: 'Government Entities' }
  ];

  return (
    <div className="min-h-screen bg-[#FAFBFC]">
      {/* Navigation */}
      <HybridGovernmentNavFixed showAuthButtons={true} />

      {/* ─── Hero Section ─── */}
      <section className="relative py-24 lg:py-36 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center px-4 py-1.5 bg-[#E6F5F5] text-[#006E6D] rounded-full text-sm font-medium mb-8">
              <Sparkles className="w-4 h-4 mr-2" />
              Powered by Advanced AI Technology
            </div>

            <h1 className="text-4xl lg:text-[3.5rem] font-bold text-[#1A1A1A] mb-6 leading-[1.1] tracking-tight">
              Empowering UAE Nationals for
              <span className="text-[#006E6D]">
                {' '}Career Excellence
              </span>
            </h1>

            <p className="text-lg text-[#6B7280] mb-10 max-w-2xl mx-auto leading-relaxed">
              The comprehensive AI-powered platform connecting UAE professionals, employers, educators,
              mentors, and assessors in one unified ecosystem.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Link
                to="/auth"
                className="bg-[#006E6D] hover:bg-[#005A59] text-white px-8 py-3 rounded-full font-semibold text-base transition-colors flex items-center group"
              >
                Start Your Journey
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <button
                className="flex items-center text-[#6B7280] hover:text-[#1A1A1A] font-medium transition-colors px-6 py-3"
                onClick={() => {
                  const personasSection = document.getElementById('personas-section');
                  if (personasSection) {
                    personasSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
              >
                <Play className="w-4 h-4 mr-2" />
                Watch Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Platform Features ─── */}
      <section className="py-20 bg-[#FAFBFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-[#1A1A1A] mb-3">
              Why Choose Emirati Human Development Platform?
            </h2>
            <p className="text-lg text-[#6B7280] max-w-2xl mx-auto">
              Built specifically for the UAE market with advanced AI technology and cultural intelligence
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {platformFeatures.map((feature, index) => (
              <div key={index} className="bg-white rounded-2xl p-6 border border-[#E2E5E9] hover:border-[#006E6D]/25 transition-colors group" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                <div className="w-12 h-12 bg-[#E6F5F5] rounded-xl flex items-center justify-center mb-5">
                  <feature.icon className="w-6 h-6 text-[#006E6D]" />
                </div>
                <h3 className="text-base font-semibold text-[#1A1A1A] mb-2">{feature.title}</h3>
                <p className="text-sm text-[#6B7280] leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Personas Section ─── */}
      <section id="personas-section" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-[#1A1A1A] mb-3">
              Choose Your Professional Path
            </h2>
            <p className="text-lg text-[#6B7280] max-w-2xl mx-auto">
              Tailored experiences for every professional role in the UAE career ecosystem
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {personas.map((persona) => (
              <div key={persona.id} className="bg-white rounded-2xl p-7 border border-[#E2E5E9] hover:border-[#006E6D]/30 transition-all duration-200 relative group" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                {persona.popular && (
                  <div className="absolute -top-2.5 left-5 bg-[#006E6D] text-white px-3 py-0.5 rounded-full text-xs font-medium">
                    Most Popular
                  </div>
                )}

                <div className="w-12 h-12 bg-[#E6F5F5] rounded-xl flex items-center justify-center mb-5">
                  <persona.icon className="w-6 h-6 text-[#006E6D]" />
                </div>

                <h3 className="text-xl font-semibold text-[#1A1A1A] mb-2">{persona.title}</h3>
                <p className="text-sm text-[#6B7280] mb-5 leading-relaxed">{persona.description}</p>

                <div className="space-y-2 mb-6">
                  {persona.features.map((feature, index) => (
                    <div key={index} className="flex items-center text-sm text-[#374151]">
                      <CheckCircle className="w-4 h-4 text-[#006E6D] mr-2 flex-shrink-0" />
                      {feature}
                    </div>
                  ))}
                </div>

                <Link
                  to="/auth"
                  className="w-full bg-[#006E6D] hover:bg-[#005A59] text-white py-2.5 rounded-xl font-medium text-sm transition-colors flex items-center justify-center group"
                >
                  Get Started as {persona.title}
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Statistics ─── */}
      <section className="py-20 bg-[#006E6D]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-white mb-3">
              Trusted by UAE Professionals
            </h2>
            <p className="text-lg text-white/70 max-w-2xl mx-auto">
              Join thousands of UAE nationals advancing their careers through our platform
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl lg:text-5xl font-bold text-white mb-1">{stat.number}</div>
                <div className="text-white/70 text-base">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─── */}
      <section className="py-20 bg-[#FAFBFC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-[#1A1A1A] mb-3">
              Success Stories from UAE Professionals
            </h2>
            <p className="text-lg text-[#6B7280] max-w-2xl mx-auto">
              Real experiences from professionals who advanced their careers with our platform
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-2xl p-7 border border-[#E2E5E9] hover:border-[#006E6D]/25 transition-colors" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-400 fill-current" />
                  ))}
                </div>

                <p className="text-[#374151] text-sm mb-5 leading-relaxed">
                  "{testimonial.content}"
                </p>

                <div className="border-t border-[#E2E5E9] pt-4">
                  <div className="font-semibold text-sm text-[#1A1A1A]">{testimonial.name}</div>
                  <div className="text-[#6B7280] text-sm">{testimonial.role}</div>
                  <div className="text-[#9CA3AF] text-xs">{testimonial.company}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Section ─── */}
      <section className="py-20 bg-[#006E6D]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-5">
            Ready to Transform Your Career?
          </h2>
          <p className="text-lg text-white/80 mb-8 leading-relaxed">
            Join the UAE's premier career development platform and unlock your professional potential
            with AI-powered guidance and comprehensive support.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/auth"
              className="bg-white hover:bg-gray-50 text-[#006E6D] px-8 py-3 rounded-full font-semibold text-base transition-colors flex items-center justify-center group"
            >
              Start Your Journey Today
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="mt-6 text-white/60 text-sm flex items-center justify-center">
            <Shield className="w-3.5 h-3.5 mr-1.5" />
            UAE Nationals Only — Secure & Confidential Platform
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="bg-[#111827] text-white py-10 border-t-2 border-[#006E6D]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <img
                  src="/dubai-gov-logo.jpg"
                  alt="Government of Dubai"
                  className="h-9 w-auto opacity-90"
                />
                <div className="w-px h-8 bg-gray-700"></div>
                <img
                  src="/ehrdc-logo.png"
                  alt="EHRDC Logo"
                  className="h-8 w-auto opacity-90"
                />
              </div>
              <h3 className="text-base font-semibold mb-1">Emirati Human Development Platform</h3>
              <p className="text-gray-500 text-xs mb-3">UAE Nationals Career Development</p>
              <p className="text-gray-400 text-sm leading-relaxed max-w-md">
                Empowering UAE nationals with AI-powered career development tools and
                comprehensive professional support ecosystem.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-sm uppercase tracking-wider text-gray-400 mb-3">Platform</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link to="/auth" className="hover:text-white transition-colors">Job Seekers</Link></li>
                <li><Link to="/auth" className="hover:text-white transition-colors">HR & Recruiters</Link></li>
                <li><Link to="/auth" className="hover:text-white transition-colors">Educators</Link></li>
                <li><Link to="/auth" className="hover:text-white transition-colors">Mentors</Link></li>
                <li><Link to="/auth" className="hover:text-white transition-colors">Assessors</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-sm uppercase tracking-wider text-gray-400 mb-3">Support</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          <p className="text-gray-500 text-xs mt-8 pt-6 border-t border-gray-800">
            © 2025 Emirati Human Resources Development Council. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
