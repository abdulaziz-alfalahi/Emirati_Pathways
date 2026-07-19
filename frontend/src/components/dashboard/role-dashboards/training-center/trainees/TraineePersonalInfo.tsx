
import React from 'react';
import { Separator } from '@/components/ui/separator';
import { User, Mail, Phone, Calendar, MapPin, GraduationCap, Briefcase } from 'lucide-react';
import { Trainee } from '@/types/training-center';

interface TraineePersonalInfoProps {
  trainee: Trainee;
}

const TraineePersonalInfo: React.FC<TraineePersonalInfoProps> = ({ trainee }) => {
  // Mock extended data - in a real app, this would come from an API or be part of the trainee object
  const extendedData = {
    phone: '+971 50 123 4567',
    address: 'Dubai, United Arab Emirates',
    birthDate: '1998-05-15',
    education: 'Bachelor of Computer Science, Dubai University',
    emergencyContact: 'Mohammed Hassan (Father) - +971 50 987 6543',
    joinDate: '2025-01-15',
    previousExperience: 'Intern at Tech Solutions (3 months)'
  };
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium mb-2">Personal Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <InfoItem icon={<User />} label="Full Name" value={trainee.name} />
          <InfoItem icon={<Mail />} label="Email" value={trainee.email} />
          <InfoItem icon={<Phone />} label="Phone" value={extendedData.phone} />
          <InfoItem icon={<Calendar />} label="Date of Birth" value={new Date(extendedData.birthDate).toLocaleDateString()} />
          <InfoItem icon={<MapPin />} label="Address" value={extendedData.address} />
        </div>
        
        <div className="space-y-4">
          <InfoItem 
            icon={<Calendar />} 
            label="Enrollment Date" 
            value={new Date(trainee.enrollDate).toLocaleDateString()}
          />
          <InfoItem 
            icon={<GraduationCap />} 
            label="Education" 
            value={extendedData.education}
          />
          <InfoItem 
            icon={<Briefcase />} 
            label="Previous Experience" 
            value={extendedData.previousExperience}
          />
          <InfoItem 
            icon={<Phone />} 
            label="Emergency Contact" 
            value={extendedData.emergencyContact}
          />
        </div>
      </div>
      
      <Separator className="my-4" />
      
      <div>
        <h4 className="font-medium mb-2">Additional Notes</h4>
        <p className="text-sm text-muted-foreground">
          Highly motivated trainee with strong interest in technology and digital marketing.
          Shows excellent progress in practical assignments and team collaboration.
        </p>
      </div>
    </div>
  );
};

const InfoItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) => (
  <div className="flex items-start">
    <div className="mt-0.5 me-3 text-muted-foreground">
      {icon}
    </div>
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  </div>
);

export default TraineePersonalInfo;
