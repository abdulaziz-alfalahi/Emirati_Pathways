
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Calendar, Video, Phone } from 'lucide-react';

export const ConnectionManager: React.FC = () => {
  const connections = [
    {
      id: 1,
      mentor: 'Sarah Al-Mansouri',
      status: 'Active',
      nextSession: '2024-01-25 10:00 AM',
      totalSessions: 8,
      lastContact: '2 days ago'
    },
    {
      id: 2,
      mentor: 'Ahmed Hassan',
      status: 'Pending',
      nextSession: null,
      totalSessions: 0,
      lastContact: 'Never'
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-ehrdc-teal" />
            Connection Manager
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {connections.map((connection) => (
              <Card key={connection.id} className="border border-ehrdc-neutral-light">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{connection.mentor}</h3>
                      <Badge variant={connection.status === 'Active' ? 'default' : 'secondary'}>
                        {connection.status}
                      </Badge>
                    </div>
                    <div className="text-end text-sm text-muted-foreground">
                      <div>Sessions: {connection.totalSessions}</div>
                      <div>Last contact: {connection.lastContact}</div>
                    </div>
                  </div>

                  {connection.nextSession && (
                    <div className="bg-blue-50 p-3 rounded-lg mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium">Next Session: {connection.nextSession}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button size="sm" className="bg-ehrdc-teal hover:bg-ehrdc-dark-teal">
                      <MessageSquare className="h-4 w-4 me-1" />
                      Message
                    </Button>
                    <Button size="sm" variant="outline">
                      <Video className="h-4 w-4 me-1" />
                      Video Call
                    </Button>
                    <Button size="sm" variant="outline">
                      <Calendar className="h-4 w-4 me-1" />
                      Schedule
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
