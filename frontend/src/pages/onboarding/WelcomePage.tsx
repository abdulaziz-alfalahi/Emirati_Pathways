
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import authService, { LoginData } from '@/services/authService';
import { restClient } from '@/utils/api';
import {
    Briefcase,
    GraduationCap,
    BookOpen,
    Users,
    CheckCircle2,
    ArrowRight
} from 'lucide-react';

// Define the roles for selection
const ROLES = [
    {
        id: 'candidate',
        title: 'Job Seeker',
        description: 'Find your dream job and advance your career.',
        icon: Briefcase,
        color: 'bg-blue-50 text-blue-600',
        borderColor: 'border-blue-200'
    },
    {
        id: 'candidate',
        title: 'Student',
        description: 'Apply for scholarships, internships, and programs.',
        icon: GraduationCap,
        color: 'bg-purple-50 text-purple-600',
        borderColor: 'border-purple-200'
    },
    {
        id: 'training_provider',
        title: 'Educator',
        description: 'Manage curriculum and track student progress.',
        icon: BookOpen,
        color: 'bg-emerald-50 text-emerald-600',
        borderColor: 'border-emerald-200'
    },
    {
        id: 'recruiter',
        title: 'Employer / Recruiter',
        description: 'Find top talent and manage job postings.',
        icon: Users,
        color: 'bg-orange-50 text-orange-600',
        borderColor: 'border-orange-200'
    },
    {
        id: 'operational_partner',
        title: 'Operational Partner',
        description: 'Manage Call Center operations or Career Services.',
        icon: Users,
        color: 'bg-indigo-50 text-indigo-600',
        borderColor: 'border-indigo-200'
    }
];

const isUAENational = (user: any) => {
    if (!user) return false;
    const nationality = (user.nationality || '').toUpperCase().trim();
    const nationalityAr = (user.nationality_ar || '').trim();
    return (
        nationality === 'UAE' ||
        nationality === 'ARE' ||
        nationality.includes('EMIRAT') ||
        nationality.includes('UNITED ARAB EMIRATES') ||
        nationalityAr.includes('إمارات') ||
        nationalityAr.includes('امارات')
    );
};

