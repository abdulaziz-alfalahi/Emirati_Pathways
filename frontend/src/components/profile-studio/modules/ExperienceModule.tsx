import React, { useEffect, useState } from 'react';
import { profileService, ExperienceEntry } from '@/services/profile/profileService';
import { Briefcase, Calendar, MapPin, Plus, Trash2 } from 'lucide-react';

export const ExperienceModule = () => {
    const [experiences, setExperiences] = useState<ExperienceEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);

    // New Entry Form State
    const [newEntry, setNewEntry] = useState<ExperienceEntry>({
        job_title: '',
        company: '',
        location: '',
        start_date: '',
        is_current: false,
        description: ''
    });

    useEffect(() => {
        loadExperience();
    }, []);

    const loadExperience = async () => {
        try {
            const res = await profileService.getProfile();
            if (res.success && res.data.experience) {
                // sort by start_date desc
                const sorted = res.data.experience.sort((a: any, b: any) =>
                    new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
                );
                setExperiences(sorted);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            await profileService.addExperience(newEntry);
            setShowAddForm(false);
            setNewEntry({
                job_title: '',
                company: '',
                location: '',
                start_date: '',
                is_current: false,
                description: ''
            });
            loadExperience();
        } catch (e) {
            alert('Failed to save experience');
        }
    };

    if (loading) return <div className="p-8">Loading experience...</div>;

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Work Experience</h2>
                    <p className="text-gray-500">Showcase your professional journey.</p>
                </div>
                <button
                    onClick={() => setShowAddForm(true)}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors shadow-md"
                >
                    <Plus size={18} />
                    <span>Add Experience</span>
                </button>
            </div>

            {showAddForm && (
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-blue-100 animate-slide-down">
                    <h3 className="font-bold text-lg mb-4">Add New Role</h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <input
                            placeholder="Job Title"
                            className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={newEntry.job_title}
                            onChange={e => setNewEntry({ ...newEntry, job_title: e.target.value })}
                        />
                        <input
                            placeholder="Company"
                            className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={newEntry.company}
                            onChange={e => setNewEntry({ ...newEntry, company: e.target.value })}
                        />
                        <input
                            placeholder="Location"
                            className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={newEntry.location}
                            onChange={e => setNewEntry({ ...newEntry, location: e.target.value })}
                        />
                        <div className="flex space-x-2">
                            <input
                                type="date"
                                className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-full"
                                value={newEntry.start_date}
                                onChange={e => setNewEntry({ ...newEntry, start_date: e.target.value })}
                            />
                            {!newEntry.is_current && (
                                <input
                                    type="date"
                                    className="p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-full"
                                    value={newEntry.end_date || ''}
                                    onChange={e => setNewEntry({ ...newEntry, end_date: e.target.value })}
                                />
                            )}
                        </div>
                    </div>

                    <div className="flex items-center mb-4">
                        <input
                            type="checkbox"
                            id="current"
                            checked={newEntry.is_current}
                            onChange={e => setNewEntry({ ...newEntry, is_current: e.target.checked })}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="current" className="ml-2 text-gray-700">I currently work here</label>
                    </div>

                    <textarea
                        placeholder="Describe your responsibilities and achievements..."
                        className="w-full p-3 border rounded-lg h-32 mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
                        value={newEntry.description}
                        onChange={e => setNewEntry({ ...newEntry, description: e.target.value })}
                    />

                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={() => setShowAddForm(false)}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm"
                        >
                            Save Position
                        </button>
                    </div>
                </div>
            )}

            {/* Timeline View */}
            <div className="relative border-l-2 border-gray-200 ml-3 space-y-8 pl-8 py-2">
                {experiences.length === 0 && !showAddForm && (
                    <p className="text-gray-500 italic">No experience added yet.</p>
                )}

                {experiences.map((exp, idx) => (
                    <div key={idx} className="relative bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
                        {/* Timeline Dot */}
                        <div className="absolute -left-[41px] top-6 w-5 h-5 rounded-full border-4 border-white bg-blue-500 shadow-sm"></div>

                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">{exp.job_title}</h3>
                                <div className="text-blue-600 font-medium mb-1">{exp.company}</div>
                                <div className="flex items-center text-sm text-gray-500 space-x-4 mb-3">
                                    <div className="flex items-center">
                                        <Calendar size={14} className="mr-1" />
                                        <span>
                                            {new Date(exp.start_date).getFullYear()} -
                                            {exp.is_current ? ' Present' : ` ${new Date(exp.end_date!).getFullYear()}`}
                                        </span>
                                    </div>
                                    <div className="flex items-center">
                                        <MapPin size={14} className="mr-1" />
                                        <span>{exp.location}</span>
                                    </div>
                                </div>
                                <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                                    {exp.description}
                                </p>
                            </div>
                            <button className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
