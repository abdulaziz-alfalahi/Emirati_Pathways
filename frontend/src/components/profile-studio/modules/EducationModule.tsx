import React, { useEffect, useState } from 'react';
import { profileService, EducationEntry } from '@/services/profile/profileService';
import { GraduationCap, Calendar, CheckCircle, Plus } from 'lucide-react';

export const EducationModule = () => {
    const [education, setEducation] = useState<EducationEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);

    // New Entry Form State
    const [newEntry, setNewEntry] = useState<EducationEntry>({
        institution: '',
        degree: '',
        field: '',
        start_date: '',
        end_date: '',
        grade: '',
        verification: { is_verified: false, source: 'self_reported' }
    });

    useEffect(() => {
        loadEducation();
    }, []);

    const loadEducation = async () => {
        try {
            const res = await profileService.getProfile();
            if (res.success && res.data.education) {
                setEducation(res.data.education);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            await profileService.addEducation(newEntry);
            setShowAddForm(false);
            setNewEntry({
                institution: '',
                degree: '',
                field: '',
                start_date: '',
                end_date: '',
                grade: '',
                verification: { is_verified: false, source: 'self_reported' }
            });
            loadEducation();
        } catch (e) {
            alert('Failed to save education');
        }
    };

    if (loading) return <div className="p-8">Loading credentials...</div>;

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Education & Credentials</h2>
                    <p className="text-gray-500">Manage your degrees and verify them with blockchain ID.</p>
                </div>
                <button
                    onClick={() => setShowAddForm(true)}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                >
                    <Plus size={18} />
                    <span>Add Education</span>
                </button>
            </div>

            {showAddForm && (
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-blue-100 animate-slide-down">
                    <h3 className="font-bold text-lg mb-4">Add Education</h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <input
                            placeholder="Institution (e.g. UAE University)"
                            className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={newEntry.institution}
                            onChange={e => setNewEntry({ ...newEntry, institution: e.target.value })}
                        />
                        <input
                            placeholder="Degree Level (e.g. Bachelor's)"
                            className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={newEntry.degree}
                            onChange={e => setNewEntry({ ...newEntry, degree: e.target.value })}
                        />
                        <input
                            placeholder="Field of Study (e.g. Computer Science)"
                            className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={newEntry.field}
                            onChange={e => setNewEntry({ ...newEntry, field: e.target.value })}
                        />
                        <input
                            placeholder="Grade / GPA"
                            className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={newEntry.grade}
                            onChange={e => setNewEntry({ ...newEntry, grade: e.target.value })}
                        />
                        <div className="flex space-x-2 col-span-2">
                            <div className="w-1/2">
                                <label className="text-xs text-gray-500 mb-1 block">Start Date</label>
                                <input
                                    type="date"
                                    className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-full"
                                    value={newEntry.start_date}
                                    onChange={e => setNewEntry({ ...newEntry, start_date: e.target.value })}
                                />
                            </div>
                            <div className="w-1/2">
                                <label className="text-xs text-gray-500 mb-1 block">End Date (or Expected)</label>
                                <input
                                    type="date"
                                    className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-full"
                                    value={newEntry.end_date}
                                    onChange={e => setNewEntry({ ...newEntry, end_date: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end space-x-3">
                        <button onClick={() => setShowAddForm(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                        <button onClick={handleSave} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm">Save</button>
                    </div>
                </div>
            )}

            <div className="grid gap-6">
                {education.map((edu, idx) => (
                    <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center group hover:bg-blue-50/50 transition-colors">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                                <GraduationCap size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">{edu.institution}</h3>
                                <div className="text-gray-700 font-medium">{edu.degree} in {edu.field}</div>
                                <div className="flex items-center text-sm text-gray-500 mt-1">
                                    <Calendar size={14} className="mr-1" />
                                    <span>{new Date(edu.start_date).getFullYear()} - {new Date(edu.end_date).getFullYear()}</span>
                                    {edu.grade && <span className="ml-2">• GPA: {edu.grade}</span>}
                                </div>
                            </div>
                        </div>

                        {/* Verification Badge */}
                        <div className="flex items-center space-x-2">
                            {edu.verification?.is_verified ? (
                                <span className="flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium border border-green-200">
                                    <CheckCircle size={12} className="mr-1" />
                                    Verified Credential
                                </span>
                            ) : (
                                <button className="text-xs text-blue-600 hover:underline">
                                    Request Verification
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Blockchain / Government Connection Placeholder */}
            <div className="border border-dashed border-gray-300 rounded-2xl p-6 flex flex-col items-center justify-center text-center bg-gray-50/50">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mb-3">
                    <img src="/images/khda_logo_placeholder.png" className="w-6 h-6 opacity-50" alt="" />
                </div>
                <h3 className="text-gray-900 font-medium mb-1">Connect Government Services</h3>
                <p className="text-gray-500 text-sm max-w-sm mb-4">
                    Automatically import attested degrees from KHDA or Ministry of Education via Blockchain integration.
                </p>
                <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                    Connect Account (Coming Soon)
                </button>
            </div>
        </div>
    );
};
