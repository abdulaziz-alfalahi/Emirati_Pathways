
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { educatorService, ScholarshipData } from '@/services/educatorService';
import { Loader2, Plus, CheckCircle } from 'lucide-react';

const ScholarshipManagement: React.FC = () => {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<ScholarshipData>({
        title: '',
        provider: '',
        description: '',
        amount: '',
        coverage_type: 'Full Tuition',
        deadline: '',
        min_gpa: 3.0,
        academic_level: 'University',
        eligible_majors: [],
        application_link: ''
    });

    const [majorInput, setMajorInput] = useState('');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'min_gpa' ? parseFloat(value) : value
        }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleAddMajor = () => {
        if (majorInput.trim()) {
            setFormData(prev => ({
                ...prev,
                eligible_majors: [...prev.eligible_majors, majorInput.trim()]
            }));
            setMajorInput('');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await educatorService.createScholarship(formData);
            toast({
                title: "Success",
                description: "Scholarship created successfully",
            });
            // Reset form
            setFormData({
                title: '',
                provider: '',
                description: '',
                amount: '',
                coverage_type: 'Full Tuition',
                deadline: '',
                min_gpa: 3.0,
                academic_level: 'University',
                eligible_majors: [],
                application_link: ''
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to create scholarship",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card className="bg-white shadow-sm">
                <CardHeader>
                    <CardTitle className="font-dubai-bold text-slate-900">Post New Scholarship</CardTitle>
                    <CardDescription className="font-dubai-medium text-slate-600">
                        Create a new scholarship opportunity for students
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Scholarship Title</Label>
                                <Input id="title" name="title" value={formData.title} onChange={handleInputChange} required placeholder="e.g. Future Leaders Grant" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="provider">Provider Name</Label>
                                <Input id="provider" name="provider" value={formData.provider} onChange={handleInputChange} required placeholder="e.g. Ministry of Education" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" name="description" value={formData.description} onChange={handleInputChange} placeholder="Details about eligibility and benefits..." />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="amount">Amount / Value</Label>
                                <Input id="amount" name="amount" value={formData.amount} onChange={handleInputChange} required placeholder="e.g. AED 50,000/year" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="coverage_type">Coverage Type</Label>
                                <Select onValueChange={(val) => handleSelectChange('coverage_type', val)} defaultValue={formData.coverage_type}>
                                    <SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Full Tuition">Full Tuition</SelectItem>
                                        <SelectItem value="Partial Tuition">Partial Tuition</SelectItem>
                                        <SelectItem value="Stipend">Stipend Only</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="deadline">Application Deadline</Label>
                                <Input id="deadline" name="deadline" type="date" value={formData.deadline} onChange={handleInputChange} required />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="min_gpa">Minimum GPA</Label>
                                <Input id="min_gpa" name="min_gpa" type="number" step="0.1" value={formData.min_gpa} onChange={handleInputChange} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="academic_level">Academic Level</Label>
                                <Select onValueChange={(val) => handleSelectChange('academic_level', val)} defaultValue={formData.academic_level}>
                                    <SelectTrigger><SelectValue placeholder="Select Level" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="High School">High School</SelectItem>
                                        <SelectItem value="University">University</SelectItem>
                                        <SelectItem value="Postgraduate">Postgraduate</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Eligible Majors</Label>
                            <div className="flex gap-2">
                                <Input
                                    value={majorInput}
                                    onChange={(e) => setMajorInput(e.target.value)}
                                    placeholder="Add major (e.g. Computer Science)"
                                />
                                <Button type="button" onClick={handleAddMajor} variant="secondary">Add</Button>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {formData.eligible_majors.map((major, index) => (
                                    <span key={index} className="bg-slate-100 px-2 py-1 rounded text-sm flex items-center gap-1">
                                        {major}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="application_link">Application Link</Label>
                            <Input id="application_link" name="application_link" value={formData.application_link} onChange={handleInputChange} placeholder="https://..." />
                        </div>

                        <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700" disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                            Post Scholarship
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default ScholarshipManagement;
