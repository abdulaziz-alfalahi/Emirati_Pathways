
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Save, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { MentorProfile, useMentorProfile } from '@/hooks/useMentorProfile';

interface MentorProfileFormProps {
  mentorProfile: MentorProfile | null;
}

export const MentorProfileForm: React.FC<MentorProfileFormProps> = ({ mentorProfile }) => {
  const { updateMentorProfile } = useMentorProfile();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    bio: mentorProfile?.bio || '',
    expertise: mentorProfile?.expertise || [],
    availability: mentorProfile?.availability || {
      days: [],
      hours: [],
      timezone: 'Asia/Dubai'
    },
    years_experience: mentorProfile?.years_experience || 0
  });

  const [newExpertise, setNewExpertise] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const success = await updateMentorProfile(formData);
      
      if (success) {
        toast({
          title: "Profile Updated",
          description: "Your mentor profile has been successfully updated."
        });
      } else {
        throw new Error('Update failed');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update your profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addExpertise = () => {
    if (newExpertise.trim() && !formData.expertise.includes(newExpertise.trim())) {
      setFormData(prev => ({
        ...prev,
        expertise: [...prev.expertise, newExpertise.trim()]
      }));
      setNewExpertise('');
    }
  };

  const removeExpertise = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      expertise: prev.expertise.filter(s => s !== skill)
    }));
  };

  const handleAvailabilityChange = (type: 'days' | 'hours', value: string) => {
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        [type]: prev.availability[type].includes(value)
          ? prev.availability[type].filter(item => item !== value)
          : [...prev.availability[type], value]
      }
    }));
  };

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const timeSlots = ['09:00-11:00', '11:00-13:00', '13:00-15:00', '15:00-17:00', '17:00-19:00', '19:00-21:00'];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          {mentorProfile ? 'Update Your Profile' : 'Create Your Mentor Profile'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="years_experience">Years of Experience</Label>
            <Input
              id="years_experience"
              type="number"
              min="0"
              value={formData.years_experience}
              onChange={(e) => setFormData(prev => ({ ...prev, years_experience: parseInt(e.target.value) || 0 }))}
            />
          </div>

          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              placeholder="Tell us about your experience and what you can offer as a mentor..."
              value={formData.bio}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              rows={4}
            />
          </div>

          <div>
            <Label>Areas of Expertise</Label>
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="Add expertise area"
                value={newExpertise}
                onChange={(e) => setNewExpertise(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addExpertise())}
              />
              <Button type="button" onClick={addExpertise} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.expertise.map((skill) => (
                <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                  {skill}
                  <X 
                    className="h-3 w-3 cursor-pointer hover:text-red-500" 
                    onClick={() => removeExpertise(skill)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label>Availability</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div>
                <Label className="text-sm font-medium">Preferred Days</Label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {daysOfWeek.map(day => (
                    <label key={day} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.availability.days.includes(day)}
                        onChange={() => handleAvailabilityChange('days', day)}
                        className="rounded"
                      />
                      <span className="text-sm">{day}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Preferred Time Slots</Label>
                <div className="space-y-2 mt-1">
                  {timeSlots.map(slot => (
                    <label key={slot} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.availability.hours.includes(slot)}
                        onChange={() => handleAvailabilityChange('hours', slot)}
                        className="rounded"
                      />
                      <span className="text-sm">{slot}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            <Save className="h-4 w-4 me-2" />
            {loading ? 'Saving...' : (mentorProfile ? 'Update Profile' : 'Create Profile')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
