import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { JobPostStrengthMeter } from '@/components/recruiter/job-wizard/JobPostStrengthMeter';
import { Sparkles, Wand2 } from 'lucide-react';

const API = (p: string) => p;  // Use relative URLs for deployed environment

// Smart Defaults Dictionary
const SMART_DEFAULTS: Record<string, any> = {
  'python': {
    skills: 'Python, Django, Flask, SQL, REST APIs',
    description: 'We are looking for an experienced Python Developer to join our backend team. You will be responsible for building scalable APIs and optimizing database queries.',
    responsibilities: 'Design and implement RESTful APIs\nOptimize database performance\nCollaborate with frontend team',
    benefits: 'Competitive Salary\nRemote Work Options\nHealth Insurance'
  },
  'manager': {
    skills: 'Leadership, Project Management, Agile, Communication',
    description: 'Seeking a Project Manager to lead our development teams. You will oversee project timelines, resource allocation, and stakeholder communication.',
    responsibilities: 'Manage project lifecycles\nCoordinate cross-functional teams\nReport on project status',
    benefits: 'Leadership Bonus\nStock Options\nProfessional Development'
  },
  'marketing': {
    skills: 'SEO, Content Marketing, Google Analytics, Social Media',
    description: 'Join our marketing team to drive brand awareness and lead generation. You will manage campaigns across multiple channels.',
    responsibilities: 'Execute marketing campaigns\nAnalyze performance metrics\nManage social media accounts',
    benefits: 'Performance Bonuses\nFlexible Hours\nCreative Environment'
  }
};

