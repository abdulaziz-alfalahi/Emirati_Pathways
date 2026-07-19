import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import { restClient } from '@/utils/api';

export default function JDTemplatesPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [list, setList] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [requirements, setRequirements] = useState('skills: python, qa');
  const [responsibilities, setResponsibilities] = useState('Test, Automate');
  const [benefits, setBenefits] = useState('Health insurance, Bonus');

  const load = async () => {
    try {
      const r = await restClient.get('/api/hr/jobs/templates');
      setList(r.data?.data?.templates || []);
    } catch (e: any) {
      console.error("Failed to load templates", e);
      toast({ title: 'Failed to load', description: e.response?.data?.error || e.message || 'Error', variant: 'destructive' });
    }
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    try {
      const payload = {
        title,
        requirements_template: requirements,
        responsibilities_template: responsibilities.split(',').map(s => s.trim()).filter(Boolean),
        benefits_template: benefits.split(',').map(s => s.trim()).filter(Boolean),
        is_public: false,
      };
      await restClient.post('/api/hr/jobs/templates', payload);
      toast({ title: 'Template created' });
      setTitle('');
      await load();
    } catch (e: any) {
      console.error("Failed to create template", e);
      toast({ title: 'Create failed', description: e.response?.data?.error || e.message || 'Error', variant: 'destructive' });
    }
  };

  return (
    <div className="p-6 min-h-screen bg-background">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/hr-dashboard')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-foreground">JD Templates Management</h1>
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Create New Template</CardTitle>
            <CardDescription>Define a standard template for job descriptions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <Label>Title</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Senior Software Engineer" />
              </div>
              <div className="md:col-span-2">
                <Label>Requirements (JSON or key:value lines)</Label>
                <Textarea rows={3} value={requirements} onChange={e => setRequirements(e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <Label>Responsibilities (comma separated)</Label>
                <Input value={responsibilities} onChange={e => setResponsibilities(e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <Label>Benefits (comma separated)</Label>
                <Input value={benefits} onChange={e => setBenefits(e.target.value)} />
              </div>
              <div className="md:col-span-2 flex justify-end">
                <Button onClick={create} className="bg-teal-600 hover:bg-teal-700">Create Template</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Existing Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded border">
              <table className="min-w-full bg-card text-sm">
                <thead>
                  <tr className="text-start border-b bg-muted/50">
                    <th className="p-3 font-medium text-slate-600">Title</th>
                    <th className="p-3 font-medium text-slate-600">Source</th>
                    <th className="p-3 font-medium text-slate-600">Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {list.length > 0 ? list.map(t => (
                    <tr key={t.id} className="border-b hover:bg-muted/50">
                      <td className="p-3 font-medium">{t.title}</td>
                      <td className="p-3 text-slate-500">{t.template_source}</td>
                      <td className="p-3 text-slate-500">{t.created_at ? new Date(t.created_at).toLocaleDateString() : '-'}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={3} className="p-4 text-center text-slate-500">No templates found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
