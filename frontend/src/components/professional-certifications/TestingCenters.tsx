
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Phone, Calendar, Clock, Award } from 'lucide-react';

export const TestingCenters: React.FC = () => {
  const [selectedEmirate, setSelectedEmirate] = useState('all');
  const [selectedProvider, setSelectedProvider] = useState('all');

  const testingCenters = [
    {
      id: '1',
      name: 'Pearson VUE Dubai',
      address: 'Dubai World Trade Centre, Sheikh Zayed Road, Dubai',
      emirate: 'Dubai',
      phone: '+971 4 308 6000',
      email: 'dubai@pearsonvue.com',
      website: 'www.pearsonvue.com/dubai',
      operatingHours: 'Sun-Thu: 8:00 AM - 8:00 PM, Fri-Sat: 9:00 AM - 5:00 PM',
      availableExams: ['AWS', 'Microsoft', 'Cisco', 'CompTIA', 'Oracle', 'Adobe'],
      facilities: ['AC Rooms', 'Parking', 'Wheelchair Access', 'Cafe'],
      rating: 4.8,
      nextAvailable: '2024-03-15',
      location: { lat: 25.2319, lng: 55.3103 }
    },
    {
      id: '2',
      name: 'Prometric Abu Dhabi',
      address: 'Khalifa Business Park, Al Qurm District, Abu Dhabi',
      emirate: 'Abu Dhabi',
      phone: '+971 2 445 7000',
      email: 'abudhabi@prometric.com',
      website: 'www.prometric.com/abudhabi',
      operatingHours: 'Sun-Thu: 7:30 AM - 7:30 PM, Fri-Sat: 9:00 AM - 4:00 PM',
      availableExams: ['PMP', 'CFA', 'FRM', 'CISSP', 'CISA', 'CPA'],
      facilities: ['Secure Lockers', 'Parking', 'Quiet Environment', 'ID Verification'],
      rating: 4.7,
      nextAvailable: '2024-03-18',
      location: { lat: 24.4539, lng: 54.3773 }
    },
    {
      id: '3',
      name: 'PSI Services Sharjah',
      address: 'Sharjah University City, Sharjah',
      emirate: 'Sharjah',
      phone: '+971 6 505 9000',
      email: 'sharjah@psiservices.com',
      website: 'www.psiservices.com/sharjah',
      operatingHours: 'Sun-Thu: 8:00 AM - 6:00 PM, Fri-Sat: 10:00 AM - 3:00 PM',
      availableExams: ['IELTS', 'TOEFL', 'GRE', 'GMAT', 'SAT', 'Professional Licenses'],
      facilities: ['Audio Testing', 'Computer Labs', 'Student Parking', 'Quiet Zones'],
      rating: 4.6,
      nextAvailable: '2024-03-20',
      location: { lat: 25.2854, lng: 55.3102 }
    }
  ];

  const filteredCenters = testingCenters.filter(center => {
    const matchesEmirate = selectedEmirate === 'all' || center.emirate === selectedEmirate;
    const matchesProvider = selectedProvider === 'all' || 
      center.name.toLowerCase().includes(selectedProvider.toLowerCase());
    return matchesEmirate && matchesProvider;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Testing Centers</h2>
          <p className="text-muted-foreground">Find authorized testing centers across the UAE</p>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Emirate</label>
              <Select value={selectedEmirate} onValueChange={setSelectedEmirate}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Emirate" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Emirates</SelectItem>
                  <SelectItem value="Dubai">Dubai</SelectItem>
                  <SelectItem value="Abu Dhabi">Abu Dhabi</SelectItem>
                  <SelectItem value="Sharjah">Sharjah</SelectItem>
                  <SelectItem value="Ajman">Ajman</SelectItem>
                  <SelectItem value="Ras Al Khaimah">Ras Al Khaimah</SelectItem>
                  <SelectItem value="Fujairah">Fujairah</SelectItem>
                  <SelectItem value="Umm Al Quwain">Umm Al Quwain</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Testing Provider</label>
              <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Providers</SelectItem>
                  <SelectItem value="pearson">Pearson VUE</SelectItem>
                  <SelectItem value="prometric">Prometric</SelectItem>
                  <SelectItem value="psi">PSI Services</SelectItem>
                  <SelectItem value="castle">Castle Worldwide</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button className="w-full bg-slate-800 hover:bg-slate-700">
                <MapPin className="h-4 w-4 mr-2" />
                View on Map
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Testing Centers List */}
      <div className="space-y-6">
        {filteredCenters.map((center) => (
          <Card key={center.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold mb-2">{center.name}</h3>
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <MapPin className="h-4 w-4" />
                        <span className="text-sm">{center.address}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <Phone className="h-4 w-4" />
                        <span className="text-sm">{center.phone}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{center.rating} ⭐</Badge>
                      <Badge className="bg-green-100 text-green-800">{center.emirate}</Badge>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="font-medium mb-2 text-sm">Operating Hours</h4>
                      <p className="text-sm text-muted-foreground">{center.operatingHours}</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2 text-sm">Next Available</h4>
                      <div className="flex items-center gap-1 text-sm text-green-600">
                        <Calendar className="h-3 w-3" />
                        {center.nextAvailable}
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="font-medium mb-2 text-sm">Available Exams</h4>
                    <div className="flex flex-wrap gap-2">
                      {center.availableExams.map((exam, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          <Award className="h-3 w-3 mr-1" />
                          {exam}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="font-medium mb-2 text-sm">Facilities</h4>
                    <div className="flex flex-wrap gap-2">
                      {center.facilities.map((facility, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {facility}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 lg:w-48">
                  <Button className="w-full bg-slate-800 hover:bg-slate-700">
                    <Calendar className="h-4 w-4 mr-2" />
                    Book Exam
                  </Button>
                  <Button variant="outline" className="w-full">
                    <MapPin className="h-4 w-4 mr-2" />
                    Directions
                  </Button>
                  <Button variant="outline" className="w-full">
                    View Details
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Phone className="h-4 w-4 mr-2" />
                    Contact
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Map Placeholder */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Testing Centers Map</h3>
          <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Interactive map of testing centers</p>
              <p className="text-sm text-gray-500">View locations, get directions, and check availability</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Booking */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Quick Exam Booking</h3>
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Certification</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select Certification" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aws-saa">AWS Solutions Architect</SelectItem>
                  <SelectItem value="pmp">Project Management Professional</SelectItem>
                  <SelectItem value="cfa-1">CFA Level 1</SelectItem>
                  <SelectItem value="cissp">CISSP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Preferred Date</label>
              <Input type="date" />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Location</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Choose Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dubai">Dubai</SelectItem>
                  <SelectItem value="abudhabi">Abu Dhabi</SelectItem>
                  <SelectItem value="sharjah">Sharjah</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button className="w-full bg-slate-800 hover:bg-slate-700">
                Check Availability
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
