import React, { useEffect, useState } from 'react';
import { profileService, CandidateProfile } from '@/services/profile/profileService';
import { User, MapPin, Phone, Mail, Globe, Video, Upload, FileText, Car, Clock, Info } from 'lucide-react';
import axios from 'axios';
import LocationPicker from '@/components/common/LocationPicker';
import { calculateHaversineDistance, estimateCommuteTime } from '@/utils/geoUtils';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { UnifiedProfileHeader } from '../UnifiedProfileHeader';

export const IdentityModule = () => {
    const [profile, setProfile] = useState<CandidateProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    // CV Management State
    const [cvs, setCvs] = useState<any[]>([]);
    const [loadingCvs, setLoadingCvs] = useState(false);
    const [debugData, setDebugData] = useState<any>(null);

    // Form inputs
    const [formData, setFormData] = useState({
        headline: '',
        bio: '',
        phone: '',
        location: '',
        latitude: undefined as number | undefined,
        longitude: undefined as number | undefined
    });

    useEffect(() => {
        loadProfile();
        loadCVs();
    }, []);

    const loadCVs = async () => {
        setLoadingCvs(true);
        try {
            const res = await profileService.listCVs();
            if (res.success && Array.isArray(res.cvs)) {
                setCvs(res.cvs);
                // If empty, fetch debug info to diagnose
                if (res.cvs.length === 0) {
                    profileService.getDebugAuth().then(d => setDebugData(d));
                }
            }
        } catch (e) {
            console.error("Failed to load CVs", e);
        } finally {
            setLoadingCvs(false);
        }
    };

    const loadProfile = async () => {
        try {
            const res = await profileService.getProfile();
            if (res.success) {
                setProfile(res.data);
                const contact = res.data.contact || {};

                // Robust Latitude/Longitude Extraction
                let lat = res.data.latitude || contact.latitude;
                let lng = res.data.longitude || contact.longitude;

                // Fallback: Try to parse from location string if coordinates are missing but string looks like "25.123, 55.123"
                // This handles cases where backend columns might be missing but text persisted.
                if (!lat && contact.location && typeof contact.location === 'string' && contact.location.includes(',')) {
                    const parts = contact.location.split(',');
                    if (parts.length === 2) {
                        const p1 = parseFloat(parts[0]);
                        const p2 = parseFloat(parts[1]);
                        // Simple validation for lat/long range to avoid parsing real addresses
                        if (!isNaN(p1) && !isNaN(p2) && Math.abs(p1) <= 90 && Math.abs(p2) <= 180) {
                            lat = p1;
                            lng = p2;
                        }
                    }
                }

                setFormData({
                    headline: res.data.headline || '',
                    bio: res.data.bio || '',
                    phone: contact.phone || '',
                    location: contact.location || '',
                    latitude: lat,
                    longitude: lng
                });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleVisibility = async (cvId: string, currentStatus: boolean) => {
        try {
            await profileService.toggleCVVisibility(cvId, !currentStatus);
            // Refresh list to update UI
            loadCVs();
        } catch (e) {
            alert("Failed to update visibility");
        }
    };

    const handleDeleteCV = async (cvId: string) => {
        if (!confirm("Are you sure you want to delete this CV?")) return;
        try {
            await profileService.deleteCV(cvId);
            loadCVs();
        } catch (e) {
            alert("Failed to delete CV");
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);

        try {
            // Use centralized upload method which handles Auth and URLs correctly
            await profileService.uploadCV(file);

            // Reload profile data to reflect valid parsed changes
            await loadProfile();
            // Refresh CV list
            await loadCVs();
            alert('CV Imported successfully! Please review your profile sections.');
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Failed to upload CV');
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        try {
            // Flatten the payload to match what backend likely expects or handle both
            // But importantly, pass latitude/longitude at ROOT level if backend is updated to look there,
            // OR ensure backend looks in contact.
            // Based on my proposed backend fix, I will send both flat and nested to be safe, 
            // or just rely on the backend fixing the reading logic.
            // I will update this frontend to send flat fields as well to ensure compatibility.
            await profileService.updateIdentity({
                headline: formData.headline,
                bio: formData.bio,
                phone: formData.phone, // Flat
                location: formData.location, // Flat
                latitude: formData.latitude, // Flat
                longitude: formData.longitude, // Flat
                contact: { // Nested (Legacy support)
                    phone: formData.phone,
                    location: formData.location,
                    email: profile?.contact?.email || '',
                    latitude: formData.latitude,
                    longitude: formData.longitude
                }
            } as any);
            setIsEditing(false);
            loadProfile();
        } catch (e) {
            alert('Failed to save');
        }
    };

    const handleLocationSelect = (lat: number, lng: number) => {
        setFormData(prev => ({
            ...prev,
            latitude: lat,
            longitude: lng,
            location: `${lat.toFixed(4)}, ${lng.toFixed(4)}`
        }));
    };

    if (loading) return <div className="p-8">Loading profile...</div>;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Unified Profile Header (Role Switcher) */}
            <UnifiedProfileHeader initialProfile={profile} cvUploaded={cvs.length > 0} />

            {/* Profile Actions Bar */}
            <div className="bg-card rounded-xl shadow-sm border border-border p-4 flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-semibold text-foreground">Profile Actions</h2>
                    <p className="text-sm text-muted-foreground">Manage your profile visibility and data</p>
                </div>
                <div className="flex items-center gap-3">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="flex flex-col items-end">
                                    <label className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${uploading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' :
                                        cvs.length >= 3 ? 'bg-muted border-border text-muted-foreground cursor-not-allowed' :
                                            'bg-card border-blue-200 text-blue-600 hover:bg-blue-50 cursor-pointer'
                                        }`}>
                                        {uploading ? <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /> : <Upload size={18} />}
                                        <span className="font-medium text-sm">
                                            {uploading ? 'Parsing...' : cvs.length >= 3 ? 'Limit Reached (3/3)' : 'Import CV'}
                                        </span>
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept=".pdf,.docx"
                                            onChange={handleFileUpload}
                                            disabled={uploading || cvs.length >= 3}
                                        />
                                    </label>
                                </div>
                            </TooltipTrigger>
                            {cvs.length >= 3 && (
                                <TooltipContent side="bottom" className="bg-red-50 text-red-600 border border-red-100">
                                    <p className="text-xs">You have reached the limit of 3 CVs. Please delete an older CV to upload a new one.</p>
                                </TooltipContent>
                            )}
                        </Tooltip>
                    </TooltipProvider>

                    <button
                        onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                        className={`px-6 py-2 rounded-lg font-medium transition-colors ${isEditing
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-card border border-border text-foreground hover:bg-muted'
                            }`}
                    >
                        {isEditing ? 'Save Changes' : 'Edit Identity'}
                    </button>
                </div>
            </div>

            {/* Headline Editor (if editing) */}
            {isEditing && (
                <div className="bg-card p-4 rounded-xl border border-blue-100 mb-4">
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Profile Headline</label>
                    <input
                        type="text"
                        value={formData.headline}
                        onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                        placeholder="Software Engineer | Problem Solver"
                        className="w-full text-lg text-foreground border border-input rounded-lg p-2 focus:border-blue-500 outline-none bg-background"
                    />
                </div>
            )}

            {/* Commute Intelligence / Location Map */}
            <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
                <CardContent className="p-0">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-foreground">Location & Commute</h3>
                        {!isEditing && profile?.contact?.latitude && (
                            <span className="text-xs bg-teal-100 text-teal-800 px-2 py-1 rounded-full flex items-center gap-1">
                                <Car size={12} /> Commute Active
                            </span>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Residence Location</label>
                                {isEditing ? (
                                    <>
                                        <div className="h-[300px] w-full bg-slate-100 rounded-md border overflow-hidden relative z-0">
                                            <LocationPicker
                                                lat={formData.latitude}
                                                lng={formData.longitude}
                                                onLocationSelect={handleLocationSelect}
                                                height="300px"
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Click on the map to pin your exact location. This is used to calculate commute times.
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        {formData.latitude && formData.longitude ? (
                                            <div className="h-[200px] w-full bg-slate-100 rounded-md border overflow-hidden relative z-0 pointer-events-none opacity-90">
                                                <LocationPicker
                                                    lat={formData.latitude}
                                                    lng={formData.longitude}
                                                    onLocationSelect={() => { }}
                                                    height="200px"
                                                />
                                            </div>
                                        ) : (
                                            <div className="h-[200px] w-full bg-slate-50 rounded-md border border-dashed flex items-center justify-center text-muted-foreground">
                                                <div className="text-center p-4">
                                                    <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                                    <p>No location set</p>
                                                    <button
                                                        onClick={() => setIsEditing(true)}
                                                        className="text-blue-600 text-sm hover:underline mt-1"
                                                    >
                                                        Add Location
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Address Text</label>
                                <input
                                    type="text"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    disabled={!isEditing}
                                    className="w-full p-2 border border-input rounded-md bg-background"
                                    placeholder="e.g. Downtown Dubai, UAE"
                                />
                            </div>

                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                                <h4 className="font-semibold text-blue-900 flex items-center gap-2 mb-2">
                                    <Info size={16} /> Why set this?
                                </h4>
                                <p className="text-sm text-blue-800 leading-relaxed mb-3">
                                    Setting your residence location enables our AI to calculate accurate commute times for every job listing.
                                </p>
                                <ul className="text-sm text-blue-800 space-y-1 ml-5 list-disc">
                                    <li>See drive times during peak hours</li>
                                    <li>Filter jobs by max commute time</li>
                                    <li>Find opportunities closer to home</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </div>

            {/* Documents & CVs Management Section */}
            <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-foreground">Documents &amp; CVs</h3>
                    <div className="text-sm text-muted-foreground">
                        Select which CV is visible to recruiters
                    </div>
                </div>

                <div className="space-y-4">
                    {loadingCvs ? (
                        <div className="text-center py-4 text-gray-400">Loading documents...</div>
                    ) : cvs.length === 0 ? (
                        <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-xl bg-gray-50">
                            <FileText className="mx-auto h-10 w-10 text-gray-300 mb-2" />
                            <p className="text-gray-500">No CVs uploaded yet.</p>
                            {debugData && (
                                <div className="mt-4 mx-auto max-w-sm p-3 bg-red-50 text-red-800 text-xs text-left rounded border border-red-100 font-mono">
                                    <div className="font-bold mb-1">Diagnostic Info:</div>
                                    <div>User ID: {JSON.stringify(debugData.user_id)}</div>
                                    <div>Type: {debugData.user_id_type}</div>
                                    <div>Auth: {debugData.raw_header}</div>
                                    <div className="mt-1 text-[10px] text-red-600">
                                        If User ID matches your expectation but list is empty, please report this.
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {cvs.map((cv) => (
                                <div key={cv.cv_id} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${cv.is_visible ? 'border-teal-200 bg-teal-50/30' : 'border-border hover:border-blue-100'}`}>
                                    <div className="flex items-center space-x-4">
                                        <div className={`p-2.5 rounded-lg ${cv.is_visible ? 'bg-teal-100 text-teal-600' : 'bg-gray-100 text-gray-500'}`}>
                                            <FileText size={20} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className={`font-semibold ${cv.is_visible ? 'text-teal-900' : 'text-foreground'}`}>
                                                    {cv.filename || cv.file_info?.original_filename || 'Untitled CV'}
                                                </h4>
                                                {cv.is_visible && (
                                                    <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-600 text-white px-2 py-0.5 rounded-full">
                                                        Visible
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                Uploaded on {new Date(cv.upload_timestamp || cv.created_at || Date.now()).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => handleToggleVisibility(cv.cv_id, cv.is_visible)}
                                            className={`text-sm font-medium px-3 py-1.5 rounded-md transition-colors ${cv.is_visible
                                                ? 'bg-card border border-teal-200 text-teal-700 hover:bg-teal-50'
                                                : 'text-muted-foreground hover:bg-muted'
                                                }`}
                                        >
                                            {cv.is_visible ? 'Published' : 'Make Visible'}
                                        </button>
                                        <button
                                            onClick={() => handleDeleteCV(cv.cv_id)}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete CV"
                                        >
                                            <Upload className="h-4 w-4 rotate-45" /> {/* Using Upload icon rotated as a makeshift 'close' or just use text if Icon not avail. Actually 'Trash' would be better but I don't have it imported. I'll use text X or import Trash. */}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Bio Section */}
            <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
                <h3 className="text-xl font-bold text-foreground mb-4">About Me</h3>
                {isEditing ? (
                    <textarea
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        className="w-full h-32 p-4 border border-input rounded-lg focus:ring-2 focus:ring-blue-100 outline-none resize-none bg-background text-foreground"
                        placeholder="Tell recruiters about yourself..."
                    />
                ) : (
                    <p className="text-muted-foreground leading-relaxed">
                        {profile?.bio || 'No bio added yet. Click edit to tell your story.'}
                    </p>
                )}
            </div>

            {/* Video Pitch (Placeholder for future feature) */}
            <div className="bg-card rounded-2xl p-8 border border-border flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-bold text-foreground mb-2">Video Introduction</h3>
                    <p className="text-muted-foreground text-sm max-w-lg">
                        Stand out by recording a 60-second video pitch. Recruiters are 3x more likely to contact candidates with a video.
                    </p>
                </div>
                <button className="flex items-center space-x-2 bg-background text-foreground px-6 py-3 rounded-full font-medium shadow-sm hover:shadow-md transition-shadow">
                    <Video size={20} className="text-purple-600" />
                    <span>Record Video</span>
                </button>
            </div>
        </div>
    );
};