export default function NewJobWizard() {
  const { toast } = useToast();

  // Step control
  const [step, setStep] = useState<number>(1);
  const maxStep = 6;

  // Backend job id once draft is created
  const [jobId, setJobId] = useState<string>('');

  // Form state
  const [title, setTitle] = useState('');
  const [employmentType, setEmploymentType] = useState('full-time');
  const [remoteAllowed, setRemoteAllowed] = useState(false);
  const [location, setLocation] = useState('Dubai');
  const [priority, setPriority] = useState('normal');
  const [experienceLevel, setExperienceLevel] = useState('mid');

  const [description, setDescription] = useState('');
  const [responsibilities, setResponsibilities] = useState<string>(''); // comma/newline
  const [benefits, setBenefits] = useState<string>(''); // comma/newline

  const [skills, setSkills] = useState('');
  const [minExperience, setMinExperience] = useState<number>(0 as any);
  const [educationLevel, setEducationLevel] = useState('Bachelor');

  const [salaryMin, setSalaryMin] = useState<number>(0 as any);
  const [salaryMax, setSalaryMax] = useState<number>(20000 as any);
  const [currency, setCurrency] = useState('AED');

  const [docs, setDocs] = useState<FileList | null>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');

  // Auth header
  const token = localStorage.getItem('access_token') || (window as any).HR_TOKEN || localStorage.getItem('HR_TOKEN') || '';
  const H = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : {}), [token]);

  // Load from localStorage (autosave)
  useEffect(() => {
    const saved = localStorage.getItem('recruiter_job_wizard');
    if (saved) {
      try {
        const s = JSON.parse(saved);
        setStep(s.step ?? 1);
        setJobId(s.jobId ?? '');
        setTitle(s.title ?? '');
        setEmploymentType(s.employmentType ?? 'full-time');
        setRemoteAllowed(!!s.remoteAllowed);
        setLocation(s.location ?? 'Dubai');
        setPriority(s.priority ?? 'normal');
        setExperienceLevel(s.experienceLevel ?? 'mid');
        setDescription(s.description ?? '');
        setResponsibilities(s.responsibilities ?? '');
        setBenefits(s.benefits ?? '');
        setSkills(s.skills ?? '');
        setMinExperience(s.minExperience ?? 0);
        setEducationLevel(s.educationLevel ?? 'Bachelor');
        setSalaryMin(s.salaryMin ?? 0);
        setSalaryMax(s.salaryMax ?? 0);
        setCurrency(s.currency ?? 'AED');
      } catch { }
    }
  }, []);

  // Load templates once
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(API('/api/hr/jobs/templates'), { headers: H as any });
        if (r.ok) {
          const j = await r.json();
          setTemplates(j?.data?.templates || []);
        }
      } catch { }
    })();
  }, [H]);

  // Persist to localStorage
  useEffect(() => {
    const payload = {
      step, jobId, title, employmentType, remoteAllowed, location, priority, experienceLevel,
      description, responsibilities, benefits,
      skills, minExperience, educationLevel,
      salaryMin, salaryMax, currency,
    };
    localStorage.setItem('recruiter_job_wizard', JSON.stringify(payload));
  }, [step, jobId, title, employmentType, remoteAllowed, location, priority, experienceLevel, description, responsibilities, benefits, skills, minExperience, educationLevel, salaryMin, salaryMax, currency]);

  // Helpers
  const parseList = (v: string): string[] => {
    return (v || '')
      .split(/\n|,/)
      .map(x => x.trim())
      .filter(Boolean);
  };

  const requirementsJSON = () => ({
    skills: parseList(skills),
    min_experience: Number(minExperience) || 0,
    education_level: educationLevel || '',
  });

  const buildPayload = () => ({
    title,
    description,
    requirements: requirementsJSON(),
    responsibilities: parseList(responsibilities),
    benefits: parseList(benefits),
    salary_range_min: salaryMin ? Number(salaryMin) : undefined,
    salary_range_max: salaryMax ? Number(salaryMax) : undefined,
    currency,
    location,
    remote_work_allowed: !!remoteAllowed,
    employment_type: employmentType,
    experience_level: experienceLevel,
    status: 'draft',
    priority_level: priority,
  });

  const applyTemplate = () => {
    const tpl = templates.find(t => t.id === selectedTemplateId);
    if (!tpl) return;
    try {
      // Requirements may be JSON object or string key:value lines
      const req = tpl.requirements_template;
      if (req) {
        if (typeof req === 'string') {
          // naive parse: key: value per line
          const obj: any = {};
          req.split(/\n|,/).forEach((line: string) => {
            const [k, ...rest] = line.split(':');
            if (k && rest.length) obj[k.trim()] = rest.join(':').trim();
          });
          setSkills(String(obj.skills || ''));
          if (obj.min_experience) setMinExperience(Number(obj.min_experience));
          if (obj.education_level) setEducationLevel(String(obj.education_level));
        } else if (typeof req === 'object') {
          if (Array.isArray(req.skills)) setSkills(req.skills.join(', '));
          if (req.min_experience != null) setMinExperience(Number(req.min_experience));
          if (req.education_level) setEducationLevel(String(req.education_level));
        }
      }
      if (Array.isArray(tpl.responsibilities_template)) setResponsibilities(tpl.responsibilities_template.join(', '));
      if (Array.isArray(tpl.benefits_template)) setBenefits(tpl.benefits_template.join(', '));
      toast({ title: 'Template applied', description: tpl.title });
    } catch (e: any) {
      toast({ title: 'Failed to apply template', description: e?.message || 'Error', variant: 'destructive' });
    }
  };

  const validateBasics = () => {
    if (!title?.trim()) {
      toast({ title: 'Title required', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const validateJD = () => {
    if (!description?.trim()) {
      toast({ title: 'Description required', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const saveDraft = async () => {
    const payload = buildPayload();
    try {
      if (!jobId) {
        // require title+description
        if (!validateBasics() || !validateJD()) return;
        const r = await fetch(API('/api/hr/jobs/'), {
          method: 'POST',
          headers: { ...(H as any), 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!r.ok) throw new Error(await r.text());
        const j = await r.json();
        const id = j?.data?.job_posting?.id;
        if (!id) throw new Error('Missing job id');
        setJobId(id);
        toast({ title: 'Draft saved', description: `Job created (${id.slice(0, 8)}...)` });
      } else {
        const r = await fetch(API(`/api/hr/jobs/${jobId}`), {
          method: 'PUT',
          headers: { ...(H as any), 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!r.ok) throw new Error(await r.text());
        toast({ title: 'Draft updated' });
      }
    } catch (e: any) {
      toast({ title: 'Failed to save', description: e?.message || 'Error', variant: 'destructive' });
    }
  };

  const uploadDocuments = async () => {
    if (!jobId) {
      toast({ title: 'Save draft first', variant: 'destructive' });
      return;
    }
    if (!docs || docs.length === 0) {
      toast({ title: 'Choose files to upload', variant: 'destructive' });
      return;
    }
    try {
      for (let i = 0; i < docs.length; i++) {
        const fd = new FormData();
        fd.append('file', docs[i]);
        const r = await fetch(API(`/api/hr/jobs/${jobId}/documents`), {
          method: 'POST',
          headers: { ...(H as any) },
          body: fd,
        });
        if (!r.ok) throw new Error(await r.text());
      }
      toast({ title: 'Documents uploaded' });
    } catch (e: any) {
      toast({ title: 'Upload failed', description: e?.message || 'Error', variant: 'destructive' });
    }
  };

  const checkCompliance = async () => {
    if (!jobId) return;
    try {
      const r = await fetch(API(`/api/hr/jobs/${jobId}/compliance-check`), {
        method: 'POST',
        headers: { ...(H as any) },
      });
      if (!r.ok) throw new Error(await r.text());
      const j = await r.json();
      const score = j?.data?.compliance_score ?? j?.data?.score;
      toast({ title: 'Compliance checked', description: `Score: ${score}` });
      return j?.data;
    } catch (e: any) {
      toast({ title: 'Compliance error', description: e?.message || 'Error', variant: 'destructive' });
    }
  };

  const publish = async (andMatch = false) => {
    if (!jobId) return;
    try {
      const url = andMatch ? `/api/hr/jobs/${jobId}/publish-and-match` : `/api/hr/jobs/${jobId}/publish`;
      const r = await fetch(API(url), { method: 'POST', headers: { ...(H as any) } });
      if (!r.ok) throw new Error(await r.text());
      const j = await r.json();
      toast({ title: andMatch ? 'Published and matched' : 'Published', description: andMatch ? `Top matches: ${(j?.data?.top_matches || []).length}` : undefined });
    } catch (e: any) {
      toast({ title: 'Publish failed', description: e?.message || 'Error', variant: 'destructive' });
    }
  };

  // --- Smart Features ---

  const handleSmartFill = () => {
    if (!title) {
      toast({ title: 'Enter a title first', variant: 'destructive' });
      return;
    }
    const lowerTitle = title.toLowerCase();
    let match = null;

    for (const key in SMART_DEFAULTS) {
      if (lowerTitle.includes(key)) {
        match = SMART_DEFAULTS[key];
        break;
      }
    }

    if (match) {
      setSkills(match.skills);
      setDescription(match.description);
      setResponsibilities(match.responsibilities);
      setBenefits(match.benefits);
      toast({ title: 'Smart Fill Applied', description: 'Fields populated based on job title.' });
    } else {
      toast({ title: 'No match found', description: 'Try "Python", "Manager", or "Marketing".' });
    }
  };

  const handleAIGenerate = (field: 'description' | 'responsibilities' | 'benefits') => {
    if (!title) {
      toast({ title: 'Enter a title first', variant: 'destructive' });
      return;
    }

    // Simulate AI generation
    toast({ title: 'Generating content...', description: 'AI is writing for you.' });

    setTimeout(() => {
      if (field === 'description') {
        setDescription(prev => prev + (prev ? '\n\n' : '') + `[AI Generated] We are seeking a talented ${title} to join our dynamic team. In this role, you will leverage your expertise to drive innovation and success.`);
      } else if (field === 'responsibilities') {
        setResponsibilities(prev => prev + (prev ? '\n' : '') + `[AI] Lead key initiatives for ${title}\n[AI] Collaborate with cross-functional teams\n[AI] Ensure high-quality deliverables`);
      } else if (field === 'benefits') {
        setBenefits(prev => prev + (prev ? '\n' : '') + `[AI] Competitive compensation package\n[AI] Professional growth opportunities\n[AI] Modern work environment`);
      }
      toast({ title: 'Content Generated', description: 'Review and edit the AI suggestions.' });
    }, 1000);
  };

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>New Job Wizard</CardTitle>
            <CardDescription>Step {step} of {maxStep}</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Templates quick apply */}
            <div className="flex items-center gap-2 mb-4">
              <Label>Load Template</Label>
              <select className="p-2 border rounded" value={selectedTemplateId} onChange={e => setSelectedTemplateId(e.target.value)}>
                <option value="">Select a template</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
              <Button variant="outline" onClick={applyTemplate} disabled={!selectedTemplateId}>Apply</Button>
            </div>
            {/* Step navigation */}
            <div className="flex items-center gap-2 mb-4">
              {Array.from({ length: maxStep }).map((_, i) => (
                <Badge key={i} variant={i + 1 === step ? 'default' : 'secondary'} className="cursor-pointer" onClick={() => setStep(i + 1)}>
                  {i + 1}
                </Badge>
              ))}
              <div className="ml-auto text-xs text-slate-500">{jobId ? `Draft ID: ${jobId.slice(0, 8)}...` : 'Draft not created'}</div>
            </div>

            {step === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 flex items-end gap-2">
                  <div className="flex-1">
                    <Label>Title</Label>
                    <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., QA Engineer" />
                  </div>
                  <Button variant="secondary" onClick={handleSmartFill} className="mb-0.5 bg-teal-50 text-teal-700 hover:bg-teal-100 border-teal-200">
                    <Wand2 className="h-4 w-4 mr-2" />
                    Smart Fill
                  </Button>
                </div>
                <div>
                  <Label>Employment Type</Label>
                  <select className="w-full p-2 border rounded" value={employmentType} onChange={e => setEmploymentType(e.target.value)}>
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                    <option value="freelance">Gig/Freelance</option>
                  </select>
                </div>
                <div>
                  <Label>Location</Label>
                  <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="Dubai" />
                </div>
                <div>
                  <Label>Remote</Label>
                  <select className="w-full p-2 border rounded" value={remoteAllowed ? 'yes' : 'no'} onChange={e => setRemoteAllowed(e.target.value === 'yes')}>
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
                <div>
                  <Label>Experience Level</Label>
                  <select className="w-full p-2 border rounded" value={experienceLevel} onChange={e => setExperienceLevel(e.target.value)}>
                    <option value="junior">Junior</option>
                    <option value="mid">Mid</option>
                    <option value="senior">Senior</option>
                  </select>
                </div>
                <div>
                  <Label>Priority</Label>
                  <select className="w-full p-2 border rounded" value={priority} onChange={e => setPriority(e.target.value)}>
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <Label>Description</Label>
                    <Button variant="ghost" size="sm" onClick={() => handleAIGenerate('description')} className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 h-6 text-xs">
                      <Sparkles className="h-3 w-3 mr-1" />
                      AI Generate
                    </Button>
                  </div>
                  <Textarea rows={6} value={description} onChange={e => setDescription(e.target.value)} placeholder="Role overview and responsibilities..." />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <Label>Responsibilities (comma or newline)</Label>
                    <Button variant="ghost" size="sm" onClick={() => handleAIGenerate('responsibilities')} className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 h-6 text-xs">
                      <Sparkles className="h-3 w-3 mr-1" />
                      AI Generate
                    </Button>
                  </div>
                  <Textarea rows={4} value={responsibilities} onChange={e => setResponsibilities(e.target.value)} placeholder="List responsibilities" />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <Label>Benefits (comma or newline)</Label>
                    <Button variant="ghost" size="sm" onClick={() => handleAIGenerate('benefits')} className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 h-6 text-xs">
                      <Sparkles className="h-3 w-3 mr-1" />
                      AI Generate
                    </Button>
                  </div>
                  <Textarea rows={4} value={benefits} onChange={e => setBenefits(e.target.value)} placeholder="List benefits" />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Skills (comma separated)</Label>
                  <Input value={skills} onChange={e => setSkills(e.target.value)} placeholder="python, qa" />
                </div>
                <div>
                  <Label>Min Experience (years)</Label>
                  <Input type="number" value={minExperience} onChange={e => setMinExperience((e.target as any).value)} />
                </div>
                <div>
                  <Label>Education Level</Label>
                  <Input value={educationLevel} onChange={e => setEducationLevel(e.target.value)} placeholder="Bachelor" />
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Salary Min</Label>
                  <Input type="number" value={salaryMin} onChange={e => setSalaryMin((e.target as any).value)} />
                </div>
                <div>
                  <Label>Salary Max</Label>
                  <Input type="number" value={salaryMax} onChange={e => setSalaryMax((e.target as any).value)} />
                </div>
                <div>
                  <Label>Currency</Label>
                  <Input value={currency} onChange={e => setCurrency(e.target.value)} placeholder="AED" />
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-4">
                <div>
                  <Label>Upload JD/Attachments</Label>
                  <Input type="file" multiple onChange={e => setDocs(e.target.files)} />
                  <div className="text-xs text-slate-500 mt-1">Save draft first to enable uploads.</div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={uploadDocuments} disabled={!jobId}>Upload</Button>
                </div>
              </div>
            )}

            {step === 6 && (
              <div className="space-y-4">
                <div className="text-sm text-slate-700">
                  <div><b>Title:</b> {title}</div>
                  <div><b>Type:</b> {employmentType} {remoteAllowed ? '(remote allowed)' : ''}</div>
                  <div><b>Location:</b> {location}</div>
                  <div><b>Description:</b> {description?.slice(0, 200)}{description?.length > 200 ? '...' : ''}</div>
                  <div><b>Skills:</b> {parseList(skills).join(', ')}</div>
                  <div><b>Experience:</b> {minExperience} yrs | <b>Education:</b> {educationLevel}</div>
                  <div><b>Salary:</b> {salaryMin}-{salaryMax} {currency}</div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={checkCompliance} disabled={!jobId}>Check Compliance</Button>
                  <Button onClick={() => publish(false)} disabled={!jobId}>Publish</Button>
                  <Button onClick={() => publish(true)} disabled={!jobId}>Publish & Match</Button>
                </div>
              </div>
            )}

            {/* Footer actions */}
            <div className="flex items-center justify-between mt-6">
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1}>Back</Button>
                <Button variant="outline" onClick={saveDraft}>Save Draft</Button>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setStep(Math.min(maxStep, step + 1))}>{step === maxStep ? 'Finish' : 'Next'}</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar for Strength Meter */}
      <div className="lg:col-span-1">
        <div className="sticky top-24">
          <JobPostStrengthMeter
            title={title}
            description={description}
            skills={skills}
            salaryMin={Number(salaryMin)}
            salaryMax={Number(salaryMax)}
            location={location}
          />
        </div>
      </div>
    </div>
  );
}
