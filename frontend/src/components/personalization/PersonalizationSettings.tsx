
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { usePersonalization } from '@/context/PersonalizationContext';
import { useTheme } from "@/components/theme-provider";
import { Settings, Palette, Bell, Brain } from 'lucide-react';

interface PreferenceSettings {
  contentTypes: string[];
  interfaceLayout: 'compact' | 'spacious' | 'focused';
  notificationFrequency: 'high' | 'medium' | 'low';
  learningPace: 'fast' | 'moderate' | 'slow';
  communicationStyle: 'formal' | 'casual' | 'technical';
}

const PersonalizationSettings: React.FC = () => {
  const { profile, updateProfile, isLoading } = usePersonalization();
  const { theme, setTheme } = useTheme();

  const [preferences, setPreferences] = useState<PreferenceSettings>({
    contentTypes: ['jobs', 'training', 'scholarships'],
    interfaceLayout: 'spacious',
    notificationFrequency: 'medium',
    learningPace: 'moderate',
    communicationStyle: 'casual'
  });

  const [aiEnabled, setAiEnabled] = useState(true);
  const [dataSharing, setDataSharing] = useState(true);

  const handleContentTypeChange = (type: string, checked: boolean) => {
    setPreferences(prev => ({
      ...prev,
      contentTypes: checked
        ? [...prev.contentTypes, type]
        : prev.contentTypes.filter(t => t !== type)
    }));
  };

  const handlePreferenceChange = <K extends keyof PreferenceSettings>(
    key: K,
    value: PreferenceSettings[K]
  ) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSavePreferences = async () => {
    try {
      await updateProfile(preferences);
      // Show success message
    } catch (error) {
      console.error('Error saving preferences:', error);
      // Show error message
    }
  };

  const contentTypeOptions = [
    { id: 'jobs', label: 'Job Opportunities' },
    { id: 'training', label: 'Training Programs' },
    { id: 'scholarships', label: 'Scholarships' },
    { id: 'internships', label: 'Internships' },
    { id: 'mentorship', label: 'Mentorship' },
    { id: 'events', label: 'Events & Workshops' }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="mr-2 h-5 w-5" />
            AI Personalization
          </CardTitle>
          <CardDescription>
            Control how AI personalizes your experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="ai-enabled">Enable AI Personalization</Label>
              <p className="text-sm text-muted-foreground">
                Allow AI to customize your dashboard and recommendations
              </p>
            </div>
            <Switch
              id="ai-enabled"
              checked={aiEnabled}
              onCheckedChange={setAiEnabled}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="data-sharing">Anonymous Data Sharing</Label>
              <p className="text-sm text-muted-foreground">
                Share usage data to improve AI recommendations
              </p>
            </div>
            <Switch
              id="data-sharing"
              checked={dataSharing}
              onCheckedChange={setDataSharing}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Palette className="mr-2 h-5 w-5" />
            Interface Preferences
          </CardTitle>
          <CardDescription>
            Customize how the interface appears and behaves
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Theme Preference</Label>
            <Select
              value={theme}
              onValueChange={(value: "light" | "dark" | "system") => setTheme(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Layout Style</Label>
            <Select
              value={preferences.interfaceLayout}
              onValueChange={(value: 'compact' | 'spacious' | 'focused') =>
                handlePreferenceChange('interfaceLayout', value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="compact">Compact</SelectItem>
                <SelectItem value="spacious">Spacious</SelectItem>
                <SelectItem value="focused">Focused</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Communication Style</Label>
            <Select
              value={preferences.communicationStyle}
              onValueChange={(value: 'formal' | 'casual' | 'technical') =>
                handlePreferenceChange('communicationStyle', value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="formal">Formal</SelectItem>
                <SelectItem value="casual">Casual</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Content Preferences</CardTitle>
          <CardDescription>
            Choose what types of content you want to see
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {contentTypeOptions.map(option => (
              <div key={option.id} className="flex items-center space-x-2">
                <Checkbox
                  id={option.id}
                  checked={preferences.contentTypes.includes(option.id)}
                  onCheckedChange={(checked) =>
                    handleContentTypeChange(option.id, checked as boolean)
                  }
                />
                <Label htmlFor={option.id}>{option.label}</Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="mr-2 h-5 w-5" />
            Learning Preferences
          </CardTitle>
          <CardDescription>
            Help AI understand your learning style
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Learning Pace</Label>
            <Select
              value={preferences.learningPace}
              onValueChange={(value: 'fast' | 'moderate' | 'slow') =>
                handlePreferenceChange('learningPace', value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fast">Fast</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="slow">Slow</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Notification Frequency</Label>
            <Select
              value={preferences.notificationFrequency}
              onValueChange={(value: 'high' | 'medium' | 'low') =>
                handlePreferenceChange('notificationFrequency', value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSavePreferences} disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    </div>
  );
};

export default PersonalizationSettings;
