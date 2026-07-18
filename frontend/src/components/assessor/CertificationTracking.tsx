import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Award, 
  Calendar, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Plus,
  X,
  Download,
  Upload,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Bell,
  Star,
  TrendingUp,
  FileText,
  ExternalLink,
  Shield
} from 'lucide-react';

interface Certification {
  id: string;
  name: string;
  issuer: string;
  category: string;
  level: string;
  issueDate: string;
  expiryDate?: string;
  credentialId: string;
  credentialUrl?: string;
  status: 'active' | 'expired' | 'expiring_soon' | 'pending_renewal';
  description?: string;
  skills: string[];
  ceuRequired?: number;
  ceuEarned?: number;
  renewalRequirements?: string[];
  documents: Array<{
    name: string;
    type: string;
    url: string;
    uploadDate: string;
  }>;
  verificationStatus: 'verified' | 'pending' | 'unverified';
  importance: 'critical' | 'important' | 'optional';
}

interface ContinuingEducation {
  id: string;
  title: string;
  provider: string;
  category: string;
  completionDate: string;
  hours: number;
  ceuCredits: number;
  certificateUrl?: string;
  relatedCertifications: string[];
  description?: string;
  skills: string[];
}

interface CertificationTrackingProps {
  onUpdate?: () => void;
}

