import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { restClient } from '@/utils/api';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, FileText, CheckCircle2 } from 'lucide-react';

interface RoleRequestDialogProps {
    isOpen: boolean;
    onClose: () => void;
    role: string;
    onRequestSubmitted: () => void;
}

const roleDescriptions: Record<string, string> = {
    'Educator': 'Educators manage curriculum and student progress. Verification of employment with an educational institution is required.',
    'Assessor': 'Assessors evaluate candidate skills and certifications. You must hold valid assessor credentials.',
    'HR/Recruiter': 'Recruiters post jobs and manage applications. A valid company trade license or authorization is needed.',
    'Mentor': 'Mentors provide guidance to job seekers. Proven expertise in your field is expected.',
    'Growth Operator': 'Growth Operators manage program scaling and approvals.'
};

const reasonCategories = [
    "New Employment / Job Change",
    "Professional Development",
    "Authorized Company Representative",
    "Certified Trainer / Assessor",
    "Other"
];

export const RoleRequestDialog: React.FC<RoleRequestDialogProps> = ({
    isOpen,
    onClose,
    role,
    onRequestSubmitted
}) => {
    const [reasonCategory, setReasonCategory] = useState('');
    const [notes, setNotes] = useState('');
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadedFile, setUploadedFile] = useState<string | null>(null);
    const { toast } = useToast();

    // Reset state when dialog opens/closes
    React.useEffect(() => {
        if (!isOpen) {
            setReasonCategory('');
            setNotes('');
            setAgreedToTerms(false);
            setUploadedFile(null);
        }
    }, [isOpen]);

    const handleFileUpload = () => {
        // Simulate file upload
        setUploadedFile("Credential_Document.pdf");
        toast({
            title: "File Attached",
            description: "Document attached successfully (Simulation).",
        });
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            // Combine structured data into notes for backend compatibility
            const structuredNotes = `
Category: ${reasonCategory}
Justification: ${notes}
Attached Document: ${uploadedFile || 'None'}
Agreed to Terms: Yes
            `.trim();

            await restClient.post('/api/roles/request', {
                role,
                notes: structuredNotes,
                documents: uploadedFile ? { 'credential': uploadedFile } : {}
            });

            toast({
                title: "Request Submitted",
                description: `Your request for ${role} access has been sent for approval.`,
                variant: "default",
            });

            onRequestSubmitted();
            onClose();
        } catch (error: any) {
            console.error('Role request failed', error);
            toast({
                title: "Submission Failed",
                description: error.response?.data?.message || "Could not submit request.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Request {role} Access</DialogTitle>
                    <DialogDescription>
                        {roleDescriptions[role] || `You need authorization to access the ${role} workspace.`}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* Reason Category */}
                    <div className="space-y-2">
                        <Label>Reason for Request</Label>
                        <Select value={reasonCategory} onValueChange={setReasonCategory}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a reason..." />
                            </SelectTrigger>
                            <SelectContent>
                                {reasonCategories.map((cat) => (
                                    <SelectItem key={cat} value={cat}>
                                        {cat}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Justification Text */}
                    <div className="space-y-2">
                        <Label>Additional Details (Optional)</Label>
                        <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Provide any extra context..."
                            className="min-h-[80px]"
                        />
                    </div>

                    {/* File Upload Placeholder */}
                    <div className="space-y-2">
                        <Label>Supporting Documentation</Label>
                        <div className="flex items-center gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleFileUpload}
                                className="w-full border-dashed"
                            >
                                {uploadedFile ? (
                                    <>
                                        <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                                        {uploadedFile}
                                    </>
                                ) : (
                                    <>
                                        <Upload className="mr-2 h-4 w-4" />
                                        Upload Credentials / License
                                    </>
                                )}
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Upload relevant proof for your role (e.g., Trade License, Degree).
                        </p>
                    </div>

                    {/* Terms Checkbox */}
                    <div className="flex items-center space-x-2 pt-2">
                        <Checkbox
                            id="terms"
                            checked={agreedToTerms}
                            onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                        />
                        <Label
                            htmlFor="terms"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            I verify that the provided information is accurate and I am authorized for this role.
                        </Label>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || !reasonCategory || !agreedToTerms}
                        className="bg-teal-600 hover:bg-teal-700"
                    >
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit Request
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
