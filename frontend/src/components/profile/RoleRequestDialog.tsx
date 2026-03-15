import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { restClient } from '@/utils/api';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, CheckCircle2, Shield, Building2, GraduationCap, Heart, ClipboardCheck, Users, User, Search } from 'lucide-react';

interface RoleRequestDialogProps {
    isOpen: boolean;
    onClose: () => void;
    role: string;
    onRequestSubmitted: () => void;
}

// ─── Role-Specific Configuration ──────────────────────────────────────

interface RoleConfig {
    description: string;
    reviewedBy: string;
    reviewBadgeColor: string;
    icon: React.ReactNode;
    reasons: string[];
    fields: { key: string; label: string; placeholder: string; type: 'text' | 'number' | 'select' | 'institution_search'; options?: string[] }[];
    uploadLabel: string;
    uploadHint: string;
}

const roleConfigs: Record<string, RoleConfig> = {
    'HR/Recruiter': {
        description: 'Recruiters post jobs, manage candidate pipelines, and conduct interviews. A valid company trade license or HR authorization letter is required.',
        reviewedBy: 'Company Operations Team',
        reviewBadgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
        icon: <Building2 className="h-5 w-5 text-blue-600" />,
        reasons: [
            'Company Authorization',
            'New Employer / Joined a Company',
            'Recruitment Agency Representative',
            'Freelance HR Consultant',
            'Other'
        ],
        fields: [
            { key: 'company_name', label: 'Company Name', placeholder: 'e.g., Emirates NBD, ADNOC', type: 'text' },
            { key: 'trade_license', label: 'Trade License Number', placeholder: 'e.g., DED-12345678', type: 'text' },
        ],
        uploadLabel: 'Upload Trade License / HR Letter',
        uploadHint: 'Trade license, company authorization letter, or HR appointment letter.',
    },
    'Recruiter': {
        description: 'Recruiters post jobs, manage candidate pipelines, and conduct interviews. A valid company trade license or HR authorization letter is required.',
        reviewedBy: 'Company Operations Team',
        reviewBadgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
        icon: <Building2 className="h-5 w-5 text-blue-600" />,
        reasons: [
            'Company Authorization',
            'New Employer / Joined a Company',
            'Recruitment Agency Representative',
            'Freelance HR Consultant',
            'Other'
        ],
        fields: [
            { key: 'company_name', label: 'Company Name', placeholder: 'e.g., Emirates NBD, ADNOC', type: 'text' },
            { key: 'trade_license', label: 'Trade License Number', placeholder: 'e.g., DED-12345678', type: 'text' },
        ],
        uploadLabel: 'Upload Trade License / HR Letter',
        uploadHint: 'Trade license, company authorization letter, or HR appointment letter.',
    },
    'HR Manager': {
        description: 'HR Managers oversee company recruitment, workforce analytics, and team management. Corporate verification is required.',
        reviewedBy: 'Company Operations Team',
        reviewBadgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
        icon: <Building2 className="h-5 w-5 text-blue-600" />,
        reasons: [
            'Company Authorization',
            'New Employer / Joined a Company',
            'HR Department Head',
            'Other'
        ],
        fields: [
            { key: 'company_name', label: 'Company Name', placeholder: 'e.g., du, Etisalat, ENOC', type: 'text' },
            { key: 'trade_license', label: 'Trade License Number', placeholder: 'e.g., DED-12345678', type: 'text' },
            { key: 'employee_id', label: 'Employee ID', placeholder: 'Your company employee ID', type: 'text' },
        ],
        uploadLabel: 'Upload Corporate Authorization',
        uploadHint: 'Company letter confirming your HR Manager role, or trade license.',
    },
    'Educator': {
        description: 'Educators manage curriculum, student progress, and school programs. Verification of employment with an educational institution is required.',
        reviewedBy: 'Education Operations Team',
        reviewBadgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: <GraduationCap className="h-5 w-5 text-emerald-600" />,
        reasons: [
            'School Employment',
            'Training Institution Staff',
            'University Faculty',
            'Curriculum Developer',
            'Other'
        ],
        fields: [
            { key: 'institution_name', label: 'Institution Name', placeholder: 'e.g., GEMS Education, Abu Dhabi University', type: 'text' },
            { key: 'employee_id', label: 'Employee / Faculty ID', placeholder: 'Your institutional ID', type: 'text' },
        ],
        uploadLabel: 'Upload Teaching Certificate / Employment Letter',
        uploadHint: 'Teaching license, employment contract, or faculty appointment letter.',
    },
    'Student': {
        description: 'Students access educational programs, scholarships, assessments, and LMS resources. Proof of enrollment is helpful.',
        reviewedBy: 'Education Operations Team',
        reviewBadgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: <GraduationCap className="h-5 w-5 text-emerald-600" />,
        reasons: [
            'University Enrollment',
            'Training Program Participant',
            'Scholarship Recipient',
            'Vocational Education',
            'Other'
        ],
        fields: [
            { key: 'institution_name', label: 'University / Institution', placeholder: 'e.g., UAE University, Khalifa University', type: 'text' },
            { key: 'student_id', label: 'Student ID (Optional)', placeholder: 'Your student ID number', type: 'text' },
        ],
        uploadLabel: 'Upload Enrollment Letter / Student ID',
        uploadHint: 'Enrollment confirmation, student ID card, or acceptance letter.',
    },
    'Mentor': {
        description: 'Mentors guide job seekers through career development. Proven industry expertise is expected.',
        reviewedBy: 'Mentorship Operations Team',
        reviewBadgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
        icon: <Heart className="h-5 w-5 text-purple-600" />,
        reasons: [
            'Industry Expert',
            'Professional Coach / Consultant',
            'Academic Advisor',
            'Retired Professional',
            'Other'
        ],
        fields: [
            { key: 'expertise_area', label: 'Area of Expertise', placeholder: '', type: 'select', options: ['Technology & IT', 'Finance & Banking', 'Oil & Gas / Energy', 'Healthcare', 'Education', 'Government & Public Sector', 'Entrepreneurship', 'Engineering', 'Law', 'Other'] },
            { key: 'years_experience', label: 'Years of Experience', placeholder: 'e.g., 10', type: 'number' },
        ],
        uploadLabel: 'Upload Professional CV / LinkedIn Profile',
        uploadHint: 'CV, professional profile summary, or industry recognition certificate.',
    },
    'Assessor': {
        description: 'Assessors evaluate candidate skills and issue certifications. Valid assessor credentials are required.',
        reviewedBy: 'Assessment Operations Team',
        reviewBadgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: <ClipboardCheck className="h-5 w-5 text-amber-600" />,
        reasons: [
            'Certified Assessor',
            'Exam Body Representative',
            'Skills Evaluator',
            'Training Center Assessor',
            'Other'
        ],
        fields: [
            { key: 'certification_body', label: 'Certification Body', placeholder: 'e.g., Pearson, City & Guilds, HAAD', type: 'text' },
            { key: 'assessor_id', label: 'Assessor / Certification ID', placeholder: 'Your assessor registration number', type: 'text' },
        ],
        uploadLabel: 'Upload Assessor Certificate / License',
        uploadHint: 'Assessor certification, exam body registration, or professional license.',
    },
    'Guardian': {
        description: 'Guardians monitor their children\'s educational progress, school programs, and career readiness. Relationship verification is required.',
        reviewedBy: 'Platform Administration',
        reviewBadgeColor: 'bg-slate-50 text-slate-700 border-slate-200',
        icon: <Shield className="h-5 w-5 text-slate-600" />,
        reasons: [
            'Parent of Registered Student',
            'Legal Guardian',
            'Educational Sponsor',
            'Other'
        ],
        fields: [
            { key: 'student_emirates_id', label: 'Student\'s Emirates ID Number', placeholder: '784-XXXX-XXXXXXX-X', type: 'text' },
            { key: 'child_name', label: 'Child\'s Full Name', placeholder: 'Full name of the student', type: 'text' },
            { key: 'education_level', label: 'Education Level', placeholder: '', type: 'select', options: ['School', 'University'] },
            { key: 'institution', label: 'Institution', placeholder: 'Search for school or university...', type: 'institution_search' },
            { key: 'relationship', label: 'Relationship', placeholder: '', type: 'select', options: ['Father', 'Mother', 'Legal Guardian', 'Other'] },
        ],
        uploadLabel: 'Upload Emirates ID / Guardianship Document',
        uploadHint: 'Emirates ID showing parental relationship, or legal guardianship document.',
    },
    'Growth Operator': {
        description: 'Growth Operators manage platform scaling, company onboarding, and program approvals. Admin authorization is required.',
        reviewedBy: 'Platform Administration',
        reviewBadgeColor: 'bg-slate-50 text-slate-700 border-slate-200',
        icon: <Shield className="h-5 w-5 text-slate-600" />,
        reasons: [
            'EHRDC Staff',
            'Platform Partner Organization',
            'Government Entity Representative',
            'Other'
        ],
        fields: [
            { key: 'organization', label: 'Organization', placeholder: 'e.g., EHRDC, Dubai Government', type: 'text' },
            { key: 'department', label: 'Department / Division', placeholder: 'Your department name', type: 'text' },
        ],
        uploadLabel: 'Upload Authorization Letter',
        uploadHint: 'Official letter from EHRDC or partner organization authorizing operator access.',
    },
};

