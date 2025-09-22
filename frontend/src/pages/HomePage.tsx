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
      color: 'bg-blue-500',
      features: ['AI Job Matching', 'CV Builder', 'Career Planning', 'Skill Assessment'],
      popular: true
    },
    {
      id: 'hr_recruiter',
      title: 'HR / Recruiter',
      description: 'Streamline hiring with advanced recruitment tools and candidate analytics',
      icon: Building2,
      color: 'bg-green-500',
      features: ['Talent Pipeline', 'Video Interviews', 'Analytics Dashboard', 'Compliance Tools']
    },
    {
      id: 'educator',
      title: 'Educator',
      description: 'Enhance student outcomes with curriculum management and industry integration',
      icon: GraduationCap,
      color: 'bg-purple-500',
      features: ['Curriculum Tools', 'Student Tracking', 'Industry Partnerships', 'Career Guidance']
    },
    {
      id: 'mentor',
      title: 'Mentor',
      description: 'Guide the next generation of professionals with AI-powered mentorship matching',
      icon: UserCheck,
      color: 'bg-orange-500',
      features: ['Smart Matching', 'Progress Tracking', 'Resource Library', 'Impact Analytics']
    },
    {
      id: 'assessor',
      title: 'Assessor',
      description: 'Evaluate and validate professional competencies with advanced assessment tools',
      icon: Award,
      color: 'bg-red-500',
      features: ['Competency Validation', 'Certification Tracking', 'Quality Assurance', 'Analytics']
    }
  ];

  const platformFeatures = [
    {
      icon: Sparkles,
      title: 'AI-Powered Intelligence',
      description: 'Advanced Gemini 2.5 Pro integration for personalized career guidance and matching'
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50">
      {/* Navigation */}
      <HybridGovernmentNavFixed showAuthButtons={true} />

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 bg-teal-100 text-teal-800 rounded-full text-sm font-medium mb-8">
              <Sparkles className="w-4 h-4 mr-2" />
              Powered by Advanced AI Technology
            </div>
            
            <h1 className="text-4xl lg:text-6xl font-bold text-slate-900 mb-6 leading-tight">
              Empowering UAE Nationals for
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-600">
                {' '}Career Excellence
              </span>
            </h1>
            
            <p className="text-xl text-slate-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              The comprehensive AI-powered platform connecting UAE professionals, employers, educators, 
              mentors, and assessors in one unified ecosystem for career development and growth.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link 
                to="/auth" 
                className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 hover:shadow-xl hover:scale-105 flex items-center group"
              >
                Start Your Journey
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <button className="flex items-center text-slate-600 hover:text-slate-900 font-medium transition-colors">
                <Play className="w-5 h-5 mr-2" />
                Watch Demo
              </button>
            </div>
          </div>
        </div>
        
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-teal-400/20 to-emerald-400/20 rounded-full blur-3xl"></div>
        </div>
      </section>

      {/* Platform Features */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
              Why Choose Emirati Journey Platform?
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Built specifically for the UAE market with advanced AI technology and cultural intelligence
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {platformFeatures.map((feature, index) => (
              <div key={index} className="text-center group">
                <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-200">
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Personas Section */}
      <section className="py-20 bg-gradient-to-br from-slate-50 to-teal-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
              Choose Your Professional Path
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Tailored experiences for every professional role in the UAE career ecosystem
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {personas.map((persona) => (
              <div key={persona.id} className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 relative group">
                {persona.popular && (
                  <div className="absolute -top-3 left-6 bg-gradient-to-r from-orange-400 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </div>
                )}
                
                <div className={`w-14 h-14 ${persona.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200`}>
                  <persona.icon className="w-7 h-7 text-white" />
                </div>
                
                <h3 className="text-2xl font-bold text-slate-900 mb-3">{persona.title}</h3>
                <p className="text-slate-600 mb-6 leading-relaxed">{persona.description}</p>
                
                <div className="space-y-2 mb-8">
                  {persona.features.map((feature, index) => (
                    <div key={index} className="flex items-center text-sm text-slate-600">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      {feature}
                    </div>
                  ))}
                </div>
                
                <Link 
                  to="/auth" 
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center group"
                >
                  Get Started as {persona.title}
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="py-20 bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Trusted by UAE Professionals
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Join thousands of UAE nationals advancing their careers through our platform
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl lg:text-5xl font-bold text-white mb-2">{stat.number}</div>
                <div className="text-slate-300 text-lg">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
              Success Stories from UAE Professionals
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Real experiences from professionals who advanced their careers with our platform
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-slate-50 rounded-2xl p-8 hover:shadow-lg transition-shadow duration-300">
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                
                <p className="text-slate-700 mb-6 leading-relaxed italic">
                  "{testimonial.content}"
                </p>
                
                <div>
                  <div className="font-semibold text-slate-900">{testimonial.name}</div>
                  <div className="text-slate-600">{testimonial.role}</div>
                  <div className="text-slate-500 text-sm">{testimonial.company}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-teal-600 to-emerald-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Career?
          </h2>
          <p className="text-xl text-teal-100 mb-10 leading-relaxed">
            Join the UAE's premier career development platform and unlock your professional potential 
            with AI-powered guidance and comprehensive support.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/auth" 
              className="bg-white hover:bg-slate-50 text-teal-600 px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 hover:shadow-xl flex items-center justify-center group"
            >
              Start Your Journey Today
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          
          <div className="mt-8 text-teal-100 text-sm">
            <Shield className="w-4 h-4 inline mr-2" />
            UAE Nationals Only - Secure & Confidential Platform
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center space-x-4 mb-4">
                <img 
                  src="/dubai-gov-logo.jpg" 
                  alt="Government of Dubai" 
                  className="h-12 w-auto opacity-90"
                />
                <div className="w-px h-10 bg-slate-600"></div>
                <img 
                  src="/ehrdc-logo.png" 
                  alt="EHRDC Logo" 
                  className="h-10 w-auto opacity-90"
                />
              </div>
              <div className="ml-0">
                <h3 className="text-xl font-bold">Emirati Journey Platform</h3>
                <p className="text-slate-400 text-sm">UAE Nationals Career Development</p>
              </div>
              <p className="text-slate-400 leading-relaxed max-w-md">
                Empowering UAE nationals with AI-powered career development tools and 
                comprehensive professional support ecosystem.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-slate-400">
                <li><Link to="/auth" className="hover:text-white transition-colors">Job Seekers</Link></li>
                <li><Link to="/auth" className="hover:text-white transition-colors">HR & Recruiters</Link></li>
                <li><Link to="/auth" className="hover:text-white transition-colors">Educators</Link></li>
                <li><Link to="/auth" className="hover:text-white transition-colors">Mentors</Link></li>
                <li><Link to="/auth" className="hover:text-white transition-colors">Assessors</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <p className="text-slate-400 text-sm mt-8 pt-8 border-t border-slate-700">
            © 2025 Emirati Human Resources Development Council. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
