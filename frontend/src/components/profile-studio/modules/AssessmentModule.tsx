import React from 'react';
import { Assessment, CandidateProfile } from '../../../services/profile/profileService';
import { CheckCircle, Award, TrendingUp, ShieldCheck, Globe } from 'lucide-react';

interface AssessmentModuleProps {
    profile: CandidateProfile;
}

export const AssessmentModule: React.FC<AssessmentModuleProps> = ({ profile }) => {
    const assessments = profile?.assessments || [];

    // Filter Assessments
    const d33Assessments = assessments.filter(a => a.d33_sector);
    const culturalAssessments = assessments.filter(a => a.assessment_type === 'cultural' || a.assessment_type === 'cultural_competency');
    const technicalAssessments = assessments.filter(a => a.assessment_type === 'technical' || a.assessment_type === 'technical_skills');
    const otherAssessments = assessments.filter(a => !a.d33_sector && a.assessment_type !== 'cultural' && a.assessment_type !== 'technical' && a.assessment_type !== 'cultural_competency' && a.assessment_type !== 'technical_skills');

    const getScoreColor = (score: number, max: number) => {
        const percentage = (score / max) * 100;
        if (percentage >= 90) return 'text-green-600 bg-green-50 border-green-200';
        if (percentage >= 75) return 'text-blue-600 bg-blue-50 border-blue-200';
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    };

    const getProgressBarD33 = (score: number, max: number) => {
        const percentage = (score / max) * 100;
        return (
            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                <div
                    className="bg-indigo-600 h-2.5 rounded-full"
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        );
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Skills & Assessments</h2>
                <p className="text-gray-500">Validated competencies and D33 strategic alignment.</p>
            </div>

            {/* D33 Strategic Alignment Badge */}
            {d33Assessments.length > 0 && (
                <div className="bg-gradient-to-r from-indigo-900 to-purple-900 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <TrendingUp size={120} />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <Award className="w-8 h-8 text-yellow-400" />
                            <h3 className="text-xl font-bold">D33 Strategic Alignment</h3>
                        </div>
                        <p className="text-indigo-200 mb-6 max-w-2xl">
                            Your profile exhibits strong alignment with Dubai's D33 Economic Agenda sectors.
                            You are identified as high-potential talent for key growth industries.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {d33Assessments.map(test => (
                                <div key={test.id} className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                                    <h4 className="font-semibold text-white mb-1">{test.d33_sector}</h4>
                                    <p className="text-xs text-indigo-200 mb-2">{test.title}</p>
                                    <div className="flex justify-between items-end mb-1">
                                        <span className="text-2xl font-bold">{test.score}</span>
                                        <span className="text-xs opacity-75">/ {test.max_score}</span>
                                    </div>
                                    {getProgressBarD33(test.score, test.max_score)}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* UAE Cultural Competency */}
                {culturalAssessments.length > 0 ? (
                    <div className="lg:col-span-1 bg-white border border-yellow-100 rounded-xl shadow-sm p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-50 rounded-bl-full -mr-8 -mt-8 z-0"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-4 text-emerald-800">
                                <Globe className="w-6 h-6" />
                                <h3 className="font-bold text-lg">National Identity</h3>
                            </div>

                            {culturalAssessments.map(test => (
                                <div key={test.id} className="text-center py-6">
                                    <div className="inline-flex items-center justify-center w-32 h-32 rounded-full border-4 border-emerald-100 bg-emerald-50 mb-4">
                                        <div className="text-center">
                                            <span className="block text-3xl font-bold text-emerald-800">{test.score}</span>
                                            <span className="text-xs text-emerald-600">out of {test.max_score}</span>
                                        </div>
                                    </div>
                                    <h4 className="font-semibold text-gray-900 mb-1">{test.title}</h4>
                                    <p className="text-sm text-gray-500">High Proficiency</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="lg:col-span-1 bg-gray-50 border border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-center">
                        <Globe className="w-10 h-10 text-gray-400 mb-3" />
                        <h3 className="font-medium text-gray-900">Measurement Pending</h3>
                        <p className="text-sm text-gray-500 mt-1">Take the UAE Cultural Competency assessment to verify your national identity alignment.</p>
                        <button className="mt-4 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                            Take Assessment
                        </button>
                    </div>
                )}

                {/* Technical & Other Skills */}
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-gray-500" />
                        Verified Competencies
                    </h3>

                    {technicalAssessments.length === 0 && otherAssessments.length === 0 && (
                        <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            <p className="text-gray-500">No technical assessments completed yet.</p>
                        </div>
                    )}

                    {[...technicalAssessments, ...otherAssessments].map(test => (
                        <div key={test.id} className="bg-white border border-gray-100 rounded-lg p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <h4 className="font-semibold text-gray-900">{test.title}</h4>
                                    {test.assessment_type === 'technical' && (
                                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">Technical</span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Completed on {new Date(test.completed_at || '').toLocaleDateString()}</p>
                            </div>

                            <div className={`px-4 py-2 rounded-lg font-bold border ${getScoreColor(test.score, test.max_score)}`}>
                                {test.score} / {test.max_score}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
