import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import TemplatePreview from '@/components/cv-templates/TemplatePreview';
import { Loader2, AlertCircle, FileText } from 'lucide-react';

const PublicCVViewer: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [cvData, setCvData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCV = async () => {
            try {
                const response = await fetch(`http://localhost:5005/api/cv/public/${id}`);
                const result = await response.json();

                if (result.success && result.data) {
                    // Map backend data to frontend format
                    const backendRow = result.data;
                    const mappedData = {
                        personalInfo: backendRow.personal_info || {},
                        professionalSummary: backendRow.professional_summary || '',
                        technicalSkills: backendRow.technical_skills || [],
                        softSkills: backendRow.soft_skills || [],
                        experience: backendRow.work_experience || [],
                        education: backendRow.education || []
                    };
                    setCvData({
                        data: mappedData,
                        template: backendRow.template_name || 'professional',
                        title: backendRow.title
                    });
                } else {
                    setError(result.message || 'Failed to load CV');
                }
            } catch (err) {
                setError('Network error loading CV');
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchCV();
    }, [id]);



    if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
    if (error) return <div className="flex h-screen items-center justify-center flex-col"><AlertCircle className="w-12 h-12 text-red-500 mb-4" /><p className="text-xl text-gray-800">{error}</p></div>;
    if (!cvData) return null;

    return (
        <div className="min-h-screen bg-gray-100 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{cvData.title}</h1>
                        <p className="text-gray-500 text-sm">Shared via Emirati Pathways</p>
                    </div>

                </div>

                <div id="public-cv-preview" className="shadow-2xl bg-white">
                    <TemplatePreview
                        templateId={cvData.template}
                        cvData={cvData.data}
                        className="w-full"
                    />
                </div>

                <div className="mt-8 text-center text-gray-500 text-sm">
                    <p>Powered by <span className="font-semibold text-blue-600">Emirati Pathways</span> AI CV Builder</p>
                </div>
            </div>
        </div>
    );
};

export default PublicCVViewer;
