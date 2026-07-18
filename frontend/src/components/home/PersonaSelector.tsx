
import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight, ChevronLeft, User, Briefcase, GraduationCap, Users, Heart, BookOpen, LineChart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Persona {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const personas: Persona[] = [
  {
    id: 'candidate',
    title: 'Educational Institution',
    description: 'Register your institution, upload student grades, and list scholarship opportunities and summer camps.',
    icon: <GraduationCap size={24} />,
    color: 'bg-blue-50 text-blue-600'
  },
  {
    id: 'parent',
    title: 'Parents',
    description: 'Access your children\'s reports, browse educational resources, and register them for training programs.',
    icon: <Users size={24} />,
    color: 'bg-green-50 text-green-600'
  },
  {
    id: 'recruiter',
    title: 'Private Sector Recruiters',
    description: 'List job vacancies, internships, and scholarship opportunities with detailed geographical information.',
    icon: <Briefcase size={24} />,
    color: 'bg-purple-50 text-purple-600'
  },
  {
    id: 'compliance_auditor',
    title: 'Government Representatives',
    description: 'Manage national initiatives like Nafis and monitor Emiratization compliance across the private sector.',
    icon: <LineChart size={24} />,
    color: 'bg-red-50 text-red-600'
  },
  {
    id: 'candidate',
    title: 'Retiree Advocates',
    description: 'Engage retirees in community roles, share expertise, and organize legacy or volunteer projects.',
    icon: <Heart size={24} />,
    color: 'bg-orange-50 text-orange-600'
  },
  {
    id: 'trainer',
    title: 'Training Centers',
    description: 'List training programs, upload educational content, and connect with potential students.',
    icon: <BookOpen size={24} />,
    color: 'bg-teal-50 text-teal-600'
  },
  {
    id: 'user',
    title: 'Emirati Citizens',
    description: 'Navigate your career journey from education through retirement with personalized recommendations.',
    icon: <User size={24} />,
    color: 'bg-emirati-teal/10 text-emirati-teal'
  }
];

const PersonaSelector: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  const nextPersona = () => {
    setActiveIndex((prev) => (prev === personas.length - 1 ? 0 : prev + 1));
  };

  const prevPersona = () => {
    setActiveIndex((prev) => (prev === 0 ? personas.length - 1 : prev - 1));
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        }
      },
      { threshold: 0.1 }
    );

    const section = document.getElementById('personas');
    if (section) observer.observe(section);

    return () => {
      if (section) observer.unobserve(section);
    };
  }, []);

  return (
    <section id="personas" className="section bg-emirati-navy/5 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 start-0 w-full h-full bg-dot-pattern opacity-50 pointer-events-none"></div>
      <div className="absolute top-1/4 -end-40 w-80 h-80 bg-emirati-teal/10 rounded-full filter blur-3xl"></div>
      <div className="absolute bottom-1/4 -start-40 w-80 h-80 bg-emirati-gold/10 rounded-full filter blur-3xl"></div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <div className="inline-block mb-6 px-4 py-2 rounded-full bg-white shadow-subtle border border-gray-100">
            <p className="text-emirati-navy font-medium">Platform Personas</p>
          </div>
          <h2 className="text-3xl md:text-5xl font-display font-semibold mb-6">Who Can Benefit</h2>
          <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
            The Emirati Human Development platform connects various stakeholders in the UAE's human
            capital development ecosystem.
          </p>
        </div>

        {/* Persona Slider */}
        <div className="relative">
          {/* Navigation Buttons */}
          <button
            onClick={prevPersona}
            className="absolute start-0 top-1/2 -translate-y-1/2 z-10 md:-start-6 bg-white rounded-full p-2 shadow-md hover:shadow-lg transition-all duration-300"
          >
            <ChevronLeft className="text-emirati-navy" />
          </button>

          <button
            onClick={nextPersona}
            className="absolute end-0 top-1/2 -translate-y-1/2 z-10 md:-end-6 bg-white rounded-full p-2 shadow-md hover:shadow-lg transition-all duration-300"
          >
            <ChevronRight className="text-emirati-navy" />
          </button>

          {/* Persona Cards */}
          <div
            ref={containerRef}
            className="flex overflow-hidden"
          >
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${activeIndex * 100}%)` }}
            >
              {personas.map((persona, index) => (
                <div
                  key={persona.id}
                  className={cn(
                    "w-full flex-shrink-0 px-6 transition-opacity duration-500",
                    activeIndex === index ? "opacity-100" : "opacity-50"
                  )}
                >
                  <div className="bg-white rounded-2xl shadow-card p-8 md:p-10 h-full border border-gray-100 hover:shadow-lg transition-all duration-300">
                    <div className="flex flex-col h-full">
                      <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center mb-6", persona.color)}>
                        {persona.icon}
                      </div>
                      <h3 className="text-2xl font-display font-medium mb-4">{persona.title}</h3>
                      <p className="text-foreground/70 leading-relaxed mb-6">{persona.description}</p>
                      <button className="mt-auto text-emirati-teal font-medium hover:text-emirati-navy transition-colors flex items-center">
                        Learn more
                        <ChevronRight size={16} className="ms-1" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center space-x-2 mt-8">
            {personas.map((_, index) => (
              <button
                key={index}
                className={cn(
                  "w-2.5 h-2.5 rounded-full transition-all duration-300",
                  activeIndex === index
                    ? "bg-emirati-teal w-8"
                    : "bg-gray-300 hover:bg-gray-400"
                )}
                onClick={() => setActiveIndex(index)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PersonaSelector;
