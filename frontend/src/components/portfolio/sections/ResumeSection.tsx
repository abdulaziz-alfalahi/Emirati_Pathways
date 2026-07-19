
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, ArrowUpRight } from "lucide-react";
import { ResumeData } from "@/components/resume/types";
import { formatDate } from "@/utils/dateFormat";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface ResumeSectionProps {
  resumeData: ResumeData | undefined | null;
}

const ResumeSection: React.FC<ResumeSectionProps> = ({ resumeData }) => {
  if (!resumeData || !resumeData.personal) {
    return (
      <Card className="bg-muted/40">
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 me-2" />
            Resume
          </CardTitle>
          <CardDescription>No resume data available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-4">Build your resume to enhance your portfolio</p>
            <Link to="/resume-builder">
              <Button>Create Resume</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { personal, experience, education, skills } = resumeData;
  
  // Get the most recent job if available
  const latestJob = experience && experience.length > 0 
    ? experience.sort((a, b) => 
        new Date(b.startDate || 0).getTime() - new Date(a.startDate || 0).getTime()
      )[0] 
    : null;
  
  // Get the highest education if available
  const highestEducation = education && education.length > 0
    ? education.sort((a, b) => 
        new Date(b.startDate || 0).getTime() - new Date(a.startDate || 0).getTime()
      )[0]
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileText className="h-5 w-5 me-2" />
          Resume
        </CardTitle>
        <CardDescription>
          {/* Use metadata.lastUpdated instead of updatedAt */}
          Last updated: {resumeData.metadata?.lastUpdated 
            ? formatDate(new Date(resumeData.metadata.lastUpdated)) 
            : 'N/A'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <h3 className="font-medium">Personal Information</h3>
          <div className="bg-muted/40 p-4 rounded-md">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">{personal.fullName}</p>
                {personal.jobTitle && (
                  <p className="text-sm text-muted-foreground">{personal.jobTitle}</p>
                )}
              </div>
              <div>
                {personal.email && (
                  <p className="text-sm">{personal.email}</p>
                )}
                {personal.phone && (
                  <p className="text-sm">{personal.phone}</p>
                )}
              </div>
            </div>
            {/* Use resumeData.summary instead of personal.summary */}
            {resumeData.summary && (
              <div className="mt-4">
                <p className="text-sm line-clamp-3">{resumeData.summary}</p>
              </div>
            )}
          </div>
        </div>

        {latestJob && (
          <div className="space-y-2">
            <h3 className="font-medium">Current/Latest Position</h3>
            <div className="bg-muted/40 p-4 rounded-md">
              {/* Use position instead of title */}
              <p className="font-medium">{latestJob.position}</p>
              <p className="text-sm">{latestJob.company}</p>
              <p className="text-xs text-muted-foreground">
                {latestJob.startDate && formatDate(new Date(latestJob.startDate))}
                {latestJob.endDate ? ` - ${formatDate(new Date(latestJob.endDate))}` : ' - Present'}
              </p>
            </div>
          </div>
        )}

        {highestEducation && (
          <div className="space-y-2">
            <h3 className="font-medium">Education</h3>
            <div className="bg-muted/40 p-4 rounded-md">
              <p className="font-medium">{highestEducation.degree}</p>
              <p className="text-sm">{highestEducation.institution}</p>
              <p className="text-xs text-muted-foreground">
                {highestEducation.startDate && formatDate(new Date(highestEducation.startDate))}
                {highestEducation.endDate ? ` - ${formatDate(new Date(highestEducation.endDate))}` : ' - Present'}
              </p>
            </div>
          </div>
        )}

        {skills && skills.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-medium">Key Skills</h3>
            <div className="bg-muted/40 p-4 rounded-md">
              <div className="flex flex-wrap gap-2">
                {skills.slice(0, 8).map((skill, index) => (
                  <span key={index} className="px-2 py-1 bg-background text-xs rounded-full">
                    {skill.name}
                  </span>
                ))}
                {skills.length > 8 && (
                  <span className="px-2 py-1 bg-background text-xs rounded-full text-muted-foreground">
                    +{skills.length - 8} more
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-4">
          <Link to="/resume-builder" className="text-sm text-primary hover:underline flex items-center">
            View full resume & edit
            <ArrowUpRight className="h-3 w-3 ms-1" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResumeSection;