// Fallback config for any unmapped roles
const defaultConfig: RoleConfig = {
    description: 'You need authorization to access this workspace.',
    reviewedBy: 'Platform Administration',
    reviewBadgeColor: 'bg-slate-50 text-slate-700 border-slate-200',
    icon: <User className="h-5 w-5 text-slate-600" />,
    reasons: ['Professional Development', 'New Employment', 'Authorized Representative', 'Other'],
    fields: [],
    uploadLabel: 'Upload Supporting Document',
    uploadHint: 'Upload any relevant documentation to support your request.',
};

// ─── Component ────────────────────────────────────────────────────────

export const RoleRequestDialog: React.FC<RoleRequestDialogProps> = ({
    isOpen,
    onClose,
    role,
    onRequestSubmitted
}) => {
    const [reasonCategory, setReasonCategory] = useState('');
    const [notes, setNotes] = useState('');
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadedFile, setUploadedFile] = useState<string | null>(null);
    const [roleFields, setRoleFields] = useState<Record<string, string>>({});
    const { toast } = useToast();

    // Institution search state (Guardian role)
    const [institutionSearchQuery, setInstitutionSearchQuery] = useState('');
    const [institutionResults, setInstitutionResults] = useState<any[]>([]);
    const [institutionSearching, setInstitutionSearching] = useState(false);
    const [showInstitutionDropdown, setShowInstitutionDropdown] = useState(false);
    const institutionRef = useRef<HTMLDivElement>(null);
    const searchTimerRef = useRef<NodeJS.Timeout | null>(null);

    const config = roleConfigs[role] || defaultConfig;

    // Reset state when dialog opens/closes
    useEffect(() => {
        if (!isOpen) {
            setReasonCategory('');
            setNotes('');
            setAgreedToTerms(false);
            setUploadedFile(null);
            setRoleFields({});
            setInstitutionSearchQuery('');
            setInstitutionResults([]);
            setShowInstitutionDropdown(false);
        }
    }, [isOpen]);

    // Close institution dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (institutionRef.current && !institutionRef.current.contains(e.target as Node)) {
                setShowInstitutionDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Debounced institution search
    const searchInstitutions = useCallback(async (query: string, level: string) => {
        if (!level) return;
        setInstitutionSearching(true);
        try {
            const { data } = await restClient.get('/api/roles/institutions/search', {
                params: { q: query, level: level.toLowerCase() }
            });
            setInstitutionResults(data.data || []);
        } catch (err) {
            console.error('Institution search failed:', err);
            setInstitutionResults([]);
        } finally {
            setInstitutionSearching(false);
        }
    }, []);

    // Trigger search when query or education level changes
    useEffect(() => {
        const level = roleFields['education_level'] || '';
        if (!level || role !== 'Guardian') return;

        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        searchTimerRef.current = setTimeout(() => {
            searchInstitutions(institutionSearchQuery, level);
        }, 300);

        return () => { if (searchTimerRef.current) clearTimeout(searchTimerRef.current); };
    }, [institutionSearchQuery, roleFields['education_level'], role, searchInstitutions]);

    const handleFieldChange = (key: string, value: string) => {
        setRoleFields(prev => ({ ...prev, [key]: value }));
    };

    const handleFileUpload = () => {
        // Simulate file upload
        setUploadedFile("Credential_Document.pdf");
        toast({
            title: "File Attached",
            description: "Document attached successfully (Simulation).",
        });
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            // Build structured notes from all fields
            const fieldsSummary = config.fields
                .map(f => `${f.label}: ${roleFields[f.key] || 'N/A'}`)
                .join('\n');

            const structuredNotes = [
                `Category: ${reasonCategory}`,
                fieldsSummary,
                notes ? `Additional Details: ${notes}` : '',
                `Attached Document: ${uploadedFile || 'None'}`,
                `Agreed to Terms: Yes`,
                `Reviewed By: ${config.reviewedBy}`,
            ].filter(Boolean).join('\n');

            await restClient.post('/api/roles/request', {
                role,
                notes: structuredNotes,
                documents: uploadedFile ? { 'credential': uploadedFile } : {},
                role_fields: roleFields,
            });

            toast({
                title: "Request Submitted",
                description: `Your request for ${role} access has been sent to the ${config.reviewedBy} for review.`,
                variant: "default",
            });

            onRequestSubmitted();
            onClose();
        } catch (error: any) {
            console.error('Role request failed', error);
            toast({
                title: "Submission Failed",
                description: error.response?.data?.message || "Could not submit request.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Check if required fields are filled
    const requiredFieldsFilled = config.fields.length === 0 || 
        config.fields.every(f => (roleFields[f.key] || '').trim().length > 0);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 rounded-lg bg-slate-100">
                            {config.icon}
                        </div>
                        <div>
                            <DialogTitle className="text-lg">Request {role} Access</DialogTitle>
                            <Badge variant="outline" className={`mt-1 text-xs ${config.reviewBadgeColor}`}>
                                Reviewed by: {config.reviewedBy}
                            </Badge>
                        </div>
                    </div>
                    <DialogDescription className="pt-2">
                        {config.description}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* Reason Category — Role-Specific */}
                    <div className="space-y-2">
                        <Label>Reason for Request <span className="text-red-500">*</span></Label>
                        <Select value={reasonCategory} onValueChange={setReasonCategory}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a reason..." />
                            </SelectTrigger>
                            <SelectContent>
                                {config.reasons.map((cat) => (
                                    <SelectItem key={cat} value={cat}>
                                        {cat}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Role-Specific Fields */}
                    {config.fields.map((field) => (
                        <div key={field.key} className="space-y-2">
                            <Label>{field.label} <span className="text-red-500">*</span></Label>
                            {field.type === 'institution_search' ? (
                                /* ─── Searchable Institution Combobox ─── */
                                <div ref={institutionRef} className="relative">
                                    {roleFields[field.key] ? (
                                        /* Selected institution chip */
                                        <div className="flex items-center justify-between border rounded-md px-3 py-2 bg-slate-50">
                                            <div className="flex items-center gap-2">
                                                <GraduationCap className="h-4 w-4 text-teal-600" />
                                                <span className="text-sm font-medium">{roleFields[field.key]}</span>
                                            </div>
                                            <Button
                                                type="button" variant="ghost" size="sm"
                                                className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                                                onClick={() => {
                                                    handleFieldChange(field.key, '');
                                                    setInstitutionSearchQuery('');
                                                    setShowInstitutionDropdown(false);
                                                }}
                                            >
                                                ✕
                                            </Button>
                                        </div>
                                    ) : (
                                        /* Search input */
                                        <>
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                <Input
                                                    value={institutionSearchQuery}
                                                    onChange={(e) => {
                                                        setInstitutionSearchQuery(e.target.value);
                                                        setShowInstitutionDropdown(true);
                                                    }}
                                                    onFocus={() => setShowInstitutionDropdown(true)}
                                                    placeholder={
                                                        !roleFields['education_level']
                                                            ? 'Select education level first...'
                                                            : `Search ${roleFields['education_level'].toLowerCase()}s...`
                                                    }
                                                    disabled={!roleFields['education_level']}
                                                    className="pl-9"
                                                />
                                                {institutionSearching && (
                                                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                                                )}
                                            </div>

                                            {/* Dropdown results */}
                                            {showInstitutionDropdown && roleFields['education_level'] && (
                                                <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                                    {institutionResults.length > 0 ? (
                                                        institutionResults.map((inst, idx) => (
                                                            <button
                                                                key={inst.id || idx}
                                                                type="button"
                                                                className="flex items-center gap-2 w-full text-left px-3 py-2 text-sm hover:bg-teal-50 hover:text-teal-700 transition-colors"
                                                                onClick={() => {
                                                                    handleFieldChange(field.key, inst.name);
                                                                    setInstitutionSearchQuery('');
                                                                    setShowInstitutionDropdown(false);
                                                                }}
                                                            >
                                                                <GraduationCap className="h-4 w-4 text-gray-400 shrink-0" />
                                                                <div className="min-w-0">
                                                                    <div className="font-medium truncate">{inst.name}</div>
                                                                    {inst.location && (
                                                                        <div className="text-xs text-gray-400 truncate">{inst.location}</div>
                                                                    )}
                                                                </div>
                                                            </button>
                                                        ))
                                                    ) : institutionSearching ? (
                                                        <div className="px-3 py-4 text-sm text-gray-400 text-center">
                                                            <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                                                            Searching...
                                                        </div>
                                                    ) : (
                                                        <div className="px-3 py-4 text-sm text-gray-400 text-center">
                                                            {institutionSearchQuery
                                                                ? 'No institutions found'
                                                                : `Type to search ${roleFields['education_level'].toLowerCase()}s`}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            ) : field.type === 'select' && field.options ? (
                                <Select
                                    value={roleFields[field.key] || ''}
                                    onValueChange={(v) => {
                                        handleFieldChange(field.key, v);
                                        // Clear institution when education level changes
                                        if (field.key === 'education_level') {
                                            handleFieldChange('institution', '');
                                            setInstitutionSearchQuery('');
                                            setInstitutionResults([]);
                                        }
                                    }}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={`Select ${field.label.toLowerCase()}...`} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {field.options.map((opt) => (
                                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <Input
                                    type={field.type}
                                    value={roleFields[field.key] || ''}
                                    onChange={(e) => handleFieldChange(field.key, e.target.value)}
                                    placeholder={field.placeholder}
                                />
                            )}
                        </div>
                    ))}

                    {/* Justification Text */}
                    <div className="space-y-2">
                        <Label>Additional Details (Optional)</Label>
                        <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Provide any extra context that might help the reviewer..."
                            className="min-h-[70px]"
                        />
                    </div>

                    {/* File Upload — Role-Specific Label */}
                    <div className="space-y-2">
                        <Label>Supporting Documentation</Label>
                        <div className="flex items-center gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleFileUpload}
                                className="w-full border-dashed"
                            >
                                {uploadedFile ? (
                                    <>
                                        <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                                        {uploadedFile}
                                    </>
                                ) : (
                                    <>
                                        <Upload className="mr-2 h-4 w-4" />
                                        {config.uploadLabel}
                                    </>
                                )}
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {config.uploadHint}
                        </p>
                    </div>

                    {/* Terms Checkbox */}
                    <div className="flex items-start space-x-2 pt-2">
                        <Checkbox
                            id="terms"
                            checked={agreedToTerms}
                            onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                            className="mt-0.5"
                        />
                        <Label
                            htmlFor="terms"
                            className="text-sm font-medium leading-tight peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            I verify that the provided information is accurate and I am authorized for this role.
                        </Label>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !reasonCategory || !agreedToTerms || !requiredFieldsFilled}
                        className="bg-teal-600 hover:bg-teal-700"
                    >
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit Request
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
