
import React from 'react';
import { DubaiCard, DubaiCardHeader, DubaiCardTitle, DubaiCardDescription, DubaiCardContent, DubaiCardFooter } from '@/components/ui/dubai-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MapPin, Mail, Phone, Calendar, ExternalLink } from 'lucide-react';

interface ProfileCardProps {
  name: string;
  title: string;
  organization?: string;
  location?: string;
  email?: string;
  phone?: string;
  joinDate?: string;
  avatar?: string;
  skills?: string[];
  verified?: boolean;
  onClick?: () => void;
  actionLabel?: string;
  onAction?: () => void;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  name,
  title,
  organization,
  location,
  email,
  phone,
  joinDate,
  avatar,
  skills = [],
  verified = false,
  onClick,
  actionLabel = 'View Profile',
  onAction
}) => {
  return (
    <DubaiCard 
      variant="profile" 
      interactive={!!onClick}
      onClick={onClick}
      className="h-full"
    >
      <DubaiCardHeader>
        <div className="flex items-start space-x-4">
          <Avatar className="h-16 w-16 border-2 border-ehrdc-teal/20">
            <AvatarImage src={avatar} alt={name} />
            <AvatarFallback className="bg-ehrdc-teal/10 text-ehrdc-teal font-semibold">
              {name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <DubaiCardTitle className="text-lg">{name}</DubaiCardTitle>
              {verified && (
                <Badge className="bg-ehrdc-teal text-white text-xs">Verified</Badge>
              )}
            </div>
            <DubaiCardDescription className="font-medium text-ehrdc-neutral-dark/80">
              {title}
            </DubaiCardDescription>
            {organization && (
              <p className="text-sm text-ehrdc-teal">{organization}</p>
            )}
          </div>
        </div>
      </DubaiCardHeader>
      
      <DubaiCardContent>
        <div className="space-y-3">
          {location && (
            <div className="flex items-center space-x-2 text-sm text-ehrdc-neutral-dark/70">
              <MapPin className="h-4 w-4" />
              <span>{location}</span>
            </div>
          )}
          
          {email && (
            <div className="flex items-center space-x-2 text-sm text-ehrdc-neutral-dark/70">
              <Mail className="h-4 w-4" />
              <span>{email}</span>
            </div>
          )}
          
          {phone && (
            <div className="flex items-center space-x-2 text-sm text-ehrdc-neutral-dark/70">
              <Phone className="h-4 w-4" />
              <span>{phone}</span>
            </div>
          )}
          
          {joinDate && (
            <div className="flex items-center space-x-2 text-sm text-ehrdc-neutral-dark/70">
              <Calendar className="h-4 w-4" />
              <span>Joined {joinDate}</span>
            </div>
          )}
          
          {skills.length > 0 && (
            <div>
              <p className="text-sm font-medium text-ehrdc-neutral-dark mb-2">Skills</p>
              <div className="flex flex-wrap gap-1">
                {skills.slice(0, 3).map((skill, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {skill}
                  </Badge>
                ))}
                {skills.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{skills.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </DubaiCardContent>

      {onAction && (
        <DubaiCardFooter>
          <Button 
            variant="outline" 
            className="w-full border-ehrdc-teal text-ehrdc-teal hover:bg-ehrdc-teal hover:text-white"
            onClick={(e) => {
              e.stopPropagation();
              onAction();
            }}
          >
            {actionLabel}
            <ExternalLink className="ms-2 h-4 w-4" />
          </Button>
        </DubaiCardFooter>
      )}
    </DubaiCard>
  );
};
