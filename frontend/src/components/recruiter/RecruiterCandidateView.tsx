
import React, { useState } from 'react';
import {
    User,
    Mail,
    Phone,
    MapPin,
    Briefcase,
    GraduationCap,
    Award,
    Languages,
    Calendar,
    Building2,
    ExternalLink,
    ArrowLeft,
    MessageSquare,
    Video,
    CheckCircle,
    XCircle,
    Download,
    Share2,
    Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/context/AuthContext';

// @ts-ignore
import { useQuery } from '@tanstack/react-query';
import { restClient } from '@/utils/api';
import { Applicant } from './JobApplicantsView';
import { CandidateDiscussionModal } from './CandidateDiscussionModal';
import { toast } from 'sonner';

interface RecruiterCandidateViewProps {
    applicant: Applicant;
    onBack: () => void;
    onMessage: (applicant: Applicant) => void;
    onScheduleInterview: (applicant: Applicant) => void;
    onUpdateStatus: (id: string, status: string) => void;
}

const RecruiterCandidateView: React.FC<RecruiterCandidateViewProps> = ({
    applicant,
    onBack,
    onMessage,
    onScheduleInterview,
    onUpdateStatus
}) => {
    // State for discussion modal
    const [showDiscussionModal, setShowDiscussionModal] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const { user } = useAuth();

    const handleDownloadCV = async () => {
        const candidateId = displayApplicant.candidate_id || applicant.candidate_id;
        if (!candidateId) {
            toast.error("No candidate ID found");
            return;
        }

        setIsDownloading(true);
        const toastId = toast.loading("Generating CV PDF, please wait...");
        try {
            const response = await restClient.get(`/api/cv/user/${candidateId}/export/pdf`, {
                responseType: 'blob'
            });
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `cv_${displayApplicant.candidate_name || candidateId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            toast.success("CV downloaded successfully", { id: toastId });
        } catch (error) {
            console.error("Failed to download CV:", error);
            toast.error("Failed to download CV", { id: toastId });
        } finally {
            setIsDownloading(false);
        }
    };

    // Fetch full profile details
    const { data: fullProfile, isLoading } = useQuery({
        queryKey: ['candidate', applicant.candidate_id],
        queryFn: async () => {
            if (!applicant.candidate_id) return null;
            try {
                const response = await restClient.get(`/api/recruiter/candidates/${applicant.candidate_id}/full-profile`);
                if (response.data?.success) {
                    return response.data.data;
                }
                return null;
            } catch (err) {
                console.error("Failed to fetch candidate profile", err);
                return null;
            }
        },
        enabled: !!applicant.candidate_id
    });

    // Merge data: Prefer full profile data over simplified applicant list data
    const displayApplicant = {
        ...applicant,
        ...fullProfile,
        work_experience: fullProfile?.work_experience?.length ? fullProfile.work_experience : (applicant.work_experience || []),
        education: fullProfile?.education?.length ? fullProfile.education : (applicant.education || []),
        technical_skills: fullProfile?.technical_skills?.length ? fullProfile.technical_skills : (applicant.technical_skills || []),
        soft_skills: fullProfile?.soft_skills?.length ? fullProfile.soft_skills : (applicant.soft_skills || []),
        candidate_summary: fullProfile?.summary || applicant.candidate_summary,
        location: fullProfile?.location || applicant.location,
        candidate_name: fullProfile?.full_name || applicant.candidate_name,
        candidate_email: fullProfile?.email || applicant.candidate_email,
        candidate_phone: fullProfile?.phone || applicant.candidate_phone,
    };

    // Helper to format dates
    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '';
        try {
            return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        } catch {
            return dateStr;
        }
    };

    return (
        <>
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={onBack}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h2 className="text-2xl font-bold">{displayApplicant.candidate_name || 'Candidate Profile'}</h2>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Badge variant="outline">{applicant.status?.replace('_', ' ')}</Badge>
                                <span>Applied: {formatDate(applicant.submitted_at)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <Button variant="outline" size="sm" onClick={() => onMessage(displayApplicant)}>
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Message
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => onScheduleInterview(displayApplicant)}>
                            <Video className="h-4 w-4 mr-2" />
                            Schedule Interview
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowDiscussionModal(true)}
                        >
                            <Share2 className="h-4 w-4 mr-2" />
                            Share
                        </Button>

                        <Separator orientation="vertical" className="h-6 mx-2" />

                        <Button
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            size="sm"
                            onClick={() => onUpdateStatus(applicant.application_id, 'shortlisted')}
                        >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Shortlist
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => onUpdateStatus(applicant.application_id, 'rejected')}
                        >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                        </Button>
                    </div>
                </div>

                {isLoading && (
                    <div className="p-8 text-center text-muted-foreground">
                        Loading full profile details...
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content (CV) */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Summary */}
                        {displayApplicant.candidate_summary && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <User className="h-5 w-5 text-blue-600" />
                                        Professional Summary
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-gray-700 leading-relaxed">{displayApplicant.candidate_summary}</p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Work Experience */}
                        {displayApplicant.work_experience && displayApplicant.work_experience.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Briefcase className="h-5 w-5 text-blue-600" />
                                        Work Experience
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {displayApplicant.work_experience.map((exp: any, idx: number) => (
                                        <div key={idx} className="relative pl-4 border-l-2 border-gray-100 last:border-0">
                                            <div className="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full bg-blue-600"></div>
                                            <div className="mb-1">
                                                <h4 className="font-semibold text-gray-900">{exp.job_title || exp.jobTitle}</h4>
                                                <div className="text-sm text-gray-600 flex items-center gap-2">
                                                    <Building2 className="h-3 w-3" />
                                                    {exp.company}
                                                    <span className="text-gray-300">•</span>
                                                    <Calendar className="h-3 w-3" />
                                                    {formatDate(exp.start_date || exp.startDate)} - {exp.is_current ? 'Present' : formatDate(exp.end_date || exp.endDate)}
                                                </div>
                                            </div>
                                            {exp.description && (
                                                <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{exp.description}</p>
                                            )}
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}

                        {/* Education */}
                        {displayApplicant.education && displayApplicant.education.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <GraduationCap className="h-5 w-5 text-blue-600" />
                                        Education
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {displayApplicant.education.map((edu: any, idx: number) => (
                                        <div key={idx} className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-semibold text-gray-900">{edu.degree}</h4>
                                                <p className="text-sm text-gray-600">{edu.institution}</p>
                                                {edu.field_of_study && <p className="text-sm text-gray-500">{edu.field_of_study}</p>}
                                            </div>
                                            {edu.graduation_year && (
                                                <Badge variant="secondary">{edu.graduation_year}</Badge>
                                            )}
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar (Contact & Skills) */}
                    <div className="space-y-6">
                        {/* Contact Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Contact Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {displayApplicant.candidate_email && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                                            <Mail className="h-4 w-4 text-blue-600" />
                                        </div>
                                        <div className="overflow-hidden">
                                            <p className="text-xs text-muted-foreground">Email</p>
                                            <p className="truncate font-medium">{displayApplicant.candidate_email}</p>
                                        </div>
                                    </div>
                                )}
                                {displayApplicant.candidate_phone && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                                            <Phone className="h-4 w-4 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Phone</p>
                                            <p className="font-medium">{displayApplicant.candidate_phone}</p>
                                        </div>
                                    </div>
                                )}
                                {displayApplicant.location && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                                            <MapPin className="h-4 w-4 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Location</p>
                                            <p className="font-medium">{displayApplicant.location}</p>
                                        </div>
                                    </div>
                                )}

                                <Button 
                                    variant="outline" 
                                    className="w-full mt-4"
                                    onClick={handleDownloadCV}
                                    disabled={isDownloading}
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    {isDownloading ? "Downloading..." : "Download CV"}
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Skills Card */}
                        {(displayApplicant.technical_skills?.length || displayApplicant.soft_skills?.length) && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Skills</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-wrap gap-2">
                                        {displayApplicant.technical_skills?.map((skill: any, idx: number) => (
                                            <Badge key={`tech-${idx}`} className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-0">
                                                {skill}
                                            </Badge>
                                        ))}
                                        {displayApplicant.soft_skills?.map((skill: any, idx: number) => (
                                            <Badge key={`soft-${idx}`} variant="outline">
                                                {skill}
                                            </Badge>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Cover Letter (Sidebar ver check) */}
                        {displayApplicant.cover_letter && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Cover Letter</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-gray-600 italic">"{displayApplicant.cover_letter}"</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>

            {/* Candidate Discussion Modal */}
            <CandidateDiscussionModal
                isOpen={showDiscussionModal}
                onClose={() => setShowDiscussionModal(false)}
                candidateId={applicant.candidate_id}
                candidateName={displayApplicant.candidate_name || 'Candidate'}
                jobId={applicant.job_id}
                jobTitle={applicant.job_title || 'Application'}
                companyId={user?.company_id || ''}
                onDiscussionCreated={(conversationId) => {
                    console.log('Discussion created:', conversationId);
                }}
            />
        </>
    );
};

export default RecruiterCandidateView;
