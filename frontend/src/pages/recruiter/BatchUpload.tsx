import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

import { restClient } from '@/utils/api';

export default function BatchUploadPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);

  const parseCSV = async (text: string) => {
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) throw new Error('CSV must have header + data');
    const headers = lines[0].split(',').map(h => h.trim());
    const rows = lines.slice(1).map(line => {
      const cols = line.split(',');
      const obj: any = {};
      headers.forEach((h, i) => { obj[h] = cols[i] ? cols[i].trim() : ''; });
      return obj;
    });
    return rows;
  };

  const upload = async () => {
    if (!file) { toast({ title: 'Choose a CSV file first', variant: 'destructive' }); return; }
    try {
      const text = await file.text();
      const rows = await parseCSV(text);
      const jobs = rows.map((r: any) => ({
        title: r.title,
        description: r.description,
        requirements: {
          skills: (r.skills || '').split('|').filter(Boolean),
          min_experience: Number(r.min_experience || 0),
          education_level: r.education_level || ''
        },
        responsibilities: (r.responsibilities || '').split('|').filter(Boolean),
        benefits: (r.benefits || '').split('|').filter(Boolean),
        salary_range_min: r.salary_min ? Number(r.salary_min) : undefined,
        salary_range_max: r.salary_max ? Number(r.salary_max) : undefined,
        currency: r.currency || 'AED',
        location: r.location || 'Dubai',
        remote_work_allowed: (r.remote || '').toLowerCase() === 'yes',
        employment_type: r.employment_type || 'full-time',
        experience_level: r.experience_level || 'mid',
        priority_level: r.priority || 'normal',
      }));

      const response = await restClient.post('/api/hr/jobs/batch', { jobs });

      if (response.data && response.data.success) {
        navigate('/recruiter/jobs', {
          state: {
            batchSuccess: true,
            count: jobs.length
          }
        });
      } else {
        throw new Error(response.data.message || 'Batch upload failed');
      }
    } catch (e: any) {
      console.error(e);
      toast({ title: 'Batch upload failed', description: e?.message || 'Error', variant: 'destructive' });
    }
  };

  const handleDownloadTemplate = () => {
    const headers = [
      'title', 'description', 'skills', 'min_experience', 'education_level',
      'responsibilities', 'benefits', 'salary_min', 'salary_max', 'currency',
      'location', 'remote', 'employment_type', 'experience_level', 'priority'
    ];
    const exampleRow = [
      'Software Engineer', 'Develop awesome apps', 'React|Node.js|TypeScript', '3', 'Bachelor',
      'Write code|Review PRs', 'Healthcare|Remote', '15000', '25000', 'AED',
      'Dubai', 'yes', 'full-time', 'mid', 'normal'
    ];

    const csvContent = [
      headers.join(','),
      exampleRow.join(',')
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'job_upload_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Batch Upload Jobs</CardTitle>
          <CardDescription>Upload a CSV of jobs with columns like title,description,skills|min_experience|education_level...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <Label>CSV File</Label>
              <Input type="file" accept=".csv" onChange={e => setFile(e.target.files?.[0] || null)} />
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={upload}>Upload</Button>
              <Button variant="outline" onClick={handleDownloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
            </div>
            <div className="text-xs text-slate-500">
              Example columns: title,description,skills,min_experience,education_level,responsibilities,benefits,salary_min,salary_max,currency,location,remote,employment_type,experience_level,priority
              <br />Use pipe (|) to separate multi-values in a single cell (skills/responsibilities/benefits).
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
