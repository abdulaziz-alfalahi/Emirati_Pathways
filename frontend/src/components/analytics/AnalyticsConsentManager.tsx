
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Shield, Info, Settings } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { crossPhaseAnalyticsService, ConsentSettings } from '@/services/crossPhaseAnalyticsService';
import { useToast } from '@/hooks/use-toast';

interface AnalyticsConsentManagerProps {
  onConsentUpdated?: (consent: ConsentSettings) => void;
}

export const AnalyticsConsentManager: React.FC<AnalyticsConsentManagerProps> = ({
  onConsentUpdated
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [consent, setConsent] = useState<ConsentSettings>({
    essential_analytics: true,
    performance_analytics: false,
    personalization_analytics: false,
    marketing_analytics: false
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      loadConsentSettings();
    }
  }, [user]);

  const loadConsentSettings = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const settings = await crossPhaseAnalyticsService.getAnalyticsConsent(user.id);
      if (settings) {
        setConsent(settings);
      }
    } catch (error) {
      console.error('Failed to load consent settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConsentChange = (key: keyof ConsentSettings, value: boolean) => {
    const newConsent = { ...consent, [key]: value };
    setConsent(newConsent);
  };

  const saveConsentSettings = async () => {
    if (!user) return;

    setSaving(true);
    try {
      await crossPhaseAnalyticsService.updateAnalyticsConsent(consent);
      onConsentUpdated?.(consent);
      toast({
        title: "Consent Updated",
        description: "Your analytics preferences have been saved."
      });
    } catch (error) {
      console.error('Failed to save consent settings:', error);
      toast({
        title: "Error",
        description: "Failed to save consent settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading consent settings...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Analytics & Privacy Consent
        </CardTitle>
        <CardDescription>
          Control how your data is used to improve your experience and the platform
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="space-y-1 flex-1">
              <Label htmlFor="essential" className="font-medium">
                Essential Analytics
              </Label>
              <p className="text-sm text-muted-foreground">
                Required for basic functionality and security. Cannot be disabled.
              </p>
            </div>
            <Switch
              id="essential"
              checked={consent.essential_analytics}
              disabled={true}
            />
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="space-y-1 flex-1">
              <Label htmlFor="performance" className="font-medium">
                Performance Analytics
              </Label>
              <p className="text-sm text-muted-foreground">
                Help us understand how you use the platform to improve performance
              </p>
            </div>
            <Switch
              id="performance"
              checked={consent.performance_analytics}
              onCheckedChange={(value) => handleConsentChange('performance_analytics', value)}
            />
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="space-y-1 flex-1">
              <Label htmlFor="personalization" className="font-medium">
                Personalization Analytics
              </Label>
              <p className="text-sm text-muted-foreground">
                Personalize your experience with tailored recommendations and content
              </p>
            </div>
            <Switch
              id="personalization"
              checked={consent.personalization_analytics}
              onCheckedChange={(value) => handleConsentChange('personalization_analytics', value)}
            />
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="space-y-1 flex-1">
              <Label htmlFor="marketing" className="font-medium">
                Marketing Analytics
              </Label>
              <p className="text-sm text-muted-foreground">
                Understand your interests to provide relevant opportunities and updates
              </p>
            </div>
            <Switch
              id="marketing"
              checked={consent.marketing_analytics}
              onCheckedChange={(value) => handleConsentChange('marketing_analytics', value)}
            />
          </div>
        </div>

        <div className="bg-muted p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="text-sm">
              <p className="font-medium mb-1">Data Protection</p>
              <p className="text-muted-foreground">
                All analytics data is anonymized and encrypted. You can update these preferences
                at any time, and we will never share your personal information with third parties
                without your explicit consent.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={saveConsentSettings} 
            disabled={saving}
            className="flex-1"
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </Button>
          <Button 
            variant="outline" 
            onClick={loadConsentSettings}
            disabled={loading}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
