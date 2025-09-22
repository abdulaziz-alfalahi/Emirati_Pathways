
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export function JobDetailsDialog({ isOpen, onOpenChange, selectedJob }) {
  if (!selectedJob) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{selectedJob?.title}</DialogTitle>
          <DialogDescription>
            {selectedJob?.company} • {selectedJob?.location}
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4 space-y-6">
          <JobDescriptionSection
            title="Description"
            content={selectedJob.description}
          />
          
          {selectedJob.responsibilities && selectedJob.responsibilities.length > 0 && (
            <JobResponsibilitiesSection 
              responsibilities={selectedJob.responsibilities} 
            />
          )}
          
          {selectedJob.requirements && (
            <JobRequirementsSection
              requirements={selectedJob.requirements}
            />
          )}
          
          {selectedJob.benefits && selectedJob.benefits.length > 0 && (
            <JobListSection
              title="Benefits"
              items={selectedJob.benefits}
            />
          )}
          
          <JobSalarySection salary={selectedJob.salary} />
          
          <div className="grid grid-cols-2 gap-4">
            <JobMetaSection
              title="Application Deadline"
              content={selectedJob.application_deadline || 'Not specified'}
            />
            <JobMetaSection
              title="Posted Date"
              content={selectedJob.posted_date || 'Not specified'}
            />
          </div>
          
          {selectedJob.keywords && selectedJob.keywords.length > 0 && (
            <JobKeywordsSection keywords={selectedJob.keywords} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function JobDescriptionSection({ title, content }) {
  if (!content) return null;
  return (
    <div>
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <p className="mt-1">{content}</p>
    </div>
  );
}

function JobResponsibilitiesSection({ responsibilities }) {
  return (
    <div>
      <h3 className="text-sm font-medium text-gray-500">Responsibilities</h3>
      <ul className="mt-1 list-disc pl-5">
        {responsibilities.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function JobRequirementsSection({ requirements }) {
  return (
    <div>
      <h3 className="text-sm font-medium text-gray-500">Requirements</h3>
      
      {requirements.skills && requirements.skills.length > 0 && (
        <div className="mt-2">
          <h4 className="text-xs font-medium text-gray-500">Skills</h4>
          <div className="mt-1 flex flex-wrap gap-1">
            {requirements.skills.map((skill, i) => (
              <Badge key={i} variant={skill.required ? "default" : "outline"}>
                {skill.name} {skill.level ? `(${skill.level})` : ''}
              </Badge>
            ))}
          </div>
        </div>
      )}
      
      {requirements.experience && requirements.experience.length > 0 && (
        <div className="mt-2">
          <h4 className="text-xs font-medium text-gray-500">Experience</h4>
          <ul className="mt-1 list-disc pl-5">
            {requirements.experience.map((exp, i) => (
              <li key={i}>
                {exp.years} years in {exp.field}
                {exp.required ? ' (Required)' : ''}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {requirements.education && requirements.education.length > 0 && (
        <div className="mt-2">
          <h4 className="text-xs font-medium text-gray-500">Education</h4>
          <ul className="mt-1 list-disc pl-5">
            {requirements.education.map((edu, i) => (
              <li key={i}>
                {edu.level} in {edu.field}
                {edu.required ? ' (Required)' : ''}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function JobListSection({ title, items }) {
  return (
    <div>
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <ul className="mt-1 list-disc pl-5">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function JobSalarySection({ salary }) {
  if (!salary || Object.keys(salary).length === 0) return null;
  
  return (
    <div>
      <h3 className="text-sm font-medium text-gray-500">Salary</h3>
      <p className="mt-1">
        {salary.min && salary.max ? 
          `${salary.min} - ${salary.max}` : 
          salary.min || salary.max || 'Not specified'}
        {salary.currency ? ` ${salary.currency}` : ''}
        {salary.period ? ` (${salary.period})` : ''}
      </p>
    </div>
  );
}

function JobMetaSection({ title, content }) {
  return (
    <div>
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      <p className="mt-1">{content}</p>
    </div>
  );
}

function JobKeywordsSection({ keywords }) {
  return (
    <div>
      <h3 className="text-sm font-medium text-gray-500">Keywords</h3>
      <div className="mt-1 flex flex-wrap gap-1">
        {keywords.map((keyword, i) => (
          <Badge key={i} variant="outline">{keyword}</Badge>
        ))}
      </div>
    </div>
  );
}
