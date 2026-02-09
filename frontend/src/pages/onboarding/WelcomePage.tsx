
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import authService, { LoginData } from '@/services/authService';
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
        id: 'job_seeker',
        title: 'Job Seeker',
        description: 'Find your dream job and advance your career.',
        icon: Briefcase,
        color: 'bg-blue-50 text-blue-600',
        borderColor: 'border-blue-200'
    },
    {
        id: 'student',
        title: 'Student',
        description: 'Apply for scholarships, internships, and programs.',
        icon: GraduationCap,
        color: 'bg-purple-50 text-purple-600',
        borderColor: 'border-purple-200'
    },
    {
        id: 'educator',
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
    }
];

const WelcomePage: React.FC = () => {
    const { user, refreshUser } = useAuth();
    const navigate = useNavigate();
    const [selectedRole, setSelectedRole] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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
            const metadata: any = {};
            if (selectedRole === 'educator') metadata.institution_name = institutionName;
            if (selectedRole === 'student') metadata.university_name = institutionName; // Reusing state var for simplicity
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
            case 'student':
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
            case 'educator':
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
                        {ROLES.map((role) => {
                            const Icon = role.icon;
                            const isSelected = selectedRole === role.id;

                            return (
                                <button
                                    key={role.id}
                                    onClick={() => handleRoleSelect(role.id)}
                                    className={`relative flex items-start p-4 rounded-xl border-2 transition-all duration-200 text-left hover:shadow-md
                      ${isSelected
                                            ? `border-teal-600 bg-teal-50 ring-1 ring-teal-600`
                                            : `border-border bg-card hover:border-gray-300`
                                        }
                    `}
                                >
                                    <div className={`flex-shrink-0 p-3 rounded-lg ${role.color}`}>
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <div className="ml-4 flex-1">
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
                                <div className="ml-3">
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
                            {!isLoading && <ArrowRight className="ml-2 -mr-1 h-5 w-5" />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WelcomePage;
