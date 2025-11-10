import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Clock, MapPin, Video, Users } from 'lucide-react';

interface ScheduleInterviewDialogProps {
  open: boolean;
  onClose: () => void;
}

interface JobDescription {
  id: string;
  title: string;
  company_name: string;
}

interface Candidate {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

const ScheduleInterviewDialog: React.FC<ScheduleInterviewDialogProps> = ({ open, onClose }) => {
  const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCandidates, setLoadingCandidates] = useState(false);

  // Form state
  const [selectedJD, setSelectedJD] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [interviewType, setInterviewType] = useState('technical');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  // Load job descriptions on mount
  useEffect(() => {
    if (open) {
      loadJobDescriptions();
    }
  }, [open]);

  // Load candidates when JD is selected
  useEffect(() => {
    if (selectedJD) {
      loadCandidates(selectedJD);
    } else {
      setCandidates([]);
    }
  }, [selectedJD]);

  const loadJobDescriptions = async () => {
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('access_token') || localStorage.getItem('auth_token');
      
      const response = await fetch('http://localhost:5003/api/recruiter/jd/list', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.job_descriptions) {
          // Filter only active JDs
          const activeJDs = result.job_descriptions.filter((jd: any) => jd.status === 'active' || jd.status === 'published');
          setJobDescriptions(activeJDs);
        }
      }
    } catch (error) {
      console.error('Error loading job descriptions:', error);
    }
  };

  const loadCandidates = async (jdId: string) => {
    try {
      setLoadingCandidates(true);
      const token = localStorage.getItem('accessToken') || localStorage.getItem('access_token') || localStorage.getItem('auth_token');
      
      const response = await fetch(`http://localhost:5003/api/recruiter/shortlist/${jdId}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          // Filter only shortlisted candidates
          const shortlistedCandidates = result.data.filter(
            (item: any) => item.status === 'shortlisted' || item.status === 'interviewed'
          );
          setCandidates(shortlistedCandidates.map((item: any) => item.candidate));
        }
      }
    } catch (error) {
      console.error('Error loading candidates:', error);
    } finally {
      setLoadingCandidates(false);
    }
  };

  const handleSchedule = async () => {
    if (!selectedJD || !selectedCandidate || !interviewType || !scheduledDate || !scheduledTime) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);

      const token = localStorage.getItem('accessToken') || localStorage.getItem('access_token') || localStorage.getItem('auth_token');
      
      // Combine date and time
      const scheduledDateTime = `${scheduledDate}T${scheduledTime}:00`;

      const response = await fetch('http://localhost:5003/api/recruiter/interviews/schedule', {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jd_id: selectedJD,
          candidate_id: selectedCandidate,
          interview_type: interviewType,
          scheduled_time: scheduledDateTime,
          location: location || null,
          notes: notes || null,
        }),
      });

      if (response.ok) {
        alert('Interview scheduled successfully!');
        resetForm();
        onClose();
      } else {
        const error = await response.json();
        alert(`Failed to schedule interview: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error scheduling interview:', error);
      alert('Failed to schedule interview. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedJD('');
    setSelectedCandidate('');
    setInterviewType('technical');
    setScheduledDate('');
    setScheduledTime('');
    setLocation('');
    setNotes('');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-width-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Schedule Interview
          </DialogTitle>
          <DialogDescription>
            Schedule an interview with a shortlisted candidate
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Job Description Selection */}
          <div className="space-y-2">
            <Label htmlFor="jobDescription">
              Job Description <span className="text-red-500">*</span>
            </Label>
            <Select value={selectedJD} onValueChange={setSelectedJD}>
              <SelectTrigger id="jobDescription">
                <SelectValue placeholder="Select job description" />
              </SelectTrigger>
              <SelectContent>
                {jobDescriptions.map((jd) => (
                  <SelectItem key={jd.id} value={jd.id}>
                    {jd.title} - {jd.company_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Candidate Selection */}
          <div className="space-y-2">
            <Label htmlFor="candidate">
              Candidate <span className="text-red-500">*</span>
            </Label>
            <Select
              value={selectedCandidate}
              onValueChange={setSelectedCandidate}
              disabled={!selectedJD || loadingCandidates}
            >
              <SelectTrigger id="candidate">
                <SelectValue placeholder={
                  loadingCandidates ? 'Loading candidates...' : 
                  !selectedJD ? 'Select a job description first' :
                  'Select candidate'
                } />
              </SelectTrigger>
              <SelectContent>
                {candidates.map((candidate) => (
                  <SelectItem key={candidate.id} value={candidate.id}>
                    {candidate.first_name} {candidate.last_name} ({candidate.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Interview Type */}
          <div className="space-y-2">
            <Label htmlFor="interviewType">
              Interview Type <span className="text-red-500">*</span>
            </Label>
            <Select value={interviewType} onValueChange={setInterviewType}>
              <SelectTrigger id="interviewType">
                <SelectValue placeholder="Select interview type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="screening">Screening</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
                <SelectItem value="behavioral">Behavioral</SelectItem>
                <SelectItem value="final">Final Round</SelectItem>
                <SelectItem value="panel">Panel Interview</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scheduledDate">
                Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="scheduledDate"
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scheduledTime">
                Time <span className="text-red-500">*</span>
              </Label>
              <Input
                id="scheduledTime"
                type="time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">
              Location / Meeting Link
            </Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="location"
                placeholder="e.g., Office Room 301 or Zoom link"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes or instructions for the interview"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm">
            <p className="text-blue-700">
              <strong>Note:</strong> An email notification will be sent to the candidate with the interview details.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSchedule} disabled={loading}>
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Scheduling...
              </>
            ) : (
              <>
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Interview
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleInterviewDialog;

