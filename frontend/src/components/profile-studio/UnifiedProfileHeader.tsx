
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    User,
    GraduationCap,
    Users,
    CheckCircle,
    AlertCircle,
    Shield,
    RefreshCw,
    Plus
} from 'lucide-react';
import { restClient } from '@/utils/api';
import { getDisplayName } from '@/utils/nameUtils';
import { useToast } from '@/hooks/use-toast';

// Define Interfaces
interface UserProfile {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    primaryRole: string;
    secondaryRoles: string[];
    profileCompletion: number;
    lastUpdated: string;
    verificationStatus: 'verified' | 'pending' | 'unverified';
    profileVisibility: 'public' | 'professional' | 'organization' | 'private';
    profilePhotoUrl?: string;
}

interface UnifiedProfileHeaderProps {
    initialProfile?: any; // Allow loose typing to adapt from IdentityModule profile
    cvUploaded?: boolean;
}

import { RoleRequestDialog } from '@/components/profile/RoleRequestDialog';
import { useAuth } from '@/context/AuthContext';
import { normalizeRole } from '@/types/auth';

export const UnifiedProfileHeader: React.FC<UnifiedProfileHeaderProps> = ({ initialProfile, cvUploaded = false }) => {
    const { toast } = useToast();
    const navigate = useNavigate();
    const { switchRole, refreshUser } = useAuth();

    const calculateCompletion = (profile: any, hasCv: boolean) => {
        if (!profile) return 0;
        let score = 0;

        // Basic Info (30%)
        if (profile.first_name || profile.full_name) score += 10;
        if (profile.headline) score += 10;
        if (profile.bio) score += 10;

        // Contact (20%)
        if (profile.contact?.phone) score += 10;
        if (profile.contact?.location) score += 10;

        // Assets (50%)
        if (hasCv) score += 30; // CV is major
        if (profile.skills && profile.skills.length > 0) score += 10;
        if (profile.experience && profile.experience.length > 0) score += 10;

        return Math.min(score, 100);
    };

    // Transform initialProfile to match UserProfile structure if needed
    const [currentUser, setCurrentUser] = useState<UserProfile>({
        id: initialProfile?.id || '1',
        firstName: initialProfile?.first_name || 'Job',
        lastName: initialProfile?.last_name || 'Seeker',
        email: initialProfile?.email || initialProfile?.contact?.email || 'user@example.com',
        primaryRole: 'Job Seeker', // Default
        secondaryRoles: [],
        profileCompletion: calculateCompletion(initialProfile, cvUploaded),
        lastUpdated: new Date().toISOString().split('T')[0],
        verificationStatus: initialProfile?.verification_status || (calculateCompletion(initialProfile, cvUploaded) >= 80 ? 'verified' : calculateCompletion(initialProfile, cvUploaded) >= 40 ? 'pending' : 'unverified'),
        profileVisibility: initialProfile?.profile_visibility || 'professional',
        profilePhotoUrl: initialProfile?.profile_photo_url
    });

    const [possessedRoles, setPossessedRoles] = useState<string[]>(['Job Seeker']);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [requestDialog, setRequestDialog] = useState({ isOpen: false, role: '' });

    // Fetch Roles
    useEffect(() => {
        const fetchUserRoles = async () => {
            try {
                const { data } = await restClient.get('/api/auth/roles');
                if (data.success) {
                    const allRoles = [data.data.role, ...(data.data.secondary_roles || [])].filter(Boolean);
                    setPossessedRoles(allRoles);

                    setCurrentUser(prev => ({
                        ...prev,
                        primaryRole: data.data.role || 'Job Seeker',
                        secondaryRoles: data.data.secondary_roles || []
                    }));
                }
            } catch (error) {
                console.error("Failed to fetch user roles", error);
            }
        };
        fetchUserRoles();
    }, []);

    // Update effect when prop changes
    useEffect(() => {
        if (initialProfile) {
            setCurrentUser(prev => ({
                ...prev,
                firstName: initialProfile.full_name?.split(' ')[0] || initialProfile.first_name || prev.firstName,
                lastName: initialProfile.full_name?.split(' ').slice(1).join(' ') || initialProfile.last_name || prev.lastName,
                email: initialProfile.email || initialProfile.contact?.email || prev.email,
                profilePhotoUrl: initialProfile.profile_photo_url || prev.profilePhotoUrl,
                profileCompletion: calculateCompletion(initialProfile, cvUploaded)
            }));
        }
    }, [initialProfile, cvUploaded]);


    // Helper Configuration
    const roleConfigs: Record<string, any> = {
        'job_seeker': { label: 'Job Seeker', icon: User, color: 'bg-teal-500' },
        'student': { label: 'Student', icon: GraduationCap, color: 'bg-teal-500' },
        'recruiter': { label: 'HR Recruiter', icon: Users, color: 'bg-green-500' }, // Updated Label
        'hr_manager': { label: 'HR Manager', icon: Users, color: 'bg-green-600' }, // Added
        'educator': { label: 'Educator', icon: GraduationCap, color: 'bg-purple-500' },
        'mentor': { label: 'Mentor', icon: AlertCircle, color: 'bg-orange-500' }, // Added (Icon placeholder)
        'assessor': { label: 'Assessor', icon: CheckCircle, color: 'bg-red-500' }, // Added
        'guardian': { label: 'Guardian', icon: Shield, color: 'bg-slate-500' } // Added
    };

    const getRoleConfigKey = (role: string) => {
        const normalized = normalizeRole(role) as string;
        if (normalized === 'candidate') return 'job_seeker';
        if (normalized === 'hr/recruiter' || normalized === 'hr_recruiter') return 'recruiter';
        return normalized;
    };

    const getCurrentRoleConfig = () => {
        const configKey = getRoleConfigKey(currentUser.primaryRole);
        return roleConfigs[configKey] || roleConfigs['job_seeker'];
    };

    const handleRoleSwitch = async (newRole: string) => {
        // Update local state for immediate feedback
        setCurrentUser(prev => ({ ...prev, primaryRole: newRole }));

        // Update global auth context
        try {
            // Force refresh first to get latest roles from backend (e.g. if just approved)
            await refreshUser();
            await switchRole(newRole);
        } catch (error) {
            console.error("Failed to switch global role:", error);
            // Optional: revert local state or show error
        }

        // redirect based on role
        const normalized = getRoleConfigKey(newRole);
        let path = '/candidate-dashboard';
        if (normalized === 'hr_manager' || normalized === 'recruiter') path = '/recruiter-dashboard';
        else if (normalized === 'educator') path = '/educator-dashboard';
        else if (normalized === 'student') path = '/student-dashboard';
        else if (normalized === 'admin') path = '/admin-dashboard';

        navigate(path);

        toast({
            title: "Role Switched",
            description: `Active persona switched to ${newRole}`,
        });
    };

    const roleConfig = getCurrentRoleConfig();
    const RoleIcon = roleConfig.icon;

    const getVerificationBadge = () => {
        switch (currentUser.verificationStatus) {
            case 'verified':
                return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Verified</Badge>;
            case 'pending':
                return <Badge className="bg-yellow-100 text-yellow-800"><AlertCircle className="h-3 w-3 mr-1" />Pending</Badge>;
            default:
                return <Badge className="bg-gray-100 text-gray-800"><AlertCircle className="h-3 w-3 mr-1" />Unverified</Badge>;
        }
    };

    const getCompletionColor = (percentage: number) => {
        if (percentage >= 90) return 'text-green-600';
        if (percentage >= 70) return 'text-yellow-600';
        return 'text-red-600';
    };

    const [showAddRoleMenu, setShowAddRoleMenu] = useState(false); // Add state for dropdown

    // ... (helper functions) ...

    return (
        <Card className="mb-6 overflow-visible"> {/* overflow-visible for dropdown */}
            <CardHeader>
                {/* ... existing header ... */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        {currentUser.profilePhotoUrl ? (
                            <Avatar className="h-16 w-16 border-2 border-white shadow-sm">
                                <AvatarImage src={currentUser.profilePhotoUrl} alt="Profile" className="object-cover" />
                                <AvatarFallback className={`${roleConfig.color} text-white`}>
                                    {currentUser.firstName?.[0]}{currentUser.lastName?.[0]}
                                </AvatarFallback>
                            </Avatar>
                        ) : (
                            <div className={`p-3 rounded-full ${roleConfig.color} text-white`}>
                                <RoleIcon className="h-6 w-6" />
                            </div>
                        )}
                        <div>
                            <CardTitle className="text-2xl">
                                {getDisplayName(currentUser)}
                            </CardTitle>
                            <CardDescription className="text-lg">
                                {roleConfig.label} • {currentUser.email}
                            </CardDescription>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {getVerificationBadge()}
                        <Badge variant="outline">
                            <Shield className="h-3 w-3 mr-1" />
                            {currentUser.profileVisibility}
                        </Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Profile Completion */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium">Profile Completion</span>
                            <span className={`text-sm font-bold ${getCompletionColor(currentUser.profileCompletion)}`}>
                                {currentUser.profileCompletion}%
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-teal-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${currentUser.profileCompletion}%` }}
                            />
                        </div>
                    </div>

                    {/* Role Switching */}
                    <div>
                        <span className="text-sm font-medium mb-2 block">Switch Persona</span>
                        <div className="flex flex-wrap gap-2 items-center relative">
                            {/* Logic to split roles */}
                            {(() => {
                                const allKeys = Object.keys(roleConfigs);
                                const normalizedPossessed = possessedRoles.map(getRoleConfigKey);

                                const ownedKeys = allKeys.filter(k => normalizedPossessed.includes(k));
                                const unownedKeys = allKeys.filter(k => !normalizedPossessed.includes(k));

                                return (
                                    <>
                                        {/* Owned Roles List */}
                                        {ownedKeys.map(roleKey => {
                                            const config = roleConfigs[roleKey];
                                            const isCurrent = getRoleConfigKey(currentUser.primaryRole) === roleKey;
                                            return (
                                                <Button
                                                    key={roleKey}
                                                    size="sm"
                                                    variant={isCurrent ? "default" : "outline"}
                                                    className={`text-xs ${isCurrent ? 'bg-teal-600 hover:bg-teal-700' : 'text-gray-600'}`}
                                                    onClick={() => !isCurrent && handleRoleSwitch(roleKey)}
                                                >
                                                    <config.icon className="h-3 w-3 mr-1" />
                                                    {config.label}
                                                </Button>
                                            )
                                        })}

                                        {/* Add Role Button */}
                                        {unownedKeys.length > 0 && (
                                            <div className="relative">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-xs text-teal-600 hover:text-teal-800 hover:bg-teal-50 border border-dashed border-teal-200"
                                                    onClick={() => setShowAddRoleMenu(!showAddRoleMenu)}
                                                >
                                                    <Plus className="h-3 w-3 mr-1" />
                                                    Add Persona
                                                </Button>

                                                {/* Dropdown Menu */}
                                                {showAddRoleMenu && (
                                                    <>
                                                        <div
                                                            className="fixed inset-0 z-40"
                                                            onClick={() => setShowAddRoleMenu(false)}
                                                        />
                                                        <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-1 animate-in fade-in zoom-in-95 duration-200">
                                                            <div className="text-[10px] uppercase font-bold text-gray-400 px-2 py-2">Available Pathways</div>
                                                            <div className="max-h-60 overflow-y-auto">
                                                                {unownedKeys.map(roleKey => (
                                                                    <button
                                                                        key={roleKey}
                                                                        className="flex items-center w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-teal-50 hover:text-teal-700 rounded-md transition-colors"
                                                                        onClick={() => {
                                                                            setShowAddRoleMenu(false);
                                                                            setRequestDialog({ isOpen: true, role: roleConfigs[roleKey].label });
                                                                        }}
                                                                    >
                                                                        {React.createElement(roleConfigs[roleKey].icon, { className: "h-4 w-4 mr-2 opacity-70" })}
                                                                        {roleConfigs[roleKey].label}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    </div>

                    {/* Last Updated */}
                    <div>
                        <span className="text-sm font-medium mb-2 block">Last Updated</span>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">{currentUser.lastUpdated}</span>
                            <Button variant="outline" size="sm" disabled={isRefreshing} onClick={async () => {
                                setIsRefreshing(true);
                                try {
                                    const { data } = await restClient.get('/api/profile/v2/me');
                                    if (data.success && data.profile) {
                                        const p = data.profile;
                                        const comp = calculateCompletion(p, cvUploaded);
                                        setCurrentUser(prev => ({
                                            ...prev,
                                            firstName: p.full_name?.split(' ')[0] || p.first_name || prev.firstName,
                                            lastName: p.full_name?.split(' ').slice(1).join(' ') || p.last_name || prev.lastName,
                                            email: p.email || p.contact?.email || prev.email,
                                            profileCompletion: comp,
                                            lastUpdated: new Date().toISOString().split('T')[0],
                                            verificationStatus: comp >= 80 ? 'verified' : comp >= 40 ? 'pending' : 'unverified',
                                            profilePhotoUrl: p.profile_photo_url || prev.profilePhotoUrl,
                                        }));
                                        toast({ title: 'Profile refreshed', description: `Completion: ${comp}%` });
                                    }
                                } catch (err) {
                                    console.error('Refresh failed:', err);
                                    toast({ title: 'Refresh failed', description: 'Could not reload profile data.', variant: 'destructive' });
                                } finally {
                                    setIsRefreshing(false);
                                }
                            }}>
                                <RefreshCw className={`h-3 w-3 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                                Refresh Data
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>

            <RoleRequestDialog
                isOpen={requestDialog.isOpen}
                role={requestDialog.role}
                onClose={() => setRequestDialog({ ...requestDialog, isOpen: false })}
                onRequestSubmitted={async () => {
                    // Refresh roles to pick up auto-approved roles (e.g., Job Seeker)
                    try {
                        const { data } = await restClient.get('/api/auth/roles');
                        if (data.success) {
                            const allRoles = [data.data.role, ...(data.data.secondary_roles || [])].filter(Boolean);
                            setPossessedRoles(allRoles);
                            setCurrentUser(prev => ({
                                ...prev,
                                primaryRole: data.data.role || 'Job Seeker',
                                secondaryRoles: data.data.secondary_roles || []
                            }));
                        }
                    } catch (e) {
                        console.error('Failed to refresh roles after request', e);
                    }
                }}
            />
        </Card>
    );
};
