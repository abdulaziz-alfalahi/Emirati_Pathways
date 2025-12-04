import React, { useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const API = (p: string) => `http://127.0.0.1:5005${p}`;

export default function BatchUploadPage() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const token = (window as any).HR_TOKEN || localStorage.getItem('HR_TOKEN') || '';
  const H = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : {}), [token]);

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
        requirements: { skills: (r.skills || '').split('|').filter(Boolean), min_experience: Number(r.min_experience || 0), education_level: r.education_level || '' },
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
      const r = await fetch(API('/api/hr/jobs/batch'), { method: 'POST', headers: { ...(H as any), 'Content-Type': 'application/json' }, body: JSON.stringify({ jobs }) });
      if (!r.ok) throw new Error(await r.text());
      toast({ title: 'Batch created', description: `${jobs.length} jobs submitted` });
    } catch (e: any) {
      toast({ title: 'Batch upload failed', description: e?.message || 'Error', variant: 'destructive' });
    }
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
