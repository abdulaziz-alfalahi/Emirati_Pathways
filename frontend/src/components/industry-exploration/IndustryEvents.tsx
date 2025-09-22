
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar, MapPin, Users, Clock, ExternalLink, 
  Filter, CalendarDays, Building, Ticket
} from 'lucide-react';

interface IndustryEvent {
  id: string;
  title: string;
  industry: string;
  date: string;
  time: string;
  location: string;
  type: 'conference' | 'workshop' | 'networking' | 'seminar' | 'exhibition';
  description: string;
  organizer: string;
  capacity: number;
  registered: number;
  price: string;
  speakers: string[];
  topics: string[];
  registrationDeadline: string;
  isVirtual: boolean;
}

export const IndustryEvents: React.FC = () => {
  const [selectedIndustry, setSelectedIndustry] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState<IndustryEvent | null>(null);

  const events: IndustryEvent[] = [
    {
      id: '1',
      title: 'UAE Tech Summit 2024',
      industry: 'Technology',
      date: '2024-03-15',
      time: '09:00 AM - 06:00 PM',
      location: 'Dubai World Trade Centre',
      type: 'conference',
      description: 'Annual technology summit bringing together industry leaders, innovators, and tech enthusiasts to explore the future of technology in the UAE.',
      organizer: 'Dubai Chamber of Digital Economy',
      capacity: 2000,
      registered: 1650,
      price: 'AED 1,200',
      speakers: ['Dr. Aisha Al Busmait', 'Omar Al Olama', 'Sarah Johnson'],
      topics: ['AI & Machine Learning', 'Blockchain', 'IoT', 'Digital Transformation'],
      registrationDeadline: '2024-03-10',
      isVirtual: false
    },
    {
      id: '2',
      title: 'Fintech Innovation Workshop',
      industry: 'Financial Services',
      date: '2024-03-22',
      time: '02:00 PM - 05:00 PM',
      location: 'DIFC Innovation Hub',
      type: 'workshop',
      description: 'Hands-on workshop exploring the latest fintech innovations and their implementation in the UAE banking sector.',
      organizer: 'DIFC Fintech Hive',
      capacity: 150,
      registered: 95,
      price: 'AED 500',
      speakers: ['Ahmed Al Sharif', 'Lisa Chen', 'Mohammad Al Gergawi'],
      topics: ['Digital Banking', 'Payment Solutions', 'RegTech', 'Open Banking'],
      registrationDeadline: '2024-03-20',
      isVirtual: false
    },
    {
      id: '3',
      title: 'Healthcare Innovation Forum',
      industry: 'Healthcare',
      date: '2024-04-05',
      time: '10:00 AM - 04:00 PM',
      location: 'Cleveland Clinic Abu Dhabi',
      type: 'seminar',
      description: 'Forum discussing the latest healthcare innovations, telemedicine, and digital health solutions in the UAE.',
      organizer: 'UAE Ministry of Health',
      capacity: 300,
      registered: 220,
      price: 'Free',
      speakers: ['Dr. Fatima Al Jasmi', 'Dr. John Smith', 'Eng. Khalifa Al Kindi'],
      topics: ['Telemedicine', 'AI in Healthcare', 'Digital Health Records', 'Medical Devices'],
      registrationDeadline: '2024-04-01',
      isVirtual: true
    },
    {
      id: '4',
      title: 'Hospitality Excellence Awards',
      industry: 'Tourism & Hospitality',
      date: '2024-04-12',
      time: '07:00 PM - 11:00 PM',
      location: 'Burj Al Arab',
      type: 'networking',
      description: 'Annual awards ceremony celebrating excellence in UAE hospitality industry with networking opportunities.',
      organizer: 'UAE Hospitality Association',
      capacity: 500,
      registered: 380,
      price: 'AED 800',
      speakers: ['Sheikh Ahmed bin Saeed', 'Gerald Lawless', 'Haitham Mattar'],
      topics: ['Customer Experience', 'Sustainable Tourism', 'Digital Innovation', 'Cultural Heritage'],
      registrationDeadline: '2024-04-08',
      isVirtual: false
    },
    {
      id: '5',
      title: 'ADIPEC Energy Conference',
      industry: 'Oil & Gas',
      date: '2024-05-20',
      time: '08:00 AM - 06:00 PM',
      location: 'ADNEC, Abu Dhabi',
      type: 'exhibition',
      description: 'Leading energy exhibition and conference showcasing the latest in oil, gas, and renewable energy technologies.',
      organizer: 'ADNOC',
      capacity: 5000,
      registered: 4200,
      price: 'AED 2,000',
      speakers: ['Dr. Sultan Al Jaber', 'Vicki Hollub', 'Patrick Pouyanné'],
      topics: ['Energy Transition', 'Carbon Capture', 'Renewable Energy', 'Digital Oil Field'],
      registrationDeadline: '2024-05-15',
      isVirtual: false
    },
    {
      id: '6',
      title: 'Real Estate Investment Summit',
      industry: 'Real Estate',
      date: '2024-05-28',
      time: '09:00 AM - 05:00 PM',
      location: 'JW Marriott Marquis Dubai',
      type: 'conference',
      description: 'Premier real estate investment conference bringing together developers, investors, and industry experts.',
      organizer: 'Dubai Land Department',
      capacity: 800,
      registered: 620,
      price: 'AED 1,500',
      speakers: ['Ahmed Al Matrooshi', 'Mohamed Al Shaiba', 'Sarah Bradford'],
      topics: ['Market Trends', 'Investment Opportunities', 'PropTech', 'Sustainable Development'],
      registrationDeadline: '2024-05-25',
      isVirtual: false
    }
  ];

  const industries = ['all', 'Technology', 'Financial Services', 'Healthcare', 'Tourism & Hospitality', 'Oil & Gas', 'Real Estate'];
  const eventTypes = ['all', 'conference', 'workshop', 'networking', 'seminar', 'exhibition'];

  const filteredEvents = events.filter(event => {
    const matchesIndustry = selectedIndustry === 'all' || event.industry === selectedIndustry;
    const matchesType = selectedType === 'all' || event.type === selectedType;
    return matchesIndustry && matchesType;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'conference': return 'bg-blue-100 text-blue-800';
      case 'workshop': return 'bg-green-100 text-green-800';
      case 'networking': return 'bg-purple-100 text-purple-800';
      case 'seminar': return 'bg-yellow-100 text-yellow-800';
      case 'exhibition': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-ehrdc-teal" />
            Industry Events & Conferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            Discover upcoming industry events, conferences, and networking opportunities across UAE's major sectors.
          </p>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Industries" />
              </SelectTrigger>
              <SelectContent>
                {industries.map(industry => (
                  <SelectItem key={industry} value={industry}>
                    {industry === 'all' ? 'All Industries' : industry}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full sm:w-48">
                <Ticket className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                {eventTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Events Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {filteredEvents.map((event) => (
              <Card key={event.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{event.title}</h3>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-ehrdc-teal/10 text-ehrdc-teal">
                          {event.industry}
                        </Badge>
                        <Badge variant="outline" className={getTypeColor(event.type)}>
                          {event.type}
                        </Badge>
                        {event.isVirtual && (
                          <Badge variant="outline" className="bg-orange-100 text-orange-800">
                            Virtual
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-ehrdc-teal">{event.price}</p>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4">{event.description}</p>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <CalendarDays className="h-4 w-4 text-ehrdc-teal" />
                      <span>{formatDate(event.date)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-ehrdc-teal" />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-ehrdc-teal" />
                      <span>{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Building className="h-4 w-4 text-ehrdc-teal" />
                      <span>Organized by {event.organizer}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-ehrdc-teal" />
                      <span>{event.registered}/{event.capacity} registered</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Deadline: {formatDate(event.registrationDeadline)}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      className="flex-1 bg-ehrdc-teal hover:bg-ehrdc-dark-teal"
                      onClick={() => setSelectedEvent(event)}
                    >
                      View Details
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Register
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredEvents.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Events Found</h3>
              <p className="text-muted-foreground">
                Try adjusting your filter criteria to see more events.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Event Details Modal */}
      {selectedEvent && (
        <Card className="border-ehrdc-teal">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold">{selectedEvent.title}</h3>
              <Button
                variant="outline"
                onClick={() => setSelectedEvent(null)}
                className="text-ehrdc-teal border-ehrdc-teal"
              >
                Close
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Event Details</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CalendarDays className="h-5 w-5 text-ehrdc-teal" />
                    <div>
                      <p className="font-medium">{formatDate(selectedEvent.date)}</p>
                      <p className="text-sm text-muted-foreground">{selectedEvent.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-ehrdc-teal" />
                    <div>
                      <p className="font-medium">{selectedEvent.location}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedEvent.isVirtual ? 'Virtual Event' : 'In-Person Event'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Building className="h-5 w-5 text-ehrdc-teal" />
                    <div>
                      <p className="font-medium">{selectedEvent.organizer}</p>
                      <p className="text-sm text-muted-foreground">Event Organizer</p>
                    </div>
                  </div>
                </div>

                <h4 className="font-semibold mb-3 mt-6">Key Topics</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedEvent.topics.map((topic, index) => (
                    <Badge key={index} variant="outline">{topic}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Featured Speakers</h4>
                <ul className="space-y-2 mb-6">
                  {selectedEvent.speakers.map((speaker, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-ehrdc-teal" />
                      <span className="text-sm">{speaker}</span>
                    </li>
                  ))}
                </ul>

                <h4 className="font-semibold mb-3">Registration Info</h4>
                <div className="bg-ehrdc-teal/5 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Price:</span>
                    <span className="font-medium">{selectedEvent.price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Capacity:</span>
                    <span className="font-medium">{selectedEvent.capacity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Registered:</span>
                    <span className="font-medium">{selectedEvent.registered}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Deadline:</span>
                    <span className="font-medium">{formatDate(selectedEvent.registrationDeadline)}</span>
                  </div>
                </div>

                <Button className="w-full mt-4 bg-ehrdc-teal hover:bg-ehrdc-dark-teal">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Register Now
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
