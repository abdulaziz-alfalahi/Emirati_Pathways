
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Plus, X, BarChart3 } from 'lucide-react';
import { CommunitiesService } from '@/services/communitiesService';
import { toast } from '@/components/ui/use-toast';

interface CreatePollDialogProps {
  groupId: string;
  onPollCreated?: () => void;
}

const CreatePollDialog: React.FC<CreatePollDialogProps> = ({ groupId, onPollCreated }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [multipleChoice, setMultipleChoice] = useState(false);
  const [hasExpiry, setHasExpiry] = useState(false);
  const [expiryDate, setExpiryDate] = useState('');

  const handleAddOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a poll title",
        variant: "destructive"
      });
      return;
    }

    const validOptions = options.filter(option => option.trim());
    if (validOptions.length < 2) {
      toast({
        title: "Error",
        description: "Please provide at least 2 options",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      await CommunitiesService.createPoll(groupId, {
        title: title.trim(),
        description: description.trim() || undefined,
        options: validOptions,
        multiple_choice: multipleChoice,
        expires_at: hasExpiry && expiryDate ? new Date(expiryDate).toISOString() : undefined
      });

      toast({
        title: "Success",
        description: "Poll created successfully!"
      });

      // Reset form
      setTitle('');
      setDescription('');
      setOptions(['', '']);
      setMultipleChoice(false);
      setHasExpiry(false);
      setExpiryDate('');
      setIsOpen(false);
      onPollCreated?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create poll",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <BarChart3 className="h-4 w-4 me-2" />
          Create Poll
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create a Poll</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Poll Question *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What would you like to ask?"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more context to your poll..."
              rows={2}
            />
          </div>

          <div className="space-y-3">
            <Label>Poll Options *</Label>
            {options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Input
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  required
                />
                {options.length > 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveOption(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            
            {options.length < 10 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleAddOption}
                className="w-full"
              >
                <Plus className="h-4 w-4 me-2" />
                Add Option
              </Button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="multiple-choice"
              checked={multipleChoice}
              onCheckedChange={setMultipleChoice}
            />
            <Label htmlFor="multiple-choice">Allow multiple selections</Label>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Switch
                id="has-expiry"
                checked={hasExpiry}
                onCheckedChange={setHasExpiry}
              />
              <Label htmlFor="has-expiry">Set expiry date</Label>
            </div>
            
            {hasExpiry && (
              <Input
                type="datetime-local"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Poll'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePollDialog;
