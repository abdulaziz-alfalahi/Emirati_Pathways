
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    Upload,
    FileText,
    CheckCircle,
    AlertTriangle,
    FileUp,
    Users,
    Info,
    Download
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { jobApi } from '@/utils/api';

interface VacancySetupProps {
    jdId: string;
    initialData?: any;
}

export const VacancySetup: React.FC<VacancySetupProps> = ({ jdId, initialData }) => {
    const { toast } = useToast();
    const [isUploading, setIsUploading] = useState(false);
    const [activeUploadType, setActiveUploadType] = useState<'jd' | 'batch' | null>(null);

    // Mock Data (Replace with real data fetch via jdId)
    // Use real data from initialData, falling back to safe defaults
    const [vacancyData, setVacancyData] = useState({
        title: initialData?.title || initialData?.job_title || "Untitled Vacancy",
        completeness: initialData?.completeness || 0,
        missingFields: initialData?.missing_fields || [],
        jdFile: initialData?.original_filename || initialData?.filename || null,
        batchFiles: [],
        lastUpdated: initialData?.created_at ? new Date(initialData.created_at).toLocaleDateString() : "Just now"
    });

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'jd' | 'batch') => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setIsUploading(true);
        setActiveUploadType(type);

        // Simulate upload delay
        setTimeout(() => {
            setIsUploading(false);
            setActiveUploadType(null);
            toast({
                title: type === 'jd' ? "JD Updated" : "Batch Uploaded",
                description: type === 'jd'
                    ? "Job Description re-parsed successfully."
                    : `${files.length} candidate files uploaded to sourcing pool.`
            });
        }, 2000);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* LEFT COLUMN: Actions */}
            <div className="lg:col-span-2 space-y-6">

                {/* 1. Job Description File */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                            <span>Job Description Document</span>
                            {vacancyData.jdFile && <Badge variant="secondary" className="bg-green-100 text-green-800">Uploaded</Badge>}
                        </CardTitle>
                        <CardDescription>
                            The core requirements and details for this vacancy.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center p-4 border rounded-lg bg-slate-50">
                            <FileText className="h-8 w-8 text-blue-500 mr-4" />
                            <div className="flex-1">
                                <p className="font-medium text-sm">{vacancyData.jdFile || "No JD Uploaded"}</p>
                                <p className="text-xs text-gray-500">Last updated: {vacancyData.lastUpdated}</p>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => {
                                    toast({ title: "Downloading JD...", description: "Feature mocked." });
                                }}>
                                    <Download className="h-4 w-4" />
                                </Button>
                                <div className="relative w-24 h-9">
                                    <input
                                        type="file"
                                        className="absolute inset-0 opacity-0 cursor-pointer z-50 w-full h-full"
                                        onChange={(e) => handleFileUpload(e, 'jd')}
                                        accept=".pdf,.docx"
                                    />
                                    <Button variant="outline" size="sm" className="w-full absolute inset-0 pointer-events-none">
                                        {isUploading && activeUploadType === 'jd' ? "Parsing..." : "Re-upload"}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Parsed Content Preview (Collapsed by default?) */}
                        <div className="mt-4">
                            <h4 className="text-sm font-medium mb-2">Parsed Skills Detected:</h4>
                            <div className="flex flex-wrap gap-2">
                                {(initialData?.skills_required || []).map((skill: string) => (
                                    <Badge key={skill} variant="outline" className="bg-white">{skill}</Badge>
                                ))}
                                {(!initialData?.skills_required || initialData.skills_required.length === 0) && (
                                    <span className="text-xs text-gray-400 italic">No skills detected yet. Upload a JD to extract skills.</span>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Batch Candidate Upload */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-indigo-500" />
                            Batch Candidate Upload
                        </CardTitle>
                        <CardDescription>
                            Upload a batch of CVs (PDF/Word) to immediately populate the sourcing pool for this vacancy.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div
                            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors relative ${isUploading && activeUploadType === 'batch' ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'}`}
                            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                            onDrop={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                                    // Create a synthetic event to reuse handleFileUpload logic
                                    const syntheticEvent = { target: { files: e.dataTransfer.files } } as unknown as React.ChangeEvent<HTMLInputElement>;
                                    handleFileUpload(syntheticEvent, 'batch');
                                }
                            }}
                        >
                            <div className="flex flex-col items-center justify-center">
                                <FileUp className={`h-10 w-10 mb-4 ${isUploading ? 'animate-bounce text-indigo-500' : 'text-gray-400'}`} />
                                <h3 className="text-sm font-medium text-gray-900">
                                    {isUploading && activeUploadType === 'batch' ? "Processing Batch..." : "Drag and drop CVs here"}
                                </h3>
                                <p className="text-xs text-gray-500 mt-1 mb-4">or click to browse (Max 50 files)</p>
                                <div className="relative z-10 w-32 mx-auto">
                                    <input
                                        type="file"
                                        multiple
                                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-50"
                                        onChange={(e) => handleFileUpload(e, 'batch')}
                                        accept=".pdf,.docx"
                                    />
                                    <Button disabled={isUploading} className="pointer-events-none w-full">
                                        Select Files
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <Alert className="mt-4 bg-blue-50 border-blue-100">
                            <Info className="h-4 w-4 text-blue-600" />
                            <AlertTitle className="text-blue-800">Pro Tip</AlertTitle>
                            <AlertDescription className="text-blue-700">
                                The AI will automatically rank these candidates against the JD criteria in the "Sourcing" tab.
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                </Card>
            </div>

            {/* RIGHT COLUMN: AI Analysis */}
            <div className="space-y-6">
                <Card className="bg-slate-50 border-slate-200">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium uppercase tracking-wide text-gray-500">
                            AI Gap Analysis
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">

                        {/* Completeness Score */}
                        <div className="text-center p-4 bg-white rounded-xl shadow-sm border">
                            <div className="relative inline-flex items-center justify-center">
                                <svg className="w-24 h-24">
                                    <circle cx="48" cy="48" r="40" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                                    <circle cx="48" cy="48" r="40" fill="none" stroke="#3b82f6" strokeWidth="8"
                                        strokeDasharray="251.2"
                                        strokeDashoffset={251.2 * (1 - vacancyData.completeness / 100)}
                                        className="transition-all duration-1000 ease-out transform -rotate-90 origin-center"
                                    />
                                </svg>
                                <span className="absolute text-2xl font-bold text-gray-800">{vacancyData.completeness}%</span>
                            </div>
                            <p className="mt-2 text-sm font-medium text-gray-600">Completeness Score</p>
                        </div>

                        {/* Missing Fields */}
                        <div>
                            <h4 className="flex items-center gap-2 font-medium mb-3 text-amber-700">
                                <AlertTriangle className="h-4 w-4" />
                                Missing Critical Info
                            </h4>
                            <div className="space-y-2">
                                {vacancyData.missingFields.map((field, i) => (
                                    <div key={i} className="flex items-center gap-2 text-sm bg-amber-50 text-amber-800 p-2 rounded">
                                        <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                        {field}
                                    </div>
                                ))}
                            </div>
                            <Button variant="link" className="text-blue-600 px-0 mt-2 text-xs">
                                Use AI to Auto-fill Gaps
                            </Button>
                        </div>

                        {/* Market Insights (Enhancement) */}
                        <div className="border-t pt-4">
                            <h4 className="font-medium mb-3 text-gray-700">Market Pulse</h4>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Avg. Salary</span>
                                    <span className="font-medium">AED 25,000</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Talent Pool</span>
                                    <span className="font-medium text-green-600">45 Candidates</span>
                                </div>
                                <Progress value={75} className="h-1.5 bg-gray-200" />
                                <p className="text-xs text-gray-400">High availability for this role</p>
                            </div>
                        </div>

                    </CardContent>
                </Card>
            </div>

        </div>
    );
};
