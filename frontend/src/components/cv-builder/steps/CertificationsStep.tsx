import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Trash2, 
  Award, 
  Calendar, 
  ExternalLink, 
  Edit,
  Save,
  X,
  AlertTriangle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Certification } from '@/types/cv';

interface CertificationsStepProps {
  data: { certifications?: Certification[] };
  onChange: (section: string, data: Certification[]) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const EMPTY_CERTIFICATION: Certification = {
  id: '',
  name: '',
  issuer: '',
  issueDate: '',
  expiryDate: '',
  credentialId: '',
  credentialUrl: '',
  description: ''
};

const POPULAR_CERTIFICATIONS = {
  'Technology': [
    'AWS Certified Solutions Architect',
    'Microsoft Azure Fundamentals',
    'Google Cloud Professional',
    'Cisco CCNA',
    'CompTIA Security+',
    'PMP (Project Management)',
    'Scrum Master (CSM)',
    'ITIL Foundation',
    'Salesforce Administrator',
    'Oracle Database Administrator'
  ],
  'Business': [
    'CPA (Certified Public Accountant)',
    'CFA (Chartered Financial Analyst)',
    'FRM (Financial Risk Manager)',
    'Six Sigma Green Belt',
    'Six Sigma Black Belt',
    'Digital Marketing Certificate',
    'Google Analytics Certified',
    'HubSpot Content Marketing',
    'Lean Management',
    'Change Management'
  ],
  'Healthcare': [
    'BLS (Basic Life Support)',
    'ACLS (Advanced Cardiac Life Support)',
    'PALS (Pediatric Advanced Life Support)',
    'CPR Certification',
    'First Aid Certification',
    'Infection Control Certificate',
    'Medical Coding (CPC)',
    'Pharmacy Technician',
    'Nursing License',
    'Medical Assistant'
  ],
  'Education': [
    'Teaching License',
    'TESOL/TEFL Certificate',
    'Educational Leadership',
    'Special Education Certificate',
    'Curriculum Development',
    'Assessment and Evaluation',
    'Educational Technology',
    'Adult Learning Certificate',
    'Training and Development',
    'Instructional Design'
  ]
};

export const CertificationsStep: React.FC<CertificationsStepProps> = ({
  data,
  onChange,
  onNext,
  onPrevious
}) => {
  const { t } = useTranslation();
  const [certifications, setCertifications] = useState<Certification[]>(data.certifications || []);
  const [editingIndex, setEditingIndex] = useState<number>(-1);
  const [currentCertification, setCurrentCertification] = useState<Certification>(EMPTY_CERTIFICATION);
  const [selectedCategory, setSelectedCategory] = useState<string>('Technology');

  const handleAddCertification = () => {
    const newCert = {
      ...EMPTY_CERTIFICATION,
      id: `cert_${Date.now()}`
    };
    setCurrentCertification(newCert);
    setEditingIndex(certifications.length);
  };

  const handleEditCertification = (index: number) => {
    setCurrentCertification(certifications[index]);
    setEditingIndex(index);
  };

  const handleSaveCertification = () => {
    if (!currentCertification.name || !currentCertification.issuer) {
      return;
    }

    const updatedCertifications = [...certifications];
    if (editingIndex === certifications.length) {
      // Adding new certification
      updatedCertifications.push(currentCertification);
    } else {
      // Editing existing certification
      updatedCertifications[editingIndex] = currentCertification;
    }

    // Sort by issue date (most recent first)
    updatedCertifications.sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());

    setCertifications(updatedCertifications);
    onChange('certifications', updatedCertifications);
    setEditingIndex(-1);
    setCurrentCertification(EMPTY_CERTIFICATION);
  };

  const handleCancelEdit = () => {
    setEditingIndex(-1);
    setCurrentCertification(EMPTY_CERTIFICATION);
  };

  const handleDeleteCertification = (index: number) => {
    const updatedCertifications = certifications.filter((_, i) => i !== index);
    setCertifications(updatedCertifications);
    onChange('certifications', updatedCertifications);
  };

