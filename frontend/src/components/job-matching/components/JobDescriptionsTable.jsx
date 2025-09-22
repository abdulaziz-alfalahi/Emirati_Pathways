
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Trash2 } from 'lucide-react';

export function JobDescriptionsTable({ jobDescriptions, onViewDetails, onToggleStatus, onDelete }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b">
            <th className="py-3 px-4 text-left">Title</th>
            <th className="py-3 px-4 text-left">Company</th>
            <th className="py-3 px-4 text-left">Location</th>
            <th className="py-3 px-4 text-left">Status</th>
            <th className="py-3 px-4 text-left">Created</th>
            <th className="py-3 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {jobDescriptions.map((job) => (
            <tr key={job.id} className="border-b hover:bg-gray-50">
              <td className="py-3 px-4">{job.title}</td>
              <td className="py-3 px-4">{job.company}</td>
              <td className="py-3 px-4">{job.location || '-'}</td>
              <td className="py-3 px-4">
                <JobStatusBadge isActive={job.is_active} />
              </td>
              <td className="py-3 px-4">
                {new Date(job.created_at).toLocaleDateString()}
              </td>
              <td className="py-3 px-4 text-right">
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onViewDetails(job)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onToggleStatus(job.id, job.is_active)}
                  >
                    {job.is_active ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => onDelete(job.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function JobStatusBadge({ isActive }) {
  return (
    <Badge 
      variant={isActive ? "success" : "secondary"}
      className={isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
    >
      {isActive ? 'Active' : 'Inactive'}
    </Badge>
  );
}
