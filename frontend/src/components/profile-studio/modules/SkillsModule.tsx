import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, CheckCircle, Shield, Zap, Loader2 } from 'lucide-react';
import { profileService, CandidateProfile } from '@/services/profile/profileService';
import { AssessmentModule } from './AssessmentModule';

export const SkillsModule = () => {
    const navigate = useNavigate();
    const [profile, setProfile] = useState<CandidateProfile | null>(null);
    const [skills, setSkills] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');

    useEffect(() => {
        loadSkills();
    }, []);

    const loadSkills = async () => {
        try {
            const res = await profileService.getProfile();
            if (res.success) {
                setProfile(res.data);
                if (res.data.skills) {
                    const mappedSkills = res.data.skills.map((s: any) => ({
                        ...s,
                        score: s.assessment_score || 0
                    }));
                    setSkills(mappedSkills);
                }
            }
        } catch (error) {
            console.error("Failed to load skills", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-blue-600" /></div>;

    const filteredSkills = filter === 'All' ? skills : skills.filter(s => {
        if (filter === 'Soft') return s.category === 'Soft' || s.category === 'Soft Skills';
        return s.category === filter;
    });

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Skills Matrix</h2>
                    <p className="text-gray-500">Validated competencies from your assessments.</p>
                </div>
                {/* ... Header Content ... */}
            </div>

            {/* Matrix Content */}
            <div className="flex space-x-2">
                {['All', 'Technical', 'Soft'].map(f => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* Assessment Call-to-Action */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-8 text-white shadow-lg flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold mb-2 flex items-center">
                        <Shield className="mr-2" /> Verify Your Skills
                    </h3>
                    <p className="opacity-90 max-w-lg">
                        Take our 15-minute standard assessment to earn a "Verified" badge. Verified candidates are prioritized by top employers.
                    </p>
                </div>
                <button
                    onClick={() => navigate('/assessments')}
                    className="bg-white text-indigo-600 px-6 py-3 rounded-full font-bold shadow-md hover:shadow-lg transition-transform hover:-translate-y-1"
                >
                    Start Assessment
                </button>
            </div>

            {/* Skills Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredSkills.map((skill, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-blue-200 transition-colors">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h4 className="font-bold text-gray-900 text-lg flex items-center">
                                    {skill.name}
                                    {skill.verified && (
                                        <div title="Verified by Assessment">
                                            <CheckCircle size={16} className="ml-2 text-blue-500" />
                                        </div>
                                    )}
                                </h4>
                                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded mt-1 inline-block">
                                    {skill.category}
                                </span>
                            </div>
                            <span className={`text-sm font-bold px-3 py-1 rounded-full ${skill.level === 'Expert' ? 'bg-purple-100 text-purple-700' :
                                skill.level === 'Advanced' ? 'bg-green-100 text-green-700' :
                                    'bg-blue-100 text-blue-700'
                                }`}>
                                {skill.level}
                            </span>
                        </div>

                        {/* Progress Bar (Score) */}
                        <div className="relative pt-1">
                            <div className="flex mb-2 items-center justify-between">
                                <div>
                                    <span className="text-xs font-semibold inline-block text-gray-600">
                                        Proficiency Score
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs font-semibold inline-block text-gray-600">
                                        {skill.score > 0 ? `${skill.score}%` : 'Not Assessed'}
                                    </span>
                                </div>
                            </div>
                            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-100">
                                <div
                                    style={{ width: `${skill.score}%` }}
                                    className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${skill.verified ? 'bg-gradient-to-r from-blue-400 to-blue-600' : 'bg-gray-300'
                                        }`}
                                ></div>
                            </div>
                        </div>

                        {!skill.verified && (
                            <button
                                onClick={() => navigate('/assessments')}
                                className="text-xs text-blue-600 flex items-center hover:underline mt-2"
                            >
                                <Zap size={12} className="mr-1" />
                                Verify this skill
                            </button>
                        )}
                    </div>
                ))}

                {/* Add New Skill Card */}
                <button className="border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center p-6 text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors min-h-[160px]">
                    <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-2">
                        <span className="text-2xl font-light">+</span>
                    </div>
                    <span className="font-medium">Add Skill</span>
                </button>
            </div>

            {/* Assessment Integration */}
            <div className="mt-12">
                <div className="border-t border-gray-200 my-8"></div>
                {profile && <AssessmentModule profile={profile} />}
            </div>
        </div>
    );
};
