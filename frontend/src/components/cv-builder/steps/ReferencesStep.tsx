import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Trash2, 
  User, 
  Mail, 
  Phone, 
  Building,
  Edit,
  Save,
  X,
  Users,
  AlertCircle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Reference } from '@/types/cv';

interface ReferencesStepProps {
  data: { references?: Reference[] };
  onChange: (section: string, data: Reference[]) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const EMPTY_REFERENCE: Reference = {
  id: '',
  name: '',
  position: '',
  company: '',
  email: '',
  phone: '',
  relationship: ''
};

const RELATIONSHIP_TYPES = [
  'Direct Supervisor',
  'Manager',
  'Team Lead',
  'Colleague',
  'Client',
  'Professor',
  'Mentor',
  'HR Representative',
  'Department Head',
  'Project Manager',
  'Other'
];

export const ReferencesStep: React.FC<ReferencesStepProps> = ({
  data,
  onChange,
  onNext,
  onPrevious
}) => {
  const { t } = useTranslation();
  const [references, setReferences] = useState<Reference[]>(data.references || []);
  const [editingIndex, setEditingIndex] = useState<number>(-1);
  const [currentReference, setCurrentReference] = useState<Reference>(EMPTY_REFERENCE);

  const handleAddReference = () => {
    const newRef = {
      ...EMPTY_REFERENCE,
      id: `ref_${Date.now()}`
    };
    setCurrentReference(newRef);
    setEditingIndex(references.length);
  };

  const handleEditReference = (index: number) => {
    setCurrentReference(references[index]);
    setEditingIndex(index);
  };

  const handleSaveReference = () => {
    if (!currentReference.name || !currentReference.email || !currentReference.company) {
      return;
    }

    const updatedReferences = [...references];
    if (editingIndex === references.length) {
      // Adding new reference
      updatedReferences.push(currentReference);
    } else {
      // Editing existing reference
      updatedReferences[editingIndex] = currentReference;
    }

    setReferences(updatedReferences);
    onChange('references', updatedReferences);
    setEditingIndex(-1);
    setCurrentReference(EMPTY_REFERENCE);
  };

  const handleCancelEdit = () => {
    setEditingIndex(-1);
    setCurrentReference(EMPTY_REFERENCE);
  };

  const handleDeleteReference = (index: number) => {
    const updatedReferences = references.filter((_, i) => i !== index);
    setReferences(updatedReferences);
    onChange('references', updatedReferences);
  };

  const handleFieldChange = (field: keyof Reference, value: string) => {
    setCurrentReference(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">
          {t('cv.builder.references.title', 'Professional References')}
        </h2>
        <p className="text-muted-foreground">
          {t('cv.builder.references.description', 'Add professional references who can vouch for your work')}
        </p>
      </div>

      {/* Important Notice */}
      <Card className="bg-amber-50 border-amber-200">
        <CardHeader>
          <CardTitle className="text-lg text-amber-800 flex items-center">
            <AlertCircle className="h-5 w-5 me-2" />
            {t('cv.builder.references.notice', 'Important Notice')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-amber-700">
            <p>• {t('cv.builder.references.tip1', 'Always ask permission before listing someone as a reference')}</p>
            <p>• {t('cv.builder.references.tip2', 'Inform your references about the positions you\'re applying for')}</p>
            <p>• {t('cv.builder.references.tip3', 'Choose references who know your work well and can speak positively about you')}</p>
            <p>• {t('cv.builder.references.tip4', 'Include a mix of supervisors, colleagues, and clients if possible')}</p>
          </div>
        </CardContent>
      </Card>

      {/* Existing References */}
      <div className="space-y-4">
        {references.map((reference, index) => (
          <Card key={reference.id} className="relative">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center">
                  <User className="h-5 w-5 me-2" />
                  {reference.name}
                </CardTitle>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditReference(index)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteReference(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Building className="h-4 w-4 me-2" />
                  {reference.position} at {reference.company}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Mail className="h-4 w-4 me-2" />
                  {reference.email}
                </div>
                {reference.phone && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Phone className="h-4 w-4 me-2" />
                    {reference.phone}
                  </div>
                )}
                <div className="flex items-center text-sm text-muted-foreground">
                  <Users className="h-4 w-4 me-2" />
                  {t('cv.builder.references.relationship', 'Relationship')}: {reference.relationship}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add/Edit Reference Form */}
      {editingIndex >= 0 && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>
              {editingIndex === references.length 
                ? t('cv.builder.references.add', 'Add New Reference')
                : t('cv.builder.references.edit', 'Edit Reference')
              }
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="refName">
                  {t('cv.builder.references.name', 'Full Name')} *
                </Label>
                <Input
                  id="refName"
                  value={currentReference.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  placeholder={t('cv.builder.references.namePlaceholder', 'e.g., Ahmed Al Mansouri')}
                />
              </div>
              <div>
                <Label htmlFor="refPosition">
                  {t('cv.builder.references.position', 'Job Title')} *
                </Label>
                <Input
                  id="refPosition"
                  value={currentReference.position}
                  onChange={(e) => handleFieldChange('position', e.target.value)}
                  placeholder={t('cv.builder.references.positionPlaceholder', 'e.g., Senior Manager')}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="refCompany">
                {t('cv.builder.references.company', 'Company/Organization')} *
              </Label>
              <Input
                id="refCompany"
                value={currentReference.company}
                onChange={(e) => handleFieldChange('company', e.target.value)}
                placeholder={t('cv.builder.references.companyPlaceholder', 'e.g., Emirates NBD')}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="refEmail">
                  {t('cv.builder.references.email', 'Email Address')} *
                </Label>
                <Input
                  id="refEmail"
                  type="email"
                  value={currentReference.email}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  placeholder={t('cv.builder.references.emailPlaceholder', 'reference@company.com')}
                />
              </div>
              <div>
                <Label htmlFor="refPhone">
                  {t('cv.builder.references.phone', 'Phone Number')}
                </Label>
                <Input
                  id="refPhone"
                  value={currentReference.phone}
                  onChange={(e) => handleFieldChange('phone', e.target.value)}
                  placeholder={t('cv.builder.references.phonePlaceholder', '+971 50 123 4567')}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="refRelationship">
                {t('cv.builder.references.relationship', 'Professional Relationship')} *
              </Label>
              <Select value={currentReference.relationship} onValueChange={(value) => handleFieldChange('relationship', value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('cv.builder.references.relationshipPlaceholder', 'Select relationship')} />
                </SelectTrigger>
                <SelectContent>
                  {RELATIONSHIP_TYPES.map((relationship) => (
                    <SelectItem key={relationship} value={relationship}>
                      {relationship}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex space-x-2 pt-4">
              <Button onClick={handleSaveReference}>
                <Save className="h-4 w-4 me-2" />
                {t('common.save', 'Save')}
              </Button>
              <Button variant="outline" onClick={handleCancelEdit}>
                <X className="h-4 w-4 me-2" />
                {t('common.cancel', 'Cancel')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add New Reference Button */}
      {editingIndex === -1 && references.length < 5 && (
        <Card className="border-dashed border-2 border-gray-300 hover:border-primary cursor-pointer transition-colors">
          <CardContent className="flex items-center justify-center py-8" onClick={handleAddReference}>
            <div className="text-center">
              <Plus className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-gray-600">
                {t('cv.builder.references.addNew', 'Add Reference')}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {t('cv.builder.references.recommended', 'Recommended: 2-4 references')}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* References Summary */}
      {references.length > 0 && (
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-lg text-green-800">
              {t('cv.builder.references.summary', 'References Summary')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="space-y-1">
                <div className="text-2xl font-bold text-green-700">
                  {references.length}
                </div>
                <div className="text-sm text-green-600">
                  {t('cv.builder.references.total', 'Total References')}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-green-700">
                  {references.filter(r => r.relationship.includes('Supervisor') || r.relationship.includes('Manager')).length}
                </div>
                <div className="text-sm text-green-600">
                  {t('cv.builder.references.supervisors', 'Supervisors')}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-green-700">
                  {references.filter(r => r.relationship === 'Colleague').length}
                </div>
                <div className="text-sm text-green-600">
                  {t('cv.builder.references.colleagues', 'Colleagues')}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-green-700">
                  {references.filter(r => r.phone).length}
                </div>
                <div className="text-sm text-green-600">
                  {t('cv.builder.references.withPhone', 'With Phone')}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* UAE References Tips */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg text-blue-800">
            {t('cv.builder.references.uaeTips', 'UAE References Tips')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-blue-700">
            <p>• {t('cv.builder.references.uaeTip1', 'Include UAE-based references when possible for local credibility')}</p>
            <p>• {t('cv.builder.references.uaeTip2', 'Government positions often require character references')}</p>
            <p>• {t('cv.builder.references.uaeTip3', 'Ensure references are available during UAE business hours')}</p>
            <p>• {t('cv.builder.references.uaeTip4', 'Consider including references who understand UAE work culture')}</p>
            <p>• {t('cv.builder.references.uaeTip5', 'Professional references are preferred over personal ones')}</p>
          </div>
        </CardContent>
      </Card>

      {/* Alternative Options */}
      {references.length === 0 && (
        <Card className="bg-gray-50 border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg text-gray-800">
              {t('cv.builder.references.alternatives', 'Alternative Options')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-gray-700">
              <p>• {t('cv.builder.references.alt1', 'You can mention "References available upon request" on your CV')}</p>
              <p>• {t('cv.builder.references.alt2', 'Prepare a separate reference sheet to provide when asked')}</p>
              <p>• {t('cv.builder.references.alt3', 'LinkedIn recommendations can supplement traditional references')}</p>
              <p>• {t('cv.builder.references.alt4', 'Portfolio or work samples can serve as indirect references')}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onPrevious}>
          {t('common.previous', 'Previous')}
        </Button>
        <Button onClick={onNext}>
          {t('cv.builder.complete', 'Complete CV')}
        </Button>
      </div>
    </div>
  );
};

