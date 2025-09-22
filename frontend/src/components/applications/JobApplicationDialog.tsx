import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Building, 
  MapPin, 
  DollarSign, 
  Clock, 
  Star, 
  Send, 
  Upload,
  FileText,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { applicationService, ApplicationData } from '@/services/applicationService';
import { useToast } from '@/hooks/use-toast';

interface Job {
  id: string;
  title: string;
  company_name: string;
  location: {
    emirate: string;
    city: string;
  };
  salary?: {
    min_salary?: number;
    max_salary?: number;
    currency: string;
  };
  employment_type: string;
  experience_level: string;
  created_at: string;
  emiratization_priority: boolean;
  required_skills?: string[];
  description: string;
}

interface JobApplicationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job | null;
  onApplicationSubmitted?: () => void;
}

const JobApplicationDialog: React.FC<JobApplicationDialogProps> = ({
  isOpen,
  onOpenChange,
  job,
  onApplicationSubmitted
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    cover_letter: '',
    expected_salary: '',
    salary_currency: 'AED',
    available_from: '',
    notice_period: '',
    source: 'direct',
    candidate_notes: ''
  });
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!job) return;

    setIsLoading(true);
    
    try {
      const applicationData: ApplicationData = {
        job_id: job.id,
        cover_letter: formData.cover_letter,
        expected_salary: formData.expected_salary ? parseInt(formData.expected_salary) : undefined,
        salary_currency: formData.salary_currency,
        available_from: formData.available_from,
        notice_period: formData.notice_period,
        source: formData.source,
        candidate_notes: formData.candidate_notes
      };

      const response = await applicationService.applyToJob(applicationData);
      
      if (response.success) {
        toast({
          title: "Application Submitted!",
          description: "Your application has been submitted successfully. You'll be notified of any updates.",
        });
        
        // Reset form
        setFormData({
          cover_letter: '',
          expected_salary: '',
          salary_currency: 'AED',
          available_from: '',
          notice_period: '',
          source: 'direct',
          candidate_notes: ''
        });
        
        onOpenChange(false);
        onApplicationSubmitted?.();
      } else {
        toast({
          title: "Application Failed",
          description: response.error || "Failed to submit application. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatSalary = (job: Job) => {
    if (!job.salary) return 'Salary not specified';
    const { min_salary, max_salary, currency } = job.salary;
    if (min_salary && max_salary) {
      return `${currency} ${min_salary.toLocaleString()} - ${max_salary.toLocaleString()}`;
    } else if (min_salary) {
      return `${currency} ${min_salary.toLocaleString()}+`;
    }
    return 'Competitive salary';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  if (!job) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Send className="h-5 w-5 text-blue-600" />
            <span>Apply for Position</span>
          </DialogTitle>
          <DialogDescription>
            Submit your application for this exciting opportunity. Make sure to provide all required information.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Job Details */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div>
                    <h3 className="text-lg font-semibold">{job.title}</h3>
                    {job.emiratization_priority && (
                      <Badge className="bg-red-100 text-red-800 mt-1">
                        UAE Nationals Priority
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      <span>{job.company_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{job.location.city}, {job.location.emirate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      <span>{formatSalary(job)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>Posted {formatDate(job.created_at)}</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-700 line-clamp-3">
                      {job.description}
                    </p>
                  </div>

                  {job.required_skills && job.required_skills.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Required Skills:</p>
                      <div className="flex flex-wrap gap-1">
                        {job.required_skills.slice(0, 6).map((skill, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {job.required_skills.length > 6 && (
                          <Badge variant="outline" className="text-xs">
                            +{job.required_skills.length - 6} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Application Tips */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm">Application Tips</h4>
                    <ul className="text-xs text-gray-600 mt-1 space-y-1">
                      <li>• Tailor your cover letter to this specific role</li>
                      <li>• Highlight relevant UAE experience if applicable</li>
                      <li>• Mention your Arabic language skills if relevant</li>
                      <li>• Be realistic about salary expectations</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Application Form */}
          <div className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Cover Letter */}
              <div>
                <Label htmlFor="cover_letter" className="text-sm font-medium">
                  Cover Letter *
                </Label>
                <Textarea
                  id="cover_letter"
                  placeholder="Tell us why you're the perfect fit for this role..."
                  value={formData.cover_letter}
                  onChange={(e) => handleInputChange('cover_letter', e.target.value)}
                  rows={6}
                  required
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Minimum 100 characters. Be specific about your qualifications and interest.
                </p>
              </div>

              {/* Salary Expectations */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="expected_salary" className="text-sm font-medium">
                    Expected Salary
                  </Label>
                  <Input
                    id="expected_salary"
                    type="number"
                    placeholder="25000"
                    value={formData.expected_salary}
                    onChange={(e) => handleInputChange('expected_salary', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="salary_currency" className="text-sm font-medium">
                    Currency
                  </Label>
                  <Select value={formData.salary_currency} onValueChange={(value) => handleInputChange('salary_currency', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AED">AED</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Availability */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="available_from" className="text-sm font-medium">
                    Available From
                  </Label>
                  <Input
                    id="available_from"
                    type="date"
                    value={formData.available_from}
                    onChange={(e) => handleInputChange('available_from', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="notice_period" className="text-sm font-medium">
                    Notice Period
                  </Label>
                  <Select value={formData.notice_period} onValueChange={(value) => handleInputChange('notice_period', value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select notice period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Immediate</SelectItem>
                      <SelectItem value="1 week">1 Week</SelectItem>
                      <SelectItem value="2 weeks">2 Weeks</SelectItem>
                      <SelectItem value="1 month">1 Month</SelectItem>
                      <SelectItem value="2 months">2 Months</SelectItem>
                      <SelectItem value="3 months">3 Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Application Source */}
              <div>
                <Label htmlFor="source" className="text-sm font-medium">
                  How did you find this job?
                </Label>
                <Select value={formData.source} onValueChange={(value) => handleInputChange('source', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="direct">Company Website</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                    <SelectItem value="job_board">Job Board</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="career_fair">Career Fair</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Additional Notes */}
              <div>
                <Label htmlFor="candidate_notes" className="text-sm font-medium">
                  Additional Notes (Optional)
                </Label>
                <Textarea
                  id="candidate_notes"
                  placeholder="Any additional information you'd like to share..."
                  value={formData.candidate_notes}
                  onChange={(e) => handleInputChange('candidate_notes', e.target.value)}
                  rows={3}
                  className="mt-1"
                />
              </div>

              {/* CV Upload Section */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">CV/Resume</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-3">
                    Your profile CV will be automatically attached to this application.
                  </p>
                  <Button type="button" variant="outline" size="sm" className="w-full">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload New CV (Optional)
                  </Button>
                </CardContent>
              </Card>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="flex-1"
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || !formData.cover_letter.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Submit Application
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JobApplicationDialog;

