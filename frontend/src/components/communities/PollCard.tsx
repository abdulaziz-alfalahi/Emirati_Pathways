
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, CheckCircle } from 'lucide-react';
import { GroupPoll, PollVote } from '@/types/communities';
import { CommunitiesService } from '@/services/communitiesService';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/components/ui/use-toast';

interface PollCardProps {
  poll: GroupPoll;
  onVote?: () => void;
}

const PollCard: React.FC<PollCardProps> = ({ poll, onVote }) => {
  const { user } = useAuth();
  const [votes, setVotes] = useState<PollVote[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [totalVotes, setTotalVotes] = useState(0);

  useEffect(() => {
    loadVotes();
  }, [poll.id]);

  const loadVotes = async () => {
    try {
      const pollVotes = await CommunitiesService.getPollVotes(poll.id);
      setVotes(pollVotes);
      
      const userVote = pollVotes.find(vote => vote.user_id === user?.id);
      if (userVote) {
        setHasVoted(true);
        setSelectedOptions(userVote.selected_options);
      }
      
      setTotalVotes(pollVotes.length);
    } catch (error) {
      console.error('Failed to load poll votes:', error);
    }
  };

  const handleOptionSelect = (optionId: number) => {
    if (hasVoted) return;

    if (poll.multiple_choice) {
      setSelectedOptions(prev => 
        prev.includes(optionId) 
          ? prev.filter(id => id !== optionId)
          : [...prev, optionId]
      );
    } else {
      setSelectedOptions([optionId]);
    }
  };

  const handleVote = async () => {
    if (selectedOptions.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one option",
        variant: "destructive"
      });
      return;
    }

    setIsVoting(true);
    try {
      await CommunitiesService.votePoll(poll.id, selectedOptions);
      setHasVoted(true);
      await loadVotes();
      onVote?.();
      toast({
        title: "Success",
        description: "Your vote has been recorded!"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to record your vote",
        variant: "destructive"
      });
    } finally {
      setIsVoting(false);
    }
  };

  const getOptionVotes = (optionId: number) => {
    return votes.filter(vote => vote.selected_options.includes(optionId)).length;
  };

  const getOptionPercentage = (optionId: number) => {
    if (totalVotes === 0) return 0;
    return (getOptionVotes(optionId) / totalVotes) * 100;
  };

  const isExpired = poll.expires_at && new Date(poll.expires_at) < new Date();

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{poll.title}</CardTitle>
            {poll.description && (
              <p className="text-sm text-muted-foreground mt-1">{poll.description}</p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {poll.multiple_choice && (
              <Badge variant="secondary">Multiple Choice</Badge>
            )}
            {isExpired && (
              <Badge variant="destructive">Expired</Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-3">
          {poll.options.map((option) => {
            const optionVotes = getOptionVotes(option.id);
            const percentage = getOptionPercentage(option.id);
            const isSelected = selectedOptions.includes(option.id);

            return (
              <div key={option.id} className="space-y-2">
                <div
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                    hasVoted || isExpired
                      ? 'cursor-default'
                      : isSelected
                      ? 'bg-primary/10 border-primary'
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => !hasVoted && !isExpired && handleOptionSelect(option.id)}
                >
                  <div className="flex items-center space-x-2">
                    {hasVoted && isSelected && (
                      <CheckCircle className="h-4 w-4 text-primary" />
                    )}
                    <span className="font-medium">{option.text}</span>
                  </div>
                  {hasVoted && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">
                        {optionVotes} votes ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                  )}
                </div>
                
                {hasVoted && (
                  <Progress value={percentage} className="h-2" />
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4" />
              <span>{totalVotes} votes</span>
            </div>
            {poll.expires_at && (
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>Expires {new Date(poll.expires_at).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {!hasVoted && !isExpired && (
            <Button
              onClick={handleVote}
              disabled={selectedOptions.length === 0 || isVoting}
              size="sm"
            >
              {isVoting ? 'Voting...' : 'Vote'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PollCard;
