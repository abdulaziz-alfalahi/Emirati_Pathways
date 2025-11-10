import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { CheckCircle, Briefcase, Building, MapPin } from 'lucide-react';

interface ManageShortlistDialogProps {
  open: boolean;
  onClose: () => void;
}

interface JobDescription {
  id: string;
  title: string;
  company_name: string;
  location: string;
  status: string;
}

const ManageShortlistDialog: React.FC<ManageShortlistDialogProps> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>([]);
  const [selectedJD, setSelectedJD] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadJobDescriptions();
    }
  }, [open]);

  const loadJobDescriptions = async () => {
    try {
      setLoading(true);
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
          // Show all JDs (active, published, and paused)
          const relevantJDs = result.job_descriptions.filter(
            (jd: any) => jd.status === 'active' || jd.status === 'published' || jd.status === 'paused'
          );
          setJobDescriptions(relevantJDs);
        }
      }
    } catch (error) {
      console.error('Error loading job descriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManageShortlist = () => {
    if (!selectedJD) {
      alert('Please select a job description');
      return;
    }

    // Navigate to shortlist management page
    navigate(`/recruiter/shortlist/${selectedJD}`);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-width-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Manage Shortlist
          </DialogTitle>
          <DialogDescription>
            Select a job description to manage its candidate shortlist
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
              <span className="ml-3 text-gray-600">Loading job descriptions...</span>
            </div>
          ) : jobDescriptions.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg border">
              <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">No job descriptions found</p>
              <p className="text-gray-500 text-sm mt-1">Create a job description first</p>
            </div>
          ) : (
            <>
              {/* Job Description Selection */}
              <div className="space-y-2">
                <Label htmlFor="jobDescription">
                  Select Job Description <span className="text-red-500">*</span>
                </Label>
                <Select value={selectedJD} onValueChange={setSelectedJD}>
                  <SelectTrigger id="jobDescription">
                    <SelectValue placeholder="Choose a job description" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobDescriptions.map((jd) => (
                      <SelectItem key={jd.id} value={jd.id}>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4" />
                            <span className="font-medium">{jd.title}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                            <span className="flex items-center gap-1">
                              <Building className="h-3 w-3" />
                              {jd.company_name}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {jd.location}
                            </span>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm">
                <p className="text-blue-700">
                  <strong>Tip:</strong> The shortlist manager allows you to view candidates, 
                  schedule interviews, and send offers for the selected job description.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleManageShortlist} 
            disabled={!selectedJD || loading}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Manage Shortlist
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManageShortlistDialog;

