
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Save, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { mentorshipService } from '@/services/mentorshipService';
import type { MentorProfile } from '@/types/mentorship';

const EXPERTISE_OPTIONS = [
  'Software Development', 'Data Science', 'Product Management', 'Digital Marketing',
  'UX/UI Design', 'Business Strategy', 'Finance', 'Healthcare', 'Education',
  'Engineering', 'Sales', 'Human Resources', 'Project Management', 'Consulting'
];

const DAYS_OF_WEEK = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

const TIME_SLOTS = [
  'Early Morning (6-9 AM)', 'Morning (9-12 PM)', 'Afternoon (12-5 PM)', 
  'Evening (5-8 PM)', 'Night (8-11 PM)'
];

const TIMEZONES = [
  'UTC', 'UTC+4 (UAE)', 'UTC+3 (Saudi Arabia)', 'UTC+2 (Egypt)', 
  'UTC+1 (Europe)', 'UTC-5 (US East)', 'UTC-8 (US West)'
];

export const MentorProfileSetup: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<MentorProfile>({
    expertise: [],
    years_experience: 1,
    bio: '',
    availability: {
      days: [],
      hours: [],
      timezone: 'UTC+4 (UAE)'
    },
    is_active: true
  });

  const [newExpertise, setNewExpertise] = useState('');

  useEffect(() => {
    loadExistingProfile();
  }, []);

  const loadExistingProfile = async () => {
    try {
      const existingProfile = await mentorshipService.getMentorProfile();
      if (existingProfile) {
        setProfile({
          expertise: existingProfile.expertise,
          years_experience: existingProfile.years_experience || 1,
          bio: existingProfile.bio || '',
          availability: existingProfile.availability || {
            days: [],
            hours: [],
            timezone: 'UTC+4 (UAE)'
          },
          is_active: existingProfile.is_active
        });
      }
    } catch (error) {
      // Profile doesn't exist yet, that's fine
    }
  };

  const handleAddExpertise = (expertise: string) => {
    if (expertise && !profile.expertise.includes(expertise)) {
      setProfile(prev => ({
        ...prev,
        expertise: [...prev.expertise, expertise]
      }));
    }
    setNewExpertise('');
  };

  const handleRemoveExpertise = (expertise: string) => {
    setProfile(prev => ({
      ...prev,
      expertise: prev.expertise.filter(e => e !== expertise)
    }));
  };

  const handleAvailabilityChange = (type: 'days' | 'hours', value: string, checked: boolean) => {
    setProfile(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [type]: checked
          ? [...prev.availability[type], value]
          : prev.availability[type].filter(item => item !== value)
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (profile.expertise.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one area of expertise",
        variant: "destructive"
      });
      return;
    }

    if (profile.availability.days.length === 0) {
      toast({
        title: "Error", 
        description: "Please select your available days",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const existingProfile = await mentorshipService.getMentorProfile();
      
      if (existingProfile) {
        await mentorshipService.updateMentorProfile(profile);
        toast({
          title: "Success",
          description: "Mentor profile updated successfully!"
        });
      } else {
        await mentorshipService.createMentorProfile(profile);
        toast({
          title: "Success",
          description: "Mentor profile created successfully!"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save mentor profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <User className="h-8 w-8" />
          Mentor Profile Setup
        </h1>
        <p className="text-muted-foreground mt-2">
          Create your mentor profile to connect with mentees and share your expertise
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Expertise Section */}
        <Card>
          <CardHeader>
            <CardTitle>Areas of Expertise</CardTitle>
            <CardDescription>
              Select or add the skills and knowledge areas you can mentor others in
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2 mb-4">
              {profile.expertise.map(expertise => (
                <Badge key={expertise} variant="secondary" className="px-3 py-1">
                  {expertise}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 ml-2"
                    onClick={() => handleRemoveExpertise(expertise)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>

            <div className="flex gap-2">
              <Select value="" onValueChange={handleAddExpertise}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select expertise area" />
                </SelectTrigger>
                <SelectContent>
                  {EXPERTISE_OPTIONS
                    .filter(option => !profile.expertise.includes(option))
                    .map(option => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Input
                placeholder="Add custom expertise"
                value={newExpertise}
                onChange={(e) => setNewExpertise(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddExpertise(newExpertise);
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => handleAddExpertise(newExpertise)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Experience and Bio Section */}
        <Card>
          <CardHeader>
            <CardTitle>Experience & Background</CardTitle>
            <CardDescription>
              Tell mentees about your professional experience and background
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="experience">Years of Experience</Label>
              <Select 
                value={profile.years_experience.toString()} 
                onValueChange={(value) => setProfile(prev => ({ ...prev, years_experience: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 25 }, (_, i) => i + 1).map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year} {year === 1 ? 'year' : 'years'}
                    </SelectItem>
                  ))}
                  <SelectItem value="25">25+ years</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="bio">Bio & Background</Label>
              <Textarea
                id="bio"
                placeholder="Share your professional background, achievements, and what you're passionate about mentoring..."
                value={profile.bio}
                onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Availability Section */}
        <Card>
          <CardHeader>
            <CardTitle>Availability</CardTitle>
            <CardDescription>
              Set your availability for mentorship sessions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label className="text-base font-medium mb-3 block">Available Days</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {DAYS_OF_WEEK.map(day => (
                  <div key={day} className="flex items-center space-x-2">
                    <Checkbox
                      id={day}
                      checked={profile.availability.days.includes(day)}
                      onCheckedChange={(checked) => 
                        handleAvailabilityChange('days', day, checked as boolean)
                      }
                    />
                    <Label htmlFor={day} className="text-sm">{day}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-base font-medium mb-3 block">Preferred Time Slots</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {TIME_SLOTS.map(slot => (
                  <div key={slot} className="flex items-center space-x-2">
                    <Checkbox
                      id={slot}
                      checked={profile.availability.hours.includes(slot)}
                      onCheckedChange={(checked) => 
                        handleAvailabilityChange('hours', slot, checked as boolean)
                      }
                    />
                    <Label htmlFor={slot} className="text-sm">{slot}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <Select 
                value={profile.availability.timezone} 
                onValueChange={(value) => setProfile(prev => ({
                  ...prev,
                  availability: { ...prev.availability, timezone: value }
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map(tz => (
                    <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={loading} className="px-8">
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : 'Save Profile'}
          </Button>
        </div>
      </form>
    </div>
  );
};