  const handleFieldChange = (field: keyof Certification, value: any) => {
    setCurrentCertification(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddPresetCertification = (certName: string) => {
    const newCert: Certification = {
      id: `cert_${Date.now()}`,
      name: certName,
      issuer: '',
      issueDate: '',
      description: ''
    };
    setCurrentCertification(newCert);
    setEditingIndex(certifications.length);
  };

  const isExpired = (expiryDate: string) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const isExpiringSoon = (expiryDate: string) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    return expiry <= threeMonthsFromNow && expiry >= new Date();
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">
          {t('cv.builder.certifications.title', 'Certifications & Licenses')}
        </h2>
        <p className="text-muted-foreground">
          {t('cv.builder.certifications.description', 'Add your professional certifications and licenses')}
        </p>
      </div>

      {/* Existing Certifications */}
      <div className="space-y-4">
        {certifications.map((certification, index) => (
          <Card key={certification.id} className="relative">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center">
                  <Award className="h-5 w-5 mr-2" />
                  {certification.name}
                  {isExpired(certification.expiryDate || '') && (
                    <Badge variant="destructive" className="ml-2">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {t('cv.builder.certifications.expired', 'Expired')}
                    </Badge>
                  )}
                  {isExpiringSoon(certification.expiryDate || '') && (
                    <Badge variant="secondary" className="ml-2">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {t('cv.builder.certifications.expiringSoon', 'Expiring Soon')}
                    </Badge>
                  )}
                </CardTitle>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditCertification(index)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteCertification(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {t('cv.builder.certifications.issuedBy', 'Issued by')}: {certification.issuer}
                </p>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-2" />
                  {certification.issueDate}
                  {certification.expiryDate && (
                    <span> - {certification.expiryDate}</span>
                  )}
                </div>
                {certification.credentialId && (
                  <p className="text-sm">
                    <strong>{t('cv.builder.certifications.credentialId', 'Credential ID')}:</strong> {certification.credentialId}
                  </p>
                )}
                {certification.credentialUrl && (
                  <a 
                    href={certification.credentialUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    {t('cv.builder.certifications.viewCredential', 'View Credential')}
                  </a>
                )}
                {certification.description && (
                  <p className="text-sm mt-2">{certification.description}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add/Edit Certification Form */}
      {editingIndex >= 0 && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>
              {editingIndex === certifications.length 
                ? t('cv.builder.certifications.add', 'Add New Certification')
                : t('cv.builder.certifications.edit', 'Edit Certification')
              }
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="certName">
                  {t('cv.builder.certifications.name', 'Certification Name')} *
                </Label>
                <Input
                  id="certName"
                  value={currentCertification.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  placeholder={t('cv.builder.certifications.namePlaceholder', 'e.g., AWS Certified Solutions Architect')}
                />
              </div>
              <div>
                <Label htmlFor="issuer">
                  {t('cv.builder.certifications.issuer', 'Issuing Organization')} *
                </Label>
                <Input
                  id="issuer"
                  value={currentCertification.issuer}
                  onChange={(e) => handleFieldChange('issuer', e.target.value)}
                  placeholder={t('cv.builder.certifications.issuerPlaceholder', 'e.g., Amazon Web Services')}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="issueDate">
                  {t('cv.builder.certifications.issueDate', 'Issue Date')} *
                </Label>
                <Input
                  id="issueDate"
                  type="month"
                  value={currentCertification.issueDate}
                  onChange={(e) => handleFieldChange('issueDate', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="expiryDate">
                  {t('cv.builder.certifications.expiryDate', 'Expiry Date')}
                </Label>
                <Input
                  id="expiryDate"
                  type="month"
                  value={currentCertification.expiryDate}
                  onChange={(e) => handleFieldChange('expiryDate', e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {t('cv.builder.certifications.expiryNote', 'Leave empty if certification does not expire')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="credentialId">
                  {t('cv.builder.certifications.credentialId', 'Credential ID')}
                </Label>
                <Input
                  id="credentialId"
                  value={currentCertification.credentialId}
                  onChange={(e) => handleFieldChange('credentialId', e.target.value)}
                  placeholder={t('cv.builder.certifications.credentialIdPlaceholder', 'e.g., AWS-ASA-12345')}
                />
              </div>
              <div>
                <Label htmlFor="credentialUrl">
                  {t('cv.builder.certifications.credentialUrl', 'Credential URL')}
                </Label>
                <Input
                  id="credentialUrl"
                  value={currentCertification.credentialUrl}
                  onChange={(e) => handleFieldChange('credentialUrl', e.target.value)}
                  placeholder={t('cv.builder.certifications.credentialUrlPlaceholder', 'https://...')}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">
                {t('cv.builder.certifications.description', 'Description')}
              </Label>
              <Textarea
                id="description"
                value={currentCertification.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                placeholder={t('cv.builder.certifications.descriptionPlaceholder', 'Brief description of what this certification covers...')}
                className="min-h-[80px]"
              />
            </div>

            <div className="flex space-x-2 pt-4">
              <Button onClick={handleSaveCertification}>
                <Save className="h-4 w-4 mr-2" />
                {t('common.save', 'Save')}
              </Button>
              <Button variant="outline" onClick={handleCancelEdit}>
                <X className="h-4 w-4 mr-2" />
                {t('common.cancel', 'Cancel')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add New Certification Button */}
      {editingIndex === -1 && (
        <Card className="border-dashed border-2 border-gray-300 hover:border-primary cursor-pointer transition-colors">
          <CardContent className="flex items-center justify-center py-8" onClick={handleAddCertification}>
            <div className="text-center">
              <Plus className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-gray-600">
                {t('cv.builder.certifications.addNew', 'Add Certification')}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Popular Certifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Award className="h-5 w-5 mr-2" />
            {t('cv.builder.certifications.popular', 'Popular Certifications')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 mb-4">
              {Object.keys(POPULAR_CERTIFICATIONS).map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {POPULAR_CERTIFICATIONS[selectedCategory as keyof typeof POPULAR_CERTIFICATIONS]
                .filter(certName => 
                  !certifications.some(cert => cert.name.toLowerCase().includes(certName.toLowerCase()))
                )
                .map((certName) => (
                <Button
                  key={certName}
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddPresetCertification(certName)}
                  className="text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {certName}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Certifications Summary */}
      {certifications.length > 0 && (
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-lg text-green-800">
              {t('cv.builder.certifications.summary', 'Certifications Summary')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="space-y-1">
                <div className="text-2xl font-bold text-green-700">
                  {certifications.length}
                </div>
                <div className="text-sm text-green-600">
                  {t('cv.builder.certifications.total', 'Total Certifications')}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-green-700">
                  {certifications.filter(c => !c.expiryDate).length}
                </div>
                <div className="text-sm text-green-600">
                  {t('cv.builder.certifications.permanent', 'Permanent')}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-orange-700">
                  {certifications.filter(c => isExpiringSoon(c.expiryDate || '')).length}
                </div>
                <div className="text-sm text-orange-600">
                  {t('cv.builder.certifications.expiringSoon', 'Expiring Soon')}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-red-700">
                  {certifications.filter(c => isExpired(c.expiryDate || '')).length}
                </div>
                <div className="text-sm text-red-600">
                  {t('cv.builder.certifications.expired', 'Expired')}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* UAE Certification Tips */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg text-blue-800">
            {t('cv.builder.certifications.uaeTips', 'UAE Certification Tips')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-blue-700">
            <p>• {t('cv.builder.certifications.tip1', 'Include internationally recognized certifications for better credibility')}</p>
            <p>• {t('cv.builder.certifications.tip2', 'Professional licenses may need UAE equivalency verification')}</p>
            <p>• {t('cv.builder.certifications.tip3', 'Keep certifications current - expired ones may hurt your application')}</p>
            <p>• {t('cv.builder.certifications.tip4', 'Industry-specific certifications are highly valued in UAE market')}</p>
            <p>• {t('cv.builder.certifications.tip5', 'Include credential IDs and verification URLs when available')}</p>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onPrevious}>
          {t('common.previous', 'Previous')}
        </Button>
        <Button onClick={onNext}>
          {t('common.next', 'Next')}
        </Button>
      </div>
    </div>
  );
};

