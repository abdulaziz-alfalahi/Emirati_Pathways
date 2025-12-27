import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';
import { CheckCircle, AlertTriangle, Building, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import JobDescriptionWizard from '@/components/recruiter/job-descriptions/JobDescriptionWizard';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';

// We can't use restClient because it might look for auth tokens. 
// We use direct axios for this public public endpoint.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5005';

export const VerifyJob: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<any>(null);

    // Wizard State
    const [wizardData, setWizardData] = useState<any>(null);
    const [showPasswordDialog, setShowPasswordDialog] = useState(false);
    const [finalJdData, setFinalJdData] = useState<any>(null);

    // Form State
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        if (token) {
            checkToken();
        }
    }, [token]);

    const checkToken = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/public/verify-job/${token}`);
            if (response.data.success) {
                const apiData = response.data.data;
                setData(apiData);

                // Map API data to Wizard Format
                setWizardData({
                    basic_info: {
                        title: apiData.title || '',
                        department: apiData.department || '',
                        job_type: apiData.job_type || 'full_time',
                        job_level: apiData.job_level || 'mid',
                        emirate: apiData.emirate || '',
                        city: apiData.city || '',
                        remote_option: apiData.remote_option || false
                    },
                    description: apiData.description || '',
                    description_arabic: apiData.description_arabic || '',
                    requirements: apiData.requirements || [],
                    responsibilities: apiData.responsibilities || [],
                    benefits: apiData.benefits || [],
                    compensation: apiData.compensation || { salary_currency: 'AED' },
                    metadata: {
                        nafis_job_id: apiData.nafis_job_id
                    }
                });
            } else {
                setError('Invalid Token');
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load verification data. Link might be expired.');
        } finally {
            setLoading(false);
        }
    };

    const handleWizardComplete = (jdData: any) => {
        setFinalJdData(jdData);
        setShowPasswordDialog(true);
    };

    const handleFinalConfirm = async () => {
        if (!password || password.length < 6) {
            toast.error('Please set a password (min 6 chars) to claim your account');
            return;
        }
        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        setVerifying(true);
        try {
            const response = await axios.post(`${API_BASE_URL}/api/public/verify-job/${token}/confirm`, {
                job_data: {
                    title: finalJdData.basic_info.title,
                    description: finalJdData.description,
                    requirements: finalJdData.requirements,
                    responsibilities: finalJdData.responsibilities,
                    benefits: finalJdData.benefits,
                    compensation: finalJdData.compensation,
                    // Pass other fields as needed
                },
                password: password
            });

            if (response.data.success) {
                toast.success('Vacancy Verified & Account Created!');
                setShowPasswordDialog(false);
                // Redirect to login with a special param?
                setTimeout(() => navigate('/login?verified=true'), 2000);
            }
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Verification Failed');
        } finally {
            setVerifying(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Verifying Link...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <Card className="w-full max-w-md border-red-200">
                    <CardHeader>
                        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-2" />
                        <CardTitle className="text-center text-red-700">Link Expired or Invalid</CardTitle>
                        <CardDescription className="text-center">
                            {error}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                        <Button onClick={() => navigate('/login')}>Go to Login</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header / Banner */}
            <div className="bg-white border-b sticky top-0 z-20">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="bg-teal-100 p-2 rounded-lg">
                            <Building className="h-5 w-5 text-teal-700" />
                        </div>
                        <div>
                            <h1 className="font-bold text-lg text-slate-800">{data?.company_name}</h1>
                            <p className="text-xs text-slate-500">Nafis Vacancy Verification</p>
                        </div>
                    </div>
                    <div>
                        <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200">
                            Verified Source
                        </Badge>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8 max-w-5xl">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Complete Job Details</h2>
                    <p className="text-slate-600">
                        Please review and enrich the details for <strong>{data?.title}</strong> (ID: {data?.nafis_job_id}).
                        Once completed, you'll set a password to activate your account and view matched candidates.
                    </p>
                </div>

                {/* The Wizard Component */}
                {wizardData && (
                    <JobDescriptionWizard
                        mode="public"
                        initialData={wizardData}
                        onComplete={handleWizardComplete}
                        onCancel={() => { }} // No cancel action in public flow really
                    />
                )}
            </div>

            {/* Password Dialog */}
            <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create Your Account</DialogTitle>
                        <DialogDescription>
                            Your job post is ready! Set a password to activate your recruiter account and start viewing candidates.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" value={data?.email} disabled className="bg-slate-100" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Min 6 characters"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirm">Confirm Password</Label>
                            <Input
                                id="confirm"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>Back</Button>
                        <Button onClick={handleFinalConfirm} disabled={verifying} className="bg-teal-600 hover:bg-teal-700">
                            {verifying ? 'Activating...' : 'Activate & View Candidates'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
