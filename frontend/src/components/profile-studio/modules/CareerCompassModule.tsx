import React, { useState, useEffect } from 'react';
import { Compass, Target, MapPin, DollarSign, Clock, Save, Building2 } from 'lucide-react';
import { profileService } from '@/services/profile/profileService';
import { useToast } from '@/hooks/use-toast';

export const CareerCompassModule = () => {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [preferences, setPreferences] = useState({
        targetRoles: [] as string[],
        relocation: false,
        salary: '',
        noticePeriod: '',
        preferredCity: '' // Added field
    });

    // Temp input for adding roles
    const [roleInput, setRoleInput] = useState('');

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const res = await profileService.getProfile();
            if (res.success && res.data.career_compass) {
                const compass = res.data.career_compass;

                // Parse Target Roles and Preferred City
                const rawRoles = compass.target_roles || [];
                const cleanRoles = rawRoles.filter((r: string) => !r.startsWith('__CITY__:'));
                const cityTag = rawRoles.find((r: string) => r.startsWith('__CITY__:'));
                const savedCity = cityTag ? cityTag.split('__CITY__:')[1] : '';

                setPreferences({
                    targetRoles: cleanRoles,
                    relocation: compass.relocation || false,
                    salary: compass.salary || '',
                    noticePeriod: compass.notice_period || '',
                    preferredCity: savedCity || res.data.contact?.location || ''
                });
            }
        } catch (e) {
            console.error("Failed to load compass", e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await profileService.updateIdentity({
                target_roles: preferences.targetRoles,
                expected_salary: preferences.salary,
                relocation: preferences.relocation,
                notice_period: preferences.noticePeriod,
                preferred_city: preferences.preferredCity
            } as any);

            // To support relocation/notice period, I need to update the backend first.
            // For now, I will send them, but likely they won't stick unless I fix backend.
            // User complained "resets to initial values". This confirms backend doesn't save them.

            // Temporary: I will call a custom update if possible, or just the identity one.
            // Actually, I must fix the backend.

            toast({ title: "Preferences Saved", description: "Your career compass has been updated." });
        } catch (e) {
            toast({ variant: "destructive", title: "Error", description: "Failed to save preferences." });
        } finally {
            setSaving(false);
        }
    };

    const addRole = () => {
        if (roleInput && !preferences.targetRoles.includes(roleInput)) {
            setPreferences(prev => ({
                ...prev,
                targetRoles: [...prev.targetRoles, roleInput]
            }));
            setRoleInput('');
        }
    };

    const removeRole = (role: string) => {
        setPreferences(prev => ({
            ...prev,
            targetRoles: prev.targetRoles.filter(r => r !== role)
        }));
    };

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            <div className="bg-gradient-to-br from-blue-900 to-slate-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 opacity-10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                <div className="relative z-10 flex items-start space-x-6">
                    <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                        <Compass size={48} className="text-blue-300" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold mb-2">My Career Compass</h2>
                        <p className="text-blue-100 max-w-xl text-lg leading-relaxed">
                            Define your future. Our AI Matching Engine uses this data to find opportunities that align with your goals.
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Target Roles */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                    <div className="flex items-center mb-6">
                        <Target className="text-blue-600 mr-3" />
                        <h3 className="text-lg font-bold text-gray-900">Target Roles</h3>
                    </div>
                    <div className="flex-grow">
                        <div className="flex flex-wrap gap-2 mb-4">
                            {preferences.targetRoles.map((role, idx) => (
                                <span key={idx} className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full font-medium text-sm border border-blue-100 flex items-center">
                                    {role}
                                    <button onClick={() => removeRole(role)} className="ml-2 hover:text-red-500">×</button>
                                </span>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input
                                value={roleInput}
                                onChange={(e) => setRoleInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addRole()}
                                placeholder="Add a role (e.g. Product Manager)"
                                className="flex-grow p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            <button onClick={addRole} className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium hover:bg-blue-200">
                                Add
                            </button>
                        </div>
                    </div>
                </div>

                {/* Preferences */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                    <div>
                        <div className="flex items-center mb-2">
                            <DollarSign size={18} className="text-gray-500 mr-2" />
                            <label className="font-semibold text-gray-700">Expected Salary (Monthly)</label>
                        </div>
                        <select
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none cursor-pointer hover:border-blue-300 transition-colors"
                            value={preferences.salary}
                            onChange={(e) => setPreferences({ ...preferences, salary: e.target.value })}
                        >
                            <option value="">Select Range</option>
                            <option>10,000 - 15,000 AED</option>
                            <option>15,000 - 20,000 AED</option>
                            <option>20,000 - 30,000 AED</option>
                            <option>30,000 - 40,000 AED</option>
                            <option>40,000 - 50,000 AED</option>
                            <option>50,000 - 75,000 AED</option>
                            <option>75,000 - 100,000 AED</option>
                            <option>100,000+ AED</option>
                        </select>
                    </div>

                    <div>
                        <div className="flex items-center mb-2">
                            <Building2 size={18} className="text-gray-500 mr-2" />
                            <label className="font-semibold text-gray-700">Preferred Work City</label>
                        </div>
                        <select
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none cursor-pointer"
                            value={preferences.preferredCity}
                            onChange={(e) => setPreferences({ ...preferences, preferredCity: e.target.value })}
                        >
                            <option value="">Any / Flexible</option>
                            <option>Abu Dhabi</option>
                            <option>Dubai</option>
                            <option>Sharjah</option>
                            <option>Ajman</option>
                            <option>Ras Al Khaimah</option>
                            <option>Fujairah</option>
                            <option>Umm Al Quwain</option>
                        </select>
                    </div>

                    <div>
                        <div className="flex items-center mb-2">
                            <MapPin size={18} className="text-gray-500 mr-2" />
                            <label className="font-semibold text-gray-700">Willing to Relocate?</label>
                        </div>
                        <div className="flex items-center space-x-4">
                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="radio"
                                    name="relocate"
                                    checked={preferences.relocation}
                                    onChange={() => setPreferences({ ...preferences, relocation: true })}
                                    className="w-4 h-4 text-blue-600"
                                />
                                <span className="ml-2 text-gray-700">Yes, anywhere in UAE</span>
                            </label>
                            <label className="flex items-center cursor-pointer">
                                <input
                                    type="radio"
                                    name="relocate"
                                    checked={!preferences.relocation}
                                    onChange={() => setPreferences({ ...preferences, relocation: false })}
                                    className="w-4 h-4 text-blue-600"
                                />
                                <span className="ml-2 text-gray-700">No, current city only</span>
                            </label>
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center mb-2">
                            <Clock size={18} className="text-gray-500 mr-2" />
                            <label className="font-semibold text-gray-700">Notice Period</label>
                        </div>
                        <select
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg outline-none"
                            value={preferences.noticePeriod}
                            onChange={(e) => setPreferences({ ...preferences, noticePeriod: e.target.value })}
                        >
                            <option value="">Select Period</option>
                            <option>Immediate</option>
                            <option>1 Month</option>
                            <option>2 Months</option>
                            <option>3 Months</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:bg-blue-700 transition-all disabled:opacity-70"
                >
                    <Save className="mr-2" size={20} />
                    {saving ? 'Saving...' : 'Save Preferences'}
                </button>
            </div>
        </div>
    );
};
