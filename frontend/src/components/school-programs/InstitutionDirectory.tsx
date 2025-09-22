
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { School, MapPin, Globe, Mail, Phone, Star } from 'lucide-react';

const InstitutionDirectory: React.FC = () => {
  // Mock data for educational institutions
  const institutions = [
    {
      id: '1',
      name: 'Dubai International School',
      type: 'International',
      location: 'Al Barsha, Dubai',
      description: 'Leading international school offering comprehensive STEM programs and innovative learning experiences.',
      programsCount: 8,
      rating: 4.8,
      specializations: ['STEM', 'Languages', 'Arts'],
      website: 'https://dubaiintl.ae',
      email: 'info@dubaiintl.ae',
      phone: '+971-4-123-4567',
      established: 1995,
      logoUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=200&h=200&fit=crop&crop=center'
    },
    {
      id: '2',
      name: 'Emirates Heritage Academy',
      type: 'Cultural',
      location: 'Jumeirah, Dubai',
      description: 'Specialized academy focusing on Emirati cultural heritage, Arabic language, and traditional arts.',
      programsCount: 5,
      rating: 4.9,
      specializations: ['Languages', 'Culture', 'Arts'],
      website: 'https://heritage.ae',
      email: 'contact@heritage.ae',
      phone: '+971-4-234-5678',
      established: 2008,
      logoUrl: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=200&h=200&fit=crop&crop=center'
    },
    {
      id: '3',
      name: 'Business Leaders Academy',
      type: 'Specialized',
      location: 'Downtown Dubai',
      description: 'Innovative academy preparing young minds for future business leadership and entrepreneurship.',
      programsCount: 4,
      rating: 4.7,
      specializations: ['Business', 'Leadership', 'Innovation'],
      website: 'https://businessleaders.ae',
      email: 'admissions@businessleaders.ae',
      phone: '+971-4-345-6789',
      established: 2015,
      logoUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=200&h=200&fit=crop&crop=center'
    }
  ];

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'International': return 'bg-blue-100 text-blue-800';
      case 'Cultural': return 'bg-green-100 text-green-800';
      case 'Specialized': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {institutions.map((institution) => (
          <Card key={institution.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-ehrdc-neutral-light flex items-center justify-center">
                    <img 
                      src={institution.logoUrl} 
                      alt={institution.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.style.display = 'none';
                        const nextElement = target.nextElementSibling as HTMLElement;
                        if (nextElement) {
                          nextElement.style.display = 'flex';
                        }
                      }}
                    />
                    <School className="h-6 w-6 text-ehrdc-teal" style={{ display: 'none' }} />
                  </div>
                  <div>
                    <CardTitle className="text-lg leading-tight">{institution.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={getTypeColor(institution.type)} variant="secondary">
                        {institution.type}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500 fill-current" />
                        <span className="text-xs text-muted-foreground">{institution.rating}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {institution.description}
              </p>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-ehrdc-teal flex-shrink-0" />
                  <span className="text-muted-foreground">{institution.location}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <School className="h-4 w-4 text-ehrdc-teal flex-shrink-0" />
                  <span className="text-muted-foreground">
                    {institution.programsCount} programs • Est. {institution.established}
                  </span>
                </div>
              </div>
              
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-2">Specializations</div>
                <div className="flex flex-wrap gap-1">
                  {institution.specializations.map((spec) => (
                    <Badge key={spec} variant="outline" className="text-xs">
                      {spec}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="pt-2 border-t border-ehrdc-neutral-light/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      <span>Email</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      <span>Phone</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      <span>Website</span>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="text-ehrdc-teal border-ehrdc-teal hover:bg-ehrdc-teal hover:text-white">
                    View Programs
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default InstitutionDirectory;
