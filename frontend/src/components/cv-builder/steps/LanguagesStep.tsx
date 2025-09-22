import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Plus,
  X,
  Languages as LanguagesIcon,
  Globe,
  Award,
  Star
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Language } from '@/types/cv';

interface LanguagesStepProps {
  data: { languages?: Language[] };
  onChange: (section: string, data: Language[]) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const PROFICIENCY_LEVELS: Array<{ value: Language['proficiency']; label: string; description: string }> = [
  { value: 'Basic',         label: 'Basic',         description: 'Can understand and use familiar everyday expressions' },
  { value: 'Conversational',label: 'Conversational',description: 'Can communicate in routine tasks' },
  { value: 'Fluent',        label: 'Fluent',        description: 'Can express ideas fluently and spontaneously' },
  { value: 'Native',        label: 'Native',        description: 'Native or bilingual proficiency' }
];

const COMMON_LANGUAGES = [
  'Arabic','English','Hindi','Urdu','French','German','Spanish','Mandarin','Russian','Japanese',
  'Korean','Italian','Portuguese','Dutch','Turkish','Persian','Bengali','Tamil','Malayalam','Telugu'
];

const COMMON_CERTIFICATIONS = [
  'IELTS','TOEFL','Cambridge English','DELF/DALF (French)','TestDaF (German)','DELE (Spanish)',
  'JLPT (Japanese)','HSK (Chinese)','TORFL (Russian)','CILS (Italian)','Other'
];

export const LanguagesStep: React.FC<LanguagesStepProps> = ({
  data,
  onChange,
  onNext,
  onPrevious
}) => {
  const { t } = useTranslation();
  const [languages, setLanguages] = useState<Language[]>(data.languages || []);
  const [newLanguageName, setNewLanguageName] = useState('');
  const [newLanguageProficiency, setNewLanguageProficiency] = useState<Language['proficiency']>('Conversational');
  const [editingLanguage, setEditingLanguage] = useState<string | null>(null);
  const [newCertification, setNewCertification] = useState('');

  const handleAddLanguage = () => {
    if (!newLanguageName.trim()) return;

    // Prevent duplicates
    if (languages.some(lang => lang.name.toLowerCase() === newLanguageName.toLowerCase())) return;

    const newLanguage: Language = {
      id: `lang_${Date.now()}`,
      name: newLanguageName.trim(),
      proficiency: newLanguageProficiency,
      isNative: newLanguageProficiency === 'Native',
      certification: []
    };

    const updatedLanguages = [...languages, newLanguage];
    setLanguages(updatedLanguages);
    onChange('languages', updatedLanguages);
    setNewLanguageName('');
  };

  const handleRemoveLanguage = (languageId: string) => {
    const updatedLanguages = languages.filter(lang => lang.id !== languageId);
    setLanguages(updatedLanguages);
    onChange('languages', updatedLanguages);
  };

  const handleUpdateProficiency = (languageId: string, proficiency: Language['proficiency']) => {
    const updatedLanguages = languages.map(lang =>
      lang.id === languageId ? { ...lang, proficiency, isNative: proficiency === 'Native' } : lang
    );
    setLanguages(updatedLanguages);
    onChange('languages', updatedLanguages);
  };

  const handleAddCertification = (languageId: string, certification: string) => {
    if (!certification.trim()) return;

    const updatedLanguages = languages.map(lang =>
      lang.id === languageId
        ? { ...lang, certification: [ ...(lang.certification || []), certification.trim() ] }
        : lang
    );
    setLanguages(updatedLanguages);
    onChange('languages', updatedLanguages);
    setNewCertification('');
    setEditingLanguage(null);
  };

  const handleRemoveCertification = (languageId: string, certificationIndex: number) => {
    const updatedLanguages = languages.map(lang =>
      lang.id === languageId
        ? {
            ...lang,
            certification: (lang.certification || []).filter((_, index) => index !== certificationIndex)
          }
        : lang
    );
    setLanguages(updatedLanguages);
    onChange('languages', updatedLanguages);
  };

  const getProficiencyColor = (proficiency: Language['proficiency']) => {
    switch (proficiency) {
      case 'Basic':          return 'bg-red-100 text-red-800';
      case 'Conversational': return 'bg-yellow-100 text-yellow-800';
      case 'Fluent':         return 'bg-blue-100 text-blue-800';
      case 'Native':         return 'bg-green-100 text-green-800';
      default:               return 'bg-gray-100 text-gray-800';
    }
  };

  const getProficiencyStars = (proficiency: Language['proficiency']) => {
    const levels = { Basic: 1, Conversational: 2, Fluent: 3, Native: 4 } as const;
    return levels[proficiency] || 1;
  };

  const handleAddPresetLanguage = (languageName: string) => {
    if (languages.some(lang => lang.name.toLowerCase() === languageName.toLowerCase())) return;

    const newLanguage: Language = {
      id: `lang_${Date.now()}`,
      name: languageName,
      proficiency: 'Conversational',
      isNative: false,
      certification: []
    };

    const updatedLanguages = [...languages, newLanguage];
    setLanguages(updatedLanguages);
    onChange('languages', updatedLanguages);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">
          {t('cv.builder.languages.title', 'Languages')}
        </h2>
        <p className="text-muted-foreground">
          {t('cv.builder.languages.description', 'Add your language skills and proficiency levels')}
        </p>
      </div>

      {/* Add New Language */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            {t('cv.builder.languages.addNew', 'Add New Language')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="languageName">
                {t('cv.builder.languages.name', 'Language')}
              </Label>
              <Select value={newLanguageName} onValueChange={setNewLanguageName}>
                <SelectTrigger>
                  <SelectValue placeholder={t('cv.builder.languages.namePlaceholder', 'Select or type language')} />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_LANGUAGES
                    .filter(lang => !languages.some(existing => existing.name.toLowerCase() === lang.toLowerCase()))
                    .map((language) => (
                      <SelectItem key={language} value={language}>
                        {language}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {!COMMON_LANGUAGES.includes(newLanguageName) && (
                <Input
                  className="mt-2"
                  value={newLanguageName}
                  onChange={(e) => setNewLanguageName(e.target.value)}
                  placeholder={t('cv.builder.languages.customLanguage', 'Enter language name')}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddLanguage()}
                />
              )}
            </div>
            <div>
              <Label htmlFor="languageProficiency">
                {t('cv.builder.languages.proficiency', 'Proficiency Level')}
              </Label>
              <Select
                value={newLanguageProficiency}
                onValueChange={(value: Language['proficiency']) => setNewLanguageProficiency(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROFICIENCY_LEVELS.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={handleAddLanguage} disabled={!newLanguageName.trim()}>
                <Plus className="h-4 w-4 mr-2" />
                {t('cv.builder.languages.add', 'Add Language')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Languages */}
      {languages.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <LanguagesIcon className="h-5 w-5 mr-2" />
              {t('cv.builder.languages.current', 'Your Languages')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {languages.map((language) => (
                <div key={language.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <Globe className="h-5 w-5 text-blue-500" />
                      <span className="font-medium text-lg">{language.name}</span>
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: 4 }, (_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < getProficiencyStars(language.proficiency)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <Badge className={getProficiencyColor(language.proficiency)}>
                        {language.proficiency}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Select
                        value={language.proficiency}
                        onValueChange={(value: Language['proficiency']) =>
                          handleUpdateProficiency(language.id, value)
                        }
                      >
                        <SelectTrigger className="w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PROFICIENCY_LEVELS.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                              {level.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button onClick={() => handleRemoveLanguage(language.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Certifications */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center">
                        <Award className="h-4 w-4 mr-1" />
                        {t('cv.builder.languages.certifications', 'Certifications')}
                      </Label>
                      <Button
                        onClick={() => setEditingLanguage(editingLanguage === language.id ? null : language.id)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        {t('cv.builder.languages.addCertification', 'Add')}
                      </Button>
                    </div>

                    {language.certification && language.certification.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {language.certification.map((cert, index) => (
                          <Badge key={index} className="cursor-pointer">
                            {cert}
                            <X
                              className="h-3 w-3 ml-1"
                              onClick={() => handleRemoveCertification(language.id, index)}
                            />
                          </Badge>
                        ))}
                      </div>
                    )}

                    {editingLanguage === language.id && (
                      <div className="flex flex-col sm:flex-row gap-2 mt-2">
                        <Select value={newCertification} onValueChange={setNewCertification}>
                          <SelectTrigger className="flex-1">
                            <SelectValue
                              placeholder={t(
                                'cv.builder.languages.certificationPlaceholder',
                                'Select certification'
                              )}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {COMMON_CERTIFICATIONS.map((cert) => (
                              <SelectItem key={cert} value={cert}>
                                {cert}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {newCertification === 'Other' && (
                          <Input
                            placeholder={t('cv.builder.languages.customCertification', 'Enter certification')}
                            onChange={(e) => setNewCertification(e.target.value)}
                          />
                        )}
                        <Button
                          onClick={() => handleAddCertification(language.id, newCertification)}
                          disabled={!newCertification.trim()}
                        >
                          {t('common.add', 'Add')}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Suggested Languages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Globe className="h-5 w-5 mr-2" />
            {t('cv.builder.languages.suggestions', 'Common Languages in UAE')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {COMMON_LANGUAGES
              .filter(lang => !languages.some(existing => existing.name.toLowerCase() === lang.toLowerCase()))
              .slice(0, 10)
              .map((languageName) => (
                <Button
                  key={languageName}
                  onClick={() => handleAddPresetLanguage(languageName)}
                  className="text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  {languageName}
                </Button>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Languages Summary */}
      {languages.length > 0 && (
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-lg text-green-800">
              {t('cv.builder.languages.summary', 'Languages Summary')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="space-y-1">
                <div className="text-2xl font-bold text-green-700">
                  {languages.length}
                </div>
                <div className="text-sm text-green-600">
                  {t('cv.builder.languages.total', 'Total Languages')}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-green-700">
                  {languages.filter(l => l.proficiency === 'Native').length}
                </div>
                <div className="text-sm text-green-600">
                  {t('cv.builder.languages.native', 'Native')}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-green-700">
                  {languages.filter(l => l.proficiency === 'Fluent').length}
                </div>
                <div className="text-sm text-green-600">
                  {t('cv.builder.languages.fluent', 'Fluent')}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-green-700">
                  {languages.reduce((acc, lang) => acc + (lang.certification?.length || 0), 0)}
                </div>
                <div className="text-sm text-green-600">
                  {t('cv.builder.languages.certifications', 'Certifications')}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* UAE Language Tips */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg text-blue-800">
            {t('cv.builder.languages.uaeTips', 'UAE Language Tips')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-blue-700">
            <p>• {t('cv.builder.languages.tip1', 'Arabic proficiency is highly valued, especially for government roles')}</p>
            <p>• {t('cv.builder.languages.tip2', 'English is essential for most professional positions in UAE')}</p>
            <p>• {t('cv.builder.languages.tip3', 'Hindi/Urdu can be advantageous in customer-facing roles')}</p>
            <p>• {t('cv.builder.languages.tip4', 'Include language certifications (IELTS, TOEFL) for credibility')}</p>
            <p>• {t('cv.builder.languages.tip5', 'Mention if you can read/write Arabic script for government positions')}</p>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <Button onClick={onPrevious}>
          {t('common.previous', 'Previous')}
        </Button>
        <Button onClick={onNext}>
          {t('common.next', 'Next')}
        </Button>
      </div>
    </div>
  );
};
