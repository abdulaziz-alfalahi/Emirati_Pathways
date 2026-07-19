import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Target, Clock, Calendar, CheckCircle, AlertCircle, Plus, X, Save } from 'lucide-react';
import { restClient } from '@/utils/api';

interface RecruiterPreferencesProps {
    initialData?: any;
    onProfileUpdate?: () => void;
}

export const RecruiterPreferences: React.FC<RecruiterPreferencesProps> = ({
    initialData,
    onProfileUpdate
}) => {
    const [data, setData] = useState({
        ...initialData,
        hiringVolume: '',
        preferredCandidateLevel: [] as string[],
        preferredSkills: [] as string[],
        workArrangements: [] as string[],
        interviewProcess: [] as string[],
        salaryRanges: {
            junior: { min: 3000, max: 8000 },
            mid: { min: 8000, max: 15000 },
            senior: { min: 15000, max: 30000 }
        }
    });

    useEffect(() => {
        if (initialData) {
            setData(prev => ({
                ...prev,
                ...initialData,
                // Ensure nested objects are merged correctly if needed, 
                // but shallow merge of initialData usually suffices if backend structure matches.
                // If initialData is partial, preserve defaults.
                salaryRanges: initialData.salaryRanges || prev.salaryRanges
            }));
        }
    }, [initialData]);

    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [newSkill, setNewSkill] = useState('');

    const candidateLevels = ['Fresh Graduate', 'Junior (1-3 years)', 'Mid-level (3-7 years)', 'Senior (7-12 years)', 'Executive (15+ years)'];
    const workArrangementOptions = ['On-site', 'Remote', 'Hybrid', 'Flexible hours', 'Contract'];
    const interviewProcessOptions = ['Phone Screen', 'Technical Test', 'HR Interview', 'Manager Interview', 'Panel Interview', 'Reference Check'];

    const handleArrayToggle = (field: string, value: string) => {
        setData((prev: any) => {
            const current = prev[field] || [];
            const updated = current.includes(value)
                ? current.filter((i: string) => i !== value)
                : [...current, value];
            return { ...prev, [field]: updated };
        });
    };

    const addSkill = () => {
        if (newSkill.trim() && !data.preferredSkills.includes(newSkill.trim())) {
            setData((prev: any) => ({ ...prev, preferredSkills: [...(prev.preferredSkills || []), newSkill.trim()] }));
            setNewSkill('');
        }
    };

    const removeSkill = (skill: string) => {
        setData((prev: any) => ({ ...prev, preferredSkills: prev.preferredSkills.filter((s: string) => s !== skill) }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        setSaveStatus('idle');
        try {
            // Only save Recruiter Preferences metadata
            // We assume backend accepts 'recruiter_preferences' object or similar flat fields
            await restClient.put('/api/auth/profile', {
                ...data,
                role: 'recruiter', // Context
                update_type: 'preferences' // Optional hint for backend
            });
            setSaveStatus('success');
            onProfileUpdate?.();
        } catch (error) {
            console.error("Save failed", error);
            setSaveStatus('error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Save Status Alert */}
            {saveStatus !== 'idle' && (
                <Alert className={saveStatus === 'success' ? 'border-green-500' : 'border-red-500'}>
                    {saveStatus === 'success' ? <CheckCircle className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-red-500" />}
                    <AlertDescription>
                        {saveStatus === 'success' ? 'Preferences saved successfully!' : 'Failed to save preferences.'}
                    </AlertDescription>
                </Alert>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Target className="h-5 w-5" /> Hiring Preferences</CardTitle>
                    <CardDescription>Define your typical hiring needs</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <Label>Hiring Volume</Label>
                        <Select value={data.hiringVolume} onValueChange={(v) => setData({ ...data, hiringVolume: v })}>
                            <SelectTrigger><SelectValue placeholder="Select Volume" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1-5">1-5 / month</SelectItem>
                                <SelectItem value="6-15">6-15 / month</SelectItem>
                                <SelectItem value="16+">16+ / month</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label>Preferred Candidate Levels</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                            {candidateLevels.map(lvl => (
                                <div key={lvl} className="flex items-center space-x-2">
                                    <input type="checkbox" checked={data.preferredCandidateLevel?.includes(lvl)} onChange={() => handleArrayToggle('preferredCandidateLevel', lvl)} className="rounded" />
                                    <Label className="text-sm font-normal">{lvl}</Label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <Label>Preferred Skills</Label>
                        <div className="flex gap-2 mt-2 mb-2">
                            <Input value={newSkill} onChange={e => setNewSkill(e.target.value)} placeholder="Add skill..." onKeyPress={e => e.key === 'Enter' && addSkill()} />
                            <Button onClick={addSkill} size="sm" type="button"><Plus className="h-4 w-4" /></Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {data.preferredSkills?.map((skill: string) => (
                                <Badge key={skill} variant="secondary" className="gap-1">{skill} <X className="h-3 w-3 cursor-pointer" onClick={() => removeSkill(skill)} /></Badge>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving ? 'Saving...' : <><Save className="me-2 h-4 w-4" /> Save Preferences</>}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
