import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users, MessageSquare, Loader2, UserPlus } from 'lucide-react';
import { restClient } from '@/utils/api';
import { getDisplayName } from '@/utils/nameUtils';

interface TeamMember {
    id: string;
    user_id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
}

interface CandidateDiscussionModalProps {
    isOpen: boolean;
    onClose: () => void;
    candidateId: string;
    candidateName: string;
    jobId: string;
    jobTitle: string;
    companyId?: string;
    onDiscussionCreated?: (conversationId: string) => void;
}

export function CandidateDiscussionModal({
    isOpen,
    onClose,
    candidateId,
    candidateName,
    jobId,
    jobTitle,
    companyId,
    onDiscussionCreated
}: CandidateDiscussionModalProps) {
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    const [initialMessage, setInitialMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch team members when modal opens
    useEffect(() => {
        if (isOpen && companyId) {
            fetchTeamMembers();
        }
    }, [isOpen, companyId]);

    const fetchTeamMembers = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await restClient.get(`/api/company/team/members?company_id=${companyId}`);
            if (response.data?.success && response.data.members) {
                // Map the response to our TeamMember interface
                const members = response.data.members.map((m: any) => ({
                    id: m.id || m.user_id,
                    user_id: m.user_id || m.id,
                    name: getDisplayName(m, m.email),
                    email: m.email,
                    role: m.role || 'recruiter'
                }));
                setTeamMembers(members);
            }
        } catch (err: any) {
            console.error('Failed to fetch team members:', err);
            // If team API fails, show manual entry or empty state
            setError('Unable to load team members. You can still start a discussion.');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleMember = (memberId: string) => {
        setSelectedMembers(prev =>
            prev.includes(memberId)
                ? prev.filter(id => id !== memberId)
                : [...prev, memberId]
        );
    };

    const handleCreateDiscussion = async () => {
        setIsCreating(true);
        setError(null);

        try {
            // Create the discussion thread
            const response = await restClient.post('/api/communication/candidate-discussion', {
                candidate_id: candidateId,
                job_id: jobId,
                participant_ids: selectedMembers,
                candidate_name: candidateName,
                job_title: jobTitle
            });

            if (response.data?.success) {
                const conversationId = response.data.conversation_id;

                // If there's an initial message, send it
                if (initialMessage.trim()) {
                    await restClient.post('/api/communication/messages', {
                        conversation_id: conversationId,
                        content: initialMessage,
                        message_type: 'text'
                    });
                }

                // Notify parent and close
                onDiscussionCreated?.(conversationId);
                onClose();

                // Show success message
                alert(response.data.is_new
                    ? 'Discussion thread created! Check your Messages to continue the conversation.'
                    : 'Colleagues added to existing discussion. Check your Messages.'
                );
            } else {
                setError(response.data?.error || 'Failed to create discussion');
            }
        } catch (err: any) {
            console.error('Failed to create discussion:', err);
            setError(err.response?.data?.error || 'Failed to create discussion thread');
        } finally {
            setIsCreating(false);
        }
    };

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-teal-600" />
                        Start Team Discussion
                    </DialogTitle>
                    <DialogDescription>
                        Share <strong>{candidateName}</strong> with your team for <strong>{jobTitle}</strong>.
                        All selected members can view and discuss this candidate.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Team Members Selection */}
                    <div>
                        <label className="text-sm font-medium mb-2 block">
                            Select Team Members
                        </label>

                        {isLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : teamMembers.length > 0 ? (
                            <ScrollArea className="h-[200px] border rounded-lg p-2">
                                <div className="space-y-2">
                                    {teamMembers.map((member) => (
                                        <div
                                            key={member.user_id}
                                            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${selectedMembers.includes(member.user_id)
                                                    ? 'bg-teal-50 border border-teal-200'
                                                    : 'hover:bg-gray-50'
                                                }`}
                                            onClick={() => toggleMember(member.user_id)}
                                        >
                                            <Checkbox
                                                checked={selectedMembers.includes(member.user_id)}
                                                onCheckedChange={() => toggleMember(member.user_id)}
                                            />
                                            <Avatar className="h-8 w-8">
                                                <AvatarFallback className="bg-teal-100 text-teal-700 text-xs">
                                                    {getInitials(member.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{member.name}</p>
                                                <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                                            </div>
                                            <Badge variant="outline" className="text-xs capitalize">
                                                {member.role}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground border rounded-lg">
                                <UserPlus className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No team members found.</p>
                                <p className="text-xs">Invite colleagues to your company first.</p>
                            </div>
                        )}
                    </div>

                    {/* Initial Message */}
                    <div>
                        <label className="text-sm font-medium mb-2 block">
                            Add a note (optional)
                        </label>
                        <Textarea
                            placeholder="Share your initial thoughts about this candidate..."
                            value={initialMessage}
                            onChange={(e) => setInitialMessage(e.target.value)}
                            rows={3}
                        />
                    </div>

                    {/* Selected Count */}
                    {selectedMembers.length > 0 && (
                        <div className="flex items-center gap-2 text-sm text-teal-600">
                            <MessageSquare className="h-4 w-4" />
                            <span>{selectedMembers.length} member{selectedMembers.length > 1 ? 's' : ''} will be added to the discussion</span>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="text-sm text-red-500 bg-red-50 p-2 rounded">
                            {error}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isCreating}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleCreateDiscussion}
                        disabled={isCreating}
                        className="bg-teal-600 hover:bg-teal-700"
                    >
                        {isCreating ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Start Discussion
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default CandidateDiscussionModal;