const CertificationTracking: React.FC<CertificationTrackingProps> = ({ onUpdate }) => {
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [continuingEducation, setContinuingEducation] = useState<ContinuingEducation[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCert, setEditingCert] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('expiry');

  const certificationCategories = [
    'Assessment & Evaluation',
    'Psychometrics',
    'Human Resources',
    'Project Management',
    'Quality Assurance',
    'Data Analysis',
    'Training & Development',
    'Leadership',
    'Technology',
    'Industry Specific',
    'Language & Communication',
    'Safety & Compliance'
  ];

  const certificationLevels = [
    'Foundation',
    'Associate',
    'Professional',
    'Advanced',
    'Expert',
    'Master',
    'Fellow'
  ];

  const importanceColors = {
    critical: 'bg-red-100 text-red-800 border-red-200',
    important: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    optional: 'bg-blue-100 text-blue-800 border-blue-200'
  };

  const statusColors = {
    active: 'bg-green-100 text-green-800 border-green-200',
    expired: 'bg-red-100 text-red-800 border-red-200',
    expiring_soon: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    pending_renewal: 'bg-orange-100 text-orange-800 border-orange-200'
  };

  // Sample data for demonstration
  useEffect(() => {
    const sampleCertifications: Certification[] = [
      {
        id: '1',
        name: 'Certified Assessment Professional (CAP)',
        issuer: 'International Assessment Institute',
        category: 'Assessment & Evaluation',
        level: 'Professional',
        issueDate: '2022-03-15',
        expiryDate: '2025-03-15',
        credentialId: 'CAP-2022-001234',
        credentialUrl: 'https://verify.iai.org/cap-2022-001234',
        status: 'active',
        description: 'Comprehensive certification in assessment design, implementation, and evaluation.',
        skills: ['Assessment Design', 'Psychometrics', 'Data Analysis', 'Quality Assurance'],
        ceuRequired: 40,
        ceuEarned: 25,
        renewalRequirements: ['40 CEU Credits', 'Professional Development Portfolio', 'Peer Review'],
        documents: [
          {
            name: 'CAP Certificate.pdf',
            type: 'certificate',
            url: '/documents/cap-cert.pdf',
            uploadDate: '2022-03-15'
          }
        ],
        verificationStatus: 'verified',
        importance: 'critical'
      },
      {
        id: '2',
        name: 'Advanced Psychometric Analysis',
        issuer: 'Psychometric Society',
        category: 'Psychometrics',
        level: 'Advanced',
        issueDate: '2023-06-20',
        expiryDate: '2026-06-20',
        credentialId: 'APA-2023-567890',
        status: 'active',
        description: 'Advanced training in statistical analysis and psychometric theory.',
        skills: ['Statistical Analysis', 'Item Response Theory', 'Factor Analysis', 'Reliability Testing'],
        ceuRequired: 30,
        ceuEarned: 30,
        renewalRequirements: ['30 CEU Credits', 'Research Publication'],
        documents: [],
        verificationStatus: 'verified',
        importance: 'important'
      },
      {
        id: '3',
        name: 'Project Management Professional (PMP)',
        issuer: 'Project Management Institute',
        category: 'Project Management',
        level: 'Professional',
        issueDate: '2021-09-10',
        expiryDate: '2024-09-10',
        credentialId: 'PMP-2021-789012',
        status: 'expiring_soon',
        description: 'Global standard for project management professionals.',
        skills: ['Project Planning', 'Risk Management', 'Team Leadership', 'Quality Management'],
        ceuRequired: 60,
        ceuEarned: 45,
        renewalRequirements: ['60 PDU Credits', 'Continuing Education'],
        documents: [],
        verificationStatus: 'verified',
        importance: 'important'
      }
    ];

    const sampleEducation: ContinuingEducation[] = [
      {
        id: '1',
        title: 'AI in Assessment: Future Trends',
        provider: 'Assessment Technology Institute',
        category: 'Technology',
        completionDate: '2024-01-15',
        hours: 8,
        ceuCredits: 8,
        relatedCertifications: ['1'],
        description: 'Exploring the integration of AI technologies in modern assessment practices.',
        skills: ['AI Assessment', 'Machine Learning', 'Automated Scoring']
      },
      {
        id: '2',
        title: 'Cultural Bias in Assessment',
        provider: 'Diversity in Assessment Council',
        category: 'Assessment & Evaluation',
        completionDate: '2023-11-20',
        hours: 12,
        ceuCredits: 12,
        relatedCertifications: ['1', '2'],
        description: 'Understanding and mitigating cultural bias in assessment design.',
        skills: ['Cultural Competency', 'Bias Detection', 'Inclusive Assessment']
      }
    ];

    setCertifications(sampleCertifications);
    setContinuingEducation(sampleEducation);
  }, []);

  const getExpiryStatus = (expiryDate?: string) => {
    if (!expiryDate) return 'active';
    
    const expiry = new Date(expiryDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return 'expired';
    if (daysUntilExpiry <= 90) return 'expiring_soon';
    return 'active';
  };

  const getDaysUntilExpiry = (expiryDate?: string) => {
    if (!expiryDate) return null;
    
    const expiry = new Date(expiryDate);
    const now = new Date();
    return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const filteredCertifications = certifications
    .filter(cert => selectedCategory === 'all' || cert.category === selectedCategory)
    .sort((a, b) => {
      switch (sortBy) {
        case 'expiry':
          if (!a.expiryDate && !b.expiryDate) return 0;
          if (!a.expiryDate) return 1;
          if (!b.expiryDate) return -1;
          return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
        case 'name':
          return a.name.localeCompare(b.name);
        case 'importance':
          const importanceOrder = { critical: 0, important: 1, optional: 2 };
          return importanceOrder[a.importance] - importanceOrder[b.importance];
        default:
          return 0;
      }
    });

  const getUpcomingRenewals = () => {
    return certifications.filter(cert => {
      const days = getDaysUntilExpiry(cert.expiryDate);
      return days !== null && days <= 90 && days > 0;
    });
  };

  const getTotalCEUProgress = () => {
    const total = certifications.reduce((sum, cert) => sum + (cert.ceuRequired || 0), 0);
    const earned = certifications.reduce((sum, cert) => sum + (cert.ceuEarned || 0), 0);
    return { total, earned, percentage: total > 0 ? Math.round((earned / total) * 100) : 0 };
  };

  const addCertification = () => {
    const newCert: Certification = {
      id: Date.now().toString(),
      name: '',
      issuer: '',
      category: '',
      level: '',
      issueDate: '',
      credentialId: '',
      status: 'active',
      skills: [],
      documents: [],
      verificationStatus: 'unverified',
      importance: 'optional'
    };
    setCertifications([...certifications, newCert]);
    setEditingCert(newCert.id);
    setShowAddForm(true);
  };

  const updateCertification = (id: string, updates: Partial<Certification>) => {
    setCertifications(certs => 
      certs.map(cert => 
        cert.id === id 
          ? { ...cert, ...updates, status: getExpiryStatus(updates.expiryDate || cert.expiryDate) }
          : cert
      )
    );
  };

  const deleteCertification = (id: string) => {
    setCertifications(certs => certs.filter(cert => cert.id !== id));
  };

  const CertificationCard: React.FC<{ cert: Certification }> = ({ cert }) => {
    const daysUntilExpiry = getDaysUntilExpiry(cert.expiryDate);
    const isEditing = editingCert === cert.id;

    if (isEditing) {
      return (
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg">Edit Certification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Certification Name</Label>
                <Input
                  value={cert.name}
                  onChange={(e) => updateCertification(cert.id, { name: e.target.value })}
                  placeholder="Certification name"
                />
              </div>
              <div>
                <Label>Issuing Organization</Label>
                <Input
                  value={cert.issuer}
                  onChange={(e) => updateCertification(cert.id, { issuer: e.target.value })}
                  placeholder="Organization name"
                />
              </div>
              <div>
                <Label>Category</Label>
                <Select 
                  value={cert.category} 
                  onValueChange={(value) => updateCertification(cert.id, { category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {certificationCategories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Level</Label>
                <Select 
                  value={cert.level} 
                  onValueChange={(value) => updateCertification(cert.id, { level: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    {certificationLevels.map(level => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Issue Date</Label>
                <Input
                  type="date"
                  value={cert.issueDate}
                  onChange={(e) => updateCertification(cert.id, { issueDate: e.target.value })}
                />
              </div>
              <div>
                <Label>Expiry Date (Optional)</Label>
                <Input
                  type="date"
                  value={cert.expiryDate || ''}
                  onChange={(e) => updateCertification(cert.id, { expiryDate: e.target.value })}
                />
              </div>
              <div>
                <Label>Credential ID</Label>
                <Input
                  value={cert.credentialId}
                  onChange={(e) => updateCertification(cert.id, { credentialId: e.target.value })}
                  placeholder="Credential ID"
                />
              </div>
              <div>
                <Label>Importance</Label>
                <Select 
                  value={cert.importance} 
                  onValueChange={(value: 'critical' | 'important' | 'optional') => 
                    updateCertification(cert.id, { importance: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="important">Important</SelectItem>
                    <SelectItem value="optional">Optional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label>Description</Label>
              <Textarea
                value={cert.description || ''}
                onChange={(e) => updateCertification(cert.id, { description: e.target.value })}
                placeholder="Brief description of the certification"
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={() => setEditingCert(null)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  setEditingCert(null);
                  setShowAddForm(false);
                }}
              >
                Save
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className={`transition-all duration-200 hover:shadow-md ${
        cert.importance === 'critical' ? 'border-s-4 border-s-red-500' :
        cert.importance === 'important' ? 'border-s-4 border-s-yellow-500' :
        'border-s-4 border-s-blue-500'
      }`}>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="h-5 w-5" />
                {cert.name}
              </CardTitle>
              <CardDescription className="mt-1">
                {cert.issuer} • {cert.level}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={statusColors[cert.status]}>
                {cert.status.replace('_', ' ')}
              </Badge>
              <Badge className={importanceColors[cert.importance]}>
                {cert.importance}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <Label className="text-xs text-gray-500">Issue Date</Label>
              <p>{new Date(cert.issueDate).toLocaleDateString()}</p>
            </div>
            {cert.expiryDate && (
              <div>
                <Label className="text-xs text-gray-500">Expiry Date</Label>
                <p className={daysUntilExpiry && daysUntilExpiry <= 90 ? 'text-red-600 font-medium' : ''}>
                  {new Date(cert.expiryDate).toLocaleDateString()}
                  {daysUntilExpiry && daysUntilExpiry > 0 && (
                    <span className="block text-xs">
                      ({daysUntilExpiry} days left)
                    </span>
                  )}
                </p>
              </div>
            )}
            <div>
              <Label className="text-xs text-gray-500">Credential ID</Label>
              <p className="font-mono text-xs">{cert.credentialId}</p>
            </div>
            <div>
              <Label className="text-xs text-gray-500">Verification</Label>
              <div className="flex items-center gap-1">
                {cert.verificationStatus === 'verified' ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <Clock className="h-4 w-4 text-yellow-500" />
                )}
                <span className="text-xs capitalize">{cert.verificationStatus}</span>
              </div>
            </div>
          </div>

          {cert.ceuRequired && (
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>CEU Progress</span>
                <span>{cert.ceuEarned || 0} / {cert.ceuRequired}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(((cert.ceuEarned || 0) / cert.ceuRequired) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}

          {cert.skills.length > 0 && (
            <div>
              <Label className="text-xs text-gray-500">Skills</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {cert.skills.map(skill => (
                  <Badge key={skill} variant="outline" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {cert.description && (
            <div>
              <Label className="text-xs text-gray-500">Description</Label>
              <p className="text-sm text-gray-700 mt-1">{cert.description}</p>
            </div>
          )}

          <div className="flex justify-between items-center pt-2 border-t">
            <div className="flex gap-2">
              {cert.credentialUrl && (
                <Button size="sm" variant="outline" asChild>
                  <a href={cert.credentialUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 me-1" />
                    Verify
                  </a>
                </Button>
              )}
              {cert.documents.length > 0 && (
                <Button size="sm" variant="outline">
                  <FileText className="h-4 w-4 me-1" />
                  Documents ({cert.documents.length})
                </Button>
              )}
            </div>
            <div className="flex gap-1">
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => setEditingCert(cert.id)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => deleteCertification(cert.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const upcomingRenewals = getUpcomingRenewals();
  const ceuProgress = getTotalCEUProgress();

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{certifications.length}</p>
                <p className="text-sm text-gray-500">Total Certifications</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{upcomingRenewals.length}</p>
                <p className="text-sm text-gray-500">Expiring Soon</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{ceuProgress.percentage}%</p>
                <p className="text-sm text-gray-500">CEU Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">
                  {certifications.filter(c => c.verificationStatus === 'verified').length}
                </p>
                <p className="text-sm text-gray-500">Verified</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Renewals Alert */}
      {upcomingRenewals.length > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <Bell className="h-4 w-4 text-yellow-600" />
          <AlertDescription>
            <strong>Renewal Reminder:</strong> You have {upcomingRenewals.length} certification(s) expiring within 90 days.
            <div className="mt-2">
              {upcomingRenewals.map(cert => (
                <div key={cert.id} className="text-sm">
                  • {cert.name} expires on {cert.expiryDate && new Date(cert.expiryDate).toLocaleDateString()}
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex gap-4">
          <div>
            <Label htmlFor="category">Filter by Category</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {certificationCategories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="sort">Sort by</Label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expiry">Expiry Date</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="importance">Importance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Button onClick={addCertification}>
          <Plus className="h-4 w-4 me-2" />
          Add Certification
        </Button>
      </div>

      {/* Certifications List */}
      <div className="space-y-4">
        {filteredCertifications.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No certifications found</h3>
              <p className="text-gray-500 mb-4">
                {selectedCategory === 'all' 
                  ? "Start building your professional certification portfolio."
                  : `No certifications found in the ${selectedCategory} category.`
                }
              </p>
              <Button onClick={addCertification}>
                <Plus className="h-4 w-4 me-2" />
                Add Your First Certification
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredCertifications.map(cert => (
            <CertificationCard key={cert.id} cert={cert} />
          ))
        )}
      </div>

      {/* Continuing Education Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Continuing Education
          </CardTitle>
          <CardDescription>
            Track your professional development activities and CEU credits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {continuingEducation.map(edu => (
              <div key={edu.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium">{edu.title}</h4>
                    <p className="text-sm text-gray-500">{edu.provider}</p>
                  </div>
                  <Badge variant="outline">{edu.ceuCredits} CEU</Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                  <div>
                    <Label className="text-xs text-gray-500">Completed</Label>
                    <p>{new Date(edu.completionDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Hours</Label>
                    <p>{edu.hours}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Category</Label>
                    <p>{edu.category}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Related Certs</Label>
                    <p>{edu.relatedCertifications.length}</p>
                  </div>
                </div>
                {edu.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {edu.skills.map(skill => (
                      <Badge key={skill} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CertificationTracking;
