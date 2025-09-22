
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Heart, Phone, MessageCircle, MapPin, Calendar, Shield, Star } from 'lucide-react';

export const SupportNetwork: React.FC = () => {
  const supportOrganizations = [
    {
      name: 'UAE Veterans Association',
      type: 'Veteran Support',
      services: ['Peer counseling', 'Career guidance', 'Social events'],
      contact: '+971-4-123-4567',
      location: 'Dubai, Abu Dhabi',
      members: '2,500+',
      rating: 4.9
    },
    {
      name: 'Military Family Support Center',
      type: 'Family Services',
      services: ['Family counseling', 'Educational support', 'Emergency assistance'],
      contact: '+971-2-987-6543',
      location: 'All Emirates',
      members: '1,800+',
      rating: 4.8
    }
  ];

  return (
    <div className="space-y-6">
      {/* Support Organizations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-ehrdc-teal">Veteran Support Organizations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {supportOrganizations.map((org, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{org.name}</h3>
                    <Badge variant="outline">{org.type}</Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm">{org.rating}</span>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4 mb-3">
                  <div>
                    <h4 className="font-medium mb-2">Services:</h4>
                    <div className="space-y-1">
                      {org.services.map((service, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Heart className="h-3 w-3 text-red-500" />
                          <span className="text-sm">{service}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-ehrdc-teal" />
                      <span className="text-sm">{org.contact}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-ehrdc-teal" />
                      <span className="text-sm">{org.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-ehrdc-teal" />
                      <span className="text-sm">{org.members} members</span>
                    </div>
                  </div>
                </div>
                
                <Button className="bg-ehrdc-teal hover:bg-ehrdc-teal/90">
                  Connect Now
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Mental Health Resources */}
      <Card>
        <CardHeader>
          <CardTitle className="text-ehrdc-teal">Mental Health & Wellness Resources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <Shield className="h-8 w-8 text-blue-600 mb-3" />
              <h3 className="font-semibold mb-2">24/7 Support Hotline</h3>
              <p className="text-sm text-gray-600 mb-3">Confidential support available anytime</p>
              <p className="font-mono text-lg">800-VETERAN</p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <MessageCircle className="h-8 w-8 text-green-600 mb-3" />
              <h3 className="font-semibold mb-2">Peer Support Groups</h3>
              <p className="text-sm text-gray-600 mb-3">Connect with fellow veterans in group sessions</p>
              <Button size="sm" variant="outline">Join Group</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
