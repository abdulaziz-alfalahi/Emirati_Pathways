
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface JourneyStage {
  id: string;
  title: string;
  description: string;
  icon: string;
}

const journeyStages: JourneyStage[] = [
  {
    id: 'school',
    title: 'School Student',
    description: 'Discover potential career paths and educational opportunities aligned with your interests and UAE national priorities.',
    icon: '🎓'
  },
  {
    id: 'national-service',
    title: 'National Service',
    description: 'Develop discipline, teamwork, and leadership skills while serving your country and building valuable connections.',
    icon: '🇦🇪'
  },
  {
    id: 'university',
    title: 'University Student',
    description: 'Access scholarship opportunities, internships, and industry connections while pursuing higher education.',
    icon: '📚'
  },
  {
    id: 'internship',
    title: 'Internship',
    description: 'Gain practical experience through targeted placements with leading organizations in your field of interest.',
    icon: '💼'
  },
  {
    id: 'employee',
    title: 'Employment',
    description: 'Find full-time, part-time, or gig opportunities across the UAE, with special focus on Emiratization initiatives.',
    icon: '👔'
  },
  {
    id: 'entrepreneur',
    title: 'Entrepreneur',
    description: 'Access resources, mentorship, and funding opportunities to launch and grow your business venture.',
    icon: '🚀'
  },
  {
    id: 'lifelong',
    title: 'Lifelong Learner',
    description: 'Continue developing skills and knowledge throughout your career with targeted upskilling recommendations.',
    icon: '🔄'
  },
  {
    id: 'retirement',
    title: 'Retirement',
    description: 'Plan your retirement and discover opportunities to contribute your expertise to the community.',
    icon: '🌴'
  }
];

const JourneyStages: React.FC = () => {
  const [activeStage, setActiveStage] = useState(0);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        }
      },
      { threshold: 0.1 }
    );

    const section = document.getElementById('journey');
    if (section) observer.observe(section);

    return () => {
      if (section) observer.unobserve(section);
    };
  }, []);

  useEffect(() => {
    if (!isInView) return;

    const interval = setInterval(() => {
      setActiveStage((prev) => (prev === journeyStages.length - 1 ? 0 : prev + 1));
    }, 4000);

    return () => clearInterval(interval);
  }, [isInView]);

  return (
    <section id="journey" className="section">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-block mb-6 px-4 py-2 rounded-full bg-white shadow-subtle border border-gray-100">
            <p className="text-ehrdc-teal font-medium">Lifelong Development</p>
          </div>
          <h2 className="text-3xl md:text-5xl font-display font-semibold mb-6">Your Complete Journey</h2>
          <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
            The Emirati Human Development platform supports you through every stage of your career development,
            from early education through retirement.
          </p>
        </div>

        {/* Journey Timeline */}
        <div className="relative mb-12 pl-6 md:pl-0">
          <div className="hidden md:grid grid-cols-8 gap-0 mb-8">
            {journeyStages.map((stage, index) => (
              <div key={stage.id} className="relative" onClick={() => setActiveStage(index)}>
                <div
                  className={cn(
                    "stage-indicator cursor-pointer mx-auto",
                    activeStage >= index ? "active" : ""
                  )}
                />
                {index < journeyStages.length - 1 && (
                  <div
                    className={cn(
                      "stage-connector",
                      activeStage > index ? "active" : ""
                    )}
                    style={{
                      transitionDelay: `${(index) * 100}ms`
                    }}
                  />
                )}
                <div className="mt-2 text-center opacity-70 text-xs">
                  {stage.title}
                </div>
              </div>
            ))}
          </div>

          {/* Stage Details */}
          <div className="bg-white rounded-2xl shadow-card p-8 transition-all duration-500 hover:shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center mb-6">
              <div className="text-4xl mb-4 md:mb-0 md:mr-6">{journeyStages[activeStage].icon}</div>
              <div>
                <h3 className="text-2xl font-display font-medium text-ehrdc-teal">
                  {journeyStages[activeStage].title}
                </h3>
                <div className="text-sm text-foreground/60">
                  Stage {activeStage + 1} of {journeyStages.length}
                </div>
              </div>
            </div>
            <p className="text-foreground/80 leading-relaxed">
              {journeyStages[activeStage].description}
            </p>
          </div>

          {/* Mobile Timeline */}
          <div className="md:hidden flex overflow-x-auto space-x-4 py-6 px-2 -mx-6 mt-8">
            {journeyStages.map((stage, index) => (
              <div
                key={stage.id}
                className={cn(
                  "flex-shrink-0 px-4 py-2 rounded-full border transition-all duration-300 cursor-pointer",
                  activeStage === index
                    ? "bg-ehrdc-teal text-white border-ehrdc-teal"
                    : "bg-white text-foreground/70 border-gray-200"
                )}
                onClick={() => setActiveStage(index)}
              >
                <span>{stage.title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default JourneyStages;
