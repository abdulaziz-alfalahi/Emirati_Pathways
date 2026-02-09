import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

export const StudentProfileForm = ({ initialData, onSave }: { initialData?: any, onSave: (data: any) => void }) => {
    const [formData, setFormData] = useState({
        schoolName: initialData?.schoolName || '',
        gradeLevel: initialData?.gradeLevel || '',
        gpa: initialData?.gpa || '',
        majorInterests: initialData?.majorInterests || '',
        extracurriculars: initialData?.extracurriculars || '',
        achievements: initialData?.achievements || ''
    });

    // Update form data when initialData changes (e.g. after profile refresh)
    React.useEffect(() => {
        if (initialData) {
            setFormData(prev => ({
                ...prev,
                schoolName: initialData.schoolName || prev.schoolName || '',
                gradeLevel: initialData.gradeLevel || prev.gradeLevel || '',
                gpa: initialData.gpa || prev.gpa || '',
                majorInterests: initialData.majorInterests || prev.majorInterests || '',
                extracurriculars: initialData.extracurriculars || prev.extracurriculars || '',
                achievements: initialData.achievements || prev.achievements || ''
            }));
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Student Profile</CardTitle>
                <CardDescription>Update your academic details to find relevant scholarships and programs.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="schoolName">School / University Name</Label>
                            <Input
                                id="schoolName"
                                name="schoolName"
                                value={formData.schoolName}
                                onChange={handleChange}
                                placeholder="e.g. Khalifa University"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="gradeLevel">Grade / Year Level</Label>
                            <Input
                                id="gradeLevel"
                                name="gradeLevel"
                                value={formData.gradeLevel}
                                onChange={handleChange}
                                placeholder="e.g. Grade 11 or Sophomore"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="gpa">GPA / Academic Score</Label>
                            <Input
                                id="gpa"
                                name="gpa"
                                value={formData.gpa}
                                onChange={handleChange}
                                placeholder="e.g. 3.8 or 95%"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="majorInterests">Major / Subjects of Interest</Label>
                            <Input
                                id="majorInterests"
                                name="majorInterests"
                                value={formData.majorInterests}
                                onChange={handleChange}
                                placeholder="e.g. Computer Science, Engineering"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="extracurriculars">Extracurricular Activities</Label>
                        <Textarea
                            id="extracurriculars"
                            name="extracurriculars"
                            value={formData.extracurriculars}
                            onChange={handleChange}
                            placeholder="List clubs, sports, or volunteering..."
                            className="h-20"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="achievements">Awards & Achievements</Label>
                        <Textarea
                            id="achievements"
                            name="achievements"
                            value={formData.achievements}
                            onChange={handleChange}
                            placeholder="List any academic awards or competition wins..."
                            className="h-20"
                        />
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button type="submit">Save Changes</Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
};
