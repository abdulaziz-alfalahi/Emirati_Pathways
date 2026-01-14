import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, Briefcase, GraduationCap, Users, UserPlus, Loader2 } from 'lucide-react';
import { restClient } from '@/utils/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { messagingService } from '@/services/messagingService';

interface NewConversationDialogProps {
    open: boolean;
    onClose: () => void;
    onConversationCreated?: (conversation: any) => void;
}

interface Candidate {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    location?: string;
    current_position?: string;
    experience_years?: number;
    education_level?: string;
    preferred_location?: string;
    skills?: string[];
}

const NewConversationDialog: React.FC<NewConversationDialogProps> = ({ open, onClose, onConversationCreated }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [searched, setSearched] = useState(false);
    const [creatingId, setCreatingId] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        try {
            setLoading(true);
            setSearched(true);

            // Simple search params
            const params = new URLSearchParams();
            params.append('search', searchQuery);

            // Use the same endpoint as SourceCandidatesDialog
            const response = await restClient.get(`/api/hr/candidates/search?${params.toString()}`);

            if (response.data && response.data.success && response.data.data && response.data.data.candidates) {
                setCandidates(response.data.data.candidates);
            } else if (response.data && response.data.candidates) {
                setCandidates(response.data.candidates);
            } else {
                setCandidates([]);
            }
        } catch (error: any) {
            console.error('Error searching candidates:', error);
            setCandidates([]);
            toast.error('Failed to search. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleStartConversation = async (candidate: Candidate) => {
        try {
            setCreatingId(candidate.id);

            // Create conversation
            const response = await messagingService.createConversation({
                participants: [candidate.id],
                title: `${candidate.first_name} ${candidate.last_name}`,
            });

            if (response.success && response.data) {
                toast.success(`Conversation started with ${candidate.first_name}`);
                if (onConversationCreated) {
                    onConversationCreated(response.data);
                } else {
                    // If no callback, we assume we might need to navigate or just close.
                    // But since we are on the messages page, we might want to just select it.
                    onClose();
                }
            } else {
                toast.error(response.error || 'Failed to start conversation');
            }
        } catch (error: any) {
            console.error('Error creating conversation:', error);
            toast.error('Failed to start conversation');
        } finally {
            setCreatingId(null);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5" />
                        New Conversation
                    </DialogTitle>
                    <DialogDescription>
                        Search for a person to start a chat with
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto py-4 space-y-4 px-1">
                    {/* Search Box */}
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search by name or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                className="pl-9"
                            />
                        </div>
                        <Button onClick={handleSearch} disabled={loading || !searchQuery.trim()}>
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Search'}
                        </Button>
                    </div>

                    {/* Results */}
                    <div className="space-y-2">
                        {searched && candidates.length === 0 && !loading && (
                            <div className="text-center py-8 text-gray-500">
                                <Users className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                <p>No results found</p>
                            </div>
                        )}

                        {candidates.map((candidate) => (
                            <div
                                key={candidate.id}
                                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex flex-col">
                                    <span className="font-medium">{candidate.first_name} {candidate.last_name}</span>
                                    <span className="text-xs text-gray-500">{candidate.current_position || 'Candidate'}</span>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={() => handleStartConversation(candidate)}
                                    disabled={creatingId === candidate.id}
                                >
                                    {creatingId === candidate.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <MessageSquare className="h-4 w-4 mr-1" />
                                    )}
                                    Chat
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default NewConversationDialog;
