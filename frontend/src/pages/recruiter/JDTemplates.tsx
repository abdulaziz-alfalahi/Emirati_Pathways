import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

const API = (p: string) => `http://localhost:5003${p}`;

export default function JDTemplatesPage() {
  const { toast } = useToast();
  const [list, setList] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [requirements, setRequirements] = useState('skills: python, qa');
  const [responsibilities, setResponsibilities] = useState('Test, Automate');
  const [benefits, setBenefits] = useState('Health insurance, Bonus');
  const token = (window as any).HR_TOKEN || localStorage.getItem('HR_TOKEN') || '';
  const H = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : {}), [token]);

  const load = async () => {
    try {
      const r = await fetch(API('/api/hr/jobs/templates'), { headers: H as any });
      if (!r.ok) throw new Error(await r.text());
      const j = await r.json();
      setList(j?.data?.templates || []);
    } catch (e: any) {
      toast({ title: 'Failed to load', description: e?.message || 'Error', variant: 'destructive' });
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
      const r = await fetch(API('/api/hr/jobs/templates'), { method: 'POST', headers: { ...(H as any), 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!r.ok) throw new Error(await r.text());
      toast({ title: 'Template created' });
      await load();
    } catch (e: any) {
      toast({ title: 'Create failed', description: e?.message || 'Error', variant: 'destructive' });
    }
  };

  return (
    <div className="p-6">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>JD Templates</CardTitle>
          <CardDescription>Create and reuse job description templates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Label>Title</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="QA Engineer Template" />
            </div>
            <div className="md:col-span-2">
              <Label>Requirements (JSON or key:value lines)</Label>
              <Textarea rows={3} value={requirements} onChange={e => setRequirements(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <Label>Responsibilities (comma)</Label>
              <Input value={responsibilities} onChange={e => setResponsibilities(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <Label>Benefits (comma)</Label>
              <Input value={benefits} onChange={e => setBenefits(e.target.value)} />
            </div>
            <div>
              <Button onClick={create}>Create Template</Button>
            </div>
          </div>

          <div className="overflow-x-auto rounded border">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="text-left border-b">
                  <th className="p-3">Title</th>
                  <th className="p-3">Source</th>
                  <th className="p-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {list.map(t => (
                  <tr key={t.id} className="border-b hover:bg-slate-50">
                    <td className="p-3">{t.title}</td>
                    <td className="p-3">{t.template_source}</td>
                    <td className="p-3">{t.created_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
