
import React from 'react';
import { ServiceCard } from './ServiceCard';
import { InformationCard } from './InformationCard';
import { ProfileCard } from './ProfileCard';
import { BookOpen, Users, Award, Code, GraduationCap, Briefcase } from 'lucide-react';

export const CardsShowcase: React.FC = () => {
  return (
    <div className="min-h-screen bg-ehrdc-neutral-light/30 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-ehrdc-neutral-dark mb-2">
            Dubai Government Card Components
          </h1>
          <p className="text-ehrdc-neutral-dark/70">
            Standardized card components following Dubai Government design patterns
          </p>
        </div>

        {/* Service Cards */}
        <section>
          <h2 className="text-2xl font-semibold text-ehrdc-neutral-dark mb-4">Service Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ServiceCard
              title="Career Development"
              description="Explore career paths and skill development opportunities designed for UAE nationals."
              category="Professional Growth"
              duration="Self-paced"
              users={1247}
              status="popular"
              icon={<Briefcase className="h-5 w-5" />}
              onClick={() => console.log('Career Development clicked')}
            />
            
            <ServiceCard
              title="Educational Programs"
              description="Access educational resources and training programs to enhance your knowledge."
              category="Education"
              duration="3-6 months"
              users={892}
              status="available"
              icon={<GraduationCap className="h-5 w-5" />}
              onClick={() => console.log('Educational Programs clicked')}
            />
            
            <ServiceCard
              title="Digital Skills"
              description="Learn essential digital skills for the modern workplace and future economy."
              category="Technology"
              duration="2-4 weeks"
              users={0}
              status="coming-soon"
              icon={<Code className="h-5 w-5" />}
            />
          </div>
        </section>

        {/* Information Cards */}
        <section>
          <h2 className="text-2xl font-semibold text-ehrdc-neutral-dark mb-4">Information Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InformationCard
              title="System Maintenance Notice"
              description="The platform will undergo scheduled maintenance this weekend. Services may be temporarily unavailable."
              type="warning"
              priority="high"
              date="Jan 15, 2024"
              tags={['Maintenance', 'System']}
            />
            
            <InformationCard
              title="New Features Available"
              description="We've added new portfolio features and enhanced assessment tools for better user experience."
              type="success"
              priority="medium"
              date="Jan 10, 2024"
              tags={['Update', 'Features']}
            />
            
            <InformationCard
              title="Welcome to EHRDC Platform"
              description="Discover opportunities for growth and development through our comprehensive platform designed for UAE nationals."
              type="announcement"
              priority="medium"
              date="Jan 1, 2024"
              tags={['Welcome', 'Getting Started']}
            />
            
            <InformationCard
              title="Training Completion Reminder"
              description="Don't forget to complete your ongoing training modules before the deadline approaches."
              type="info"
              priority="low"
              date="Jan 8, 2024"
              tags={['Training', 'Reminder']}
            />
          </div>
        </section>

        {/* Profile Cards */}
        <section>
          <h2 className="text-2xl font-semibold text-ehrdc-neutral-dark mb-4">Profile Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <ProfileCard
              name="Ahmed Al Mansouri"
              title="Senior Software Engineer"
              organization="Dubai Municipality"
              location="Dubai, UAE"
              email="ahmed.almansouri@dm.gov.ae"
              joinDate="March 2023"
              skills={['React', 'TypeScript', 'Node.js', 'AWS', 'Leadership']}
              verified={true}
              onAction={() => console.log('View Ahmed profile')}
            />
            
            <ProfileCard
              name="Fatima Al Zahra"
              title="Data Analyst"
              organization="Dubai Smart City Office"
              location="Dubai, UAE"
              email="fatima.alzahra@dsc.gov.ae"
              joinDate="July 2022"
              skills={['Python', 'SQL', 'Tableau', 'Statistics']}
              verified={true}
              onAction={() => console.log('View Fatima profile')}
            />
            
            <ProfileCard
              name="Mohammed Al Rashid"
              title="UX Designer"
              organization="Dubai Digital Authority"
              location="Dubai, UAE"
              email="mohammed.alrashid@dda.gov.ae"
              joinDate="January 2024"
              skills={['Figma', 'Design Systems', 'User Research']}
              verified={false}
              onAction={() => console.log('View Mohammed profile')}
            />
          </div>
        </section>
      </div>
    </div>
  );
};