const WelcomePage: React.FC = () => {
    const { user, refreshUser } = useAuth();
    const navigate = useNavigate();
    const [selectedRole, setSelectedRole] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [selectedSubRole, setSelectedSubRole] = useState<string | null>(null);
    const [agencyName, setAgencyName] = useState('');
    const [requestNotes, setRequestNotes] = useState('');
    const [isRequestSubmitted, setIsRequestSubmitted] = useState(false);

    const isNational = isUAENational(user);

    useEffect(() => {
        if (user && isNational) {
            authService.getDashboardRoute().then((redirectPath) => {
                navigate(redirectPath, { replace: true });
            }).catch(() => {
                navigate('/candidate-dashboard', { replace: true });
            });
        }
    }, [user, isNational, navigate]);

    if (isRequestSubmitted) {
        return (
            <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="bg-card py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-border text-center">
                        <CheckCircle2 className="h-16 w-16 mx-auto text-teal-600 mb-4 animate-bounce" />
                        <h2 className="text-2xl font-bold text-foreground mb-2">Request Submitted</h2>
                        <p className="text-muted-foreground text-sm mb-6">
                            Your request for <strong>{selectedSubRole === 'call_center_agent' ? 'Call Center Agent' : 'Career Services Operator'}</strong> role access has been submitted successfully.
                        </p>
                        <p className="text-muted-foreground text-xs bg-slate-50 p-3 rounded-lg border border-border mb-6">
                            Agency: {agencyName}<br />
                            A Platform Administrator will review and approve your access shortly.
                        </p>
                        <button
                            onClick={async () => {
                                await authService.logout();
                                navigate('/auth');
                            }}
                            className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                        >
                            Sign Out & Exit
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (user && isNational) {
        return (
            <div className="min-h-screen bg-background flex flex-col justify-center items-center">
                <div className="flex flex-col items-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-600"></div>
                    <p className="text-muted-foreground text-sm">Redirecting to your dashboard...</p>
                </div>
            </div>
        );
    }

    const displayRoles = ROLES.filter(r => !(r.id === 'candidate' && r.title === 'Job Seeker'));


    // Metadata state based on role
    const [institutionName, setInstitutionName] = useState('');
    const [companyName, setCompanyName] = useState('');

    const handleRoleSelect = (roleId: string) => {
        setSelectedRole(roleId);
        setError(null);
    };

    const handleSubmit = async () => {
        if (!selectedRole) {
            setError("Please select a role to continue.");
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            if (selectedRole === 'operational_partner') {
                if (!selectedSubRole) {
                    setError("Please select call center or career services role.");
                    setIsLoading(false);
                    return;
                }
                if (!agencyName.trim()) {
                    setError("Please provide your outsourcing agency name.");
                    setIsLoading(false);
                    return;
                }

                // Submit role request to backend
                await restClient.post('/api/roles/request', {
                    role: selectedSubRole,
                    notes: `Agency: ${agencyName}. Note: ${requestNotes}`,
                    documents: {}
                });

                setIsRequestSubmitted(true);
                return;
            }

            const metadata: any = {};
            if (selectedRole === 'training_provider') metadata.institution_name = institutionName;
            if (selectedRole === 'candidate') metadata.university_name = institutionName; // Reusing state var for simplicity
            if (selectedRole === 'recruiter') metadata.company_name = companyName;

            // Call API to update role with metadata
            await authService.updateUserRoles(selectedRole, [], metadata);

            // Refresh local user context
            await refreshUser();

            // Determine redirect path
            const redirectPath = await authService.getDashboardRoute();

            // Navigate
            navigate(redirectPath);

        } catch (err: any) {
            console.error("Onboarding Error:", err);
            setError(err.message || "Failed to update profile. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const getRoleDetailsForm = () => {
        switch (selectedRole) {
            case 'candidate':
                return (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200 animate-in fade-in slide-in-from-top-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            University / School Name
                        </label>
                        <input
                            type="text"
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                            placeholder="e.g. UAE University"
                            value={institutionName}
                            onChange={(e) => setInstitutionName(e.target.value)}
                        />
                    </div>
                );
            case 'training_provider':
                return (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200 animate-in fade-in slide-in-from-top-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Institution Name
                        </label>
                        <input
                            type="text"
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                            placeholder="e.g. Ministry of Education"
                            value={institutionName}
                            onChange={(e) => setInstitutionName(e.target.value)}
                        />
                    </div>
                );
            case 'recruiter':
                return (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200 animate-in fade-in slide-in-from-top-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Company Name
                        </label>
                        <input
                            type="text"
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                            placeholder="e.g. Emirates Tech"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                        />
                    </div>
                );
            case 'operational_partner':
                return (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200 animate-in fade-in slide-in-from-top-4 space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Select Operational Role
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => setSelectedSubRole('call_center_agent')}
                                    className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                                        selectedSubRole === 'call_center_agent'
                                            ? 'border-indigo-600 bg-indigo-50 text-indigo-900 ring-1 ring-indigo-600'
                                            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    Call Center Agent
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSelectedSubRole('career_services_operator')}
                                    className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                                        selectedSubRole === 'career_services_operator'
                                            ? 'border-indigo-600 bg-indigo-50 text-indigo-900 ring-1 ring-indigo-600'
                                            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    Career Services Operator
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Outsourcing Agency Name
                            </label>
                            <input
                                type="text"
                                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="e.g. Moro Hub, Teleperformance"
                                value={agencyName}
                                onChange={(e) => setAgencyName(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Access Notes / Purpose
                            </label>
                            <textarea
                                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                                placeholder="State the reason for access (e.g., call center agent onboarding)"
                                value={requestNotes}
                                onChange={(e) => setRequestNotes(e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-4xl">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-extrabold text-foreground tracking-tight">
                        Welcome to Emirati Pathways
                    </h1>
                    <p className="mt-3 text-xl text-muted-foreground">
                        Tell us about yourself so we can personalize your experience.
                    </p>
                </div>

                <div className="bg-card py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-border">
                    <h2 className="text-lg font-semibold text-foreground mb-6">Select your primary role:</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {displayRoles.map((role) => {
                            const Icon = role.icon;
                            const isSelected = selectedRole === role.id;

                            return (
                                <button
                                    key={role.id}
                                    onClick={() => handleRoleSelect(role.id)}
                                    className={`relative flex items-start p-4 rounded-xl border-2 transition-all duration-200 text-start hover:shadow-md
                      ${isSelected
                                            ? `border-teal-600 bg-teal-50 ring-1 ring-teal-600`
                                            : `border-border bg-card hover:border-gray-300`
                                        }
                    `}
                                >
                                    <div className={`flex-shrink-0 p-3 rounded-lg ${role.color}`}>
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <div className="ms-4 flex-1">
                                        <div className="flex justify-between">
                                            <h3 className={`text-base font-semibold ${isSelected ? 'text-teal-900' : 'text-gray-900'}`}>
                                                {role.title}
                                            </h3>
                                            {isSelected && <CheckCircle2 className="w-5 h-5 text-teal-600" />}
                                        </div>
                                        <p className={`mt-1 text-sm ${isSelected ? 'text-teal-700' : 'text-gray-500'}`}>
                                            {role.description}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {getRoleDetailsForm()}

                    {error && (
                        <div className="mt-6 rounded-md bg-red-50 p-4 border border-red-200">
                            <div className="flex">
                                <div className="ms-3">
                                    <h3 className="text-sm font-medium text-red-800">{error}</h3>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="mt-8 flex justify-end">
                        <button
                            onClick={handleSubmit}
                            disabled={!selectedRole || isLoading}
                            className={`
                  inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white 
                  transition-colors duration-200
                  ${!selectedRole || isLoading
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500'
                                }
                `}
                        >
                            {isLoading ? 'Setting up...' : 'Continue to Dashboard'}
                            {!isLoading && <ArrowRight className="ms-2 -me-1 h-5 w-5" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WelcomePage;
