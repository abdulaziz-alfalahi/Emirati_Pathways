import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Briefcase, 
  MapPin,
  DollarSign,
  Award,
  Target,
  CheckCircle,
  Gift,
  Building,
  Clock,
  Users,
  Globe
} from 'lucide-react';

interface JDPreviewPanelProps {
  jdData: {
    basic_info: {
      title: string;
      title_arabic?: string;
      department: string;
      job_type: string;
      job_level: string;
      emirate: string;
      city: string;
      remote_option: boolean;
    };
    description: string;
    description_arabic?: string;
    requirements: Array<{
      category: string;
      description: string;
      is_required: boolean;
    }>;
    responsibilities: Array<{
      description: string;
      category: string;
    }>;
    benefits: Array<{
      category: string;
      description: string;
    }>;
    compensation: {
      salary_min?: number;
      salary_max?: number;
      salary_currency: string;
    };
  };
  language?: 'en' | 'ar';
  className?: string;
}

const JDPreviewPanel: React.FC<JDPreviewPanelProps> = ({
  jdData,
  language = 'en',
  className = ''
}) => {
  const formatJobType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatJobLevel = (level: string) => {
    return level.charAt(0).toUpperCase() + level.slice(1) + ' Level';
  };

  const formatSalary = (min?: number, max?: number, currency: string = 'AED') => {
    if (!min && !max) return 'Competitive salary';
    if (min && max) {
      return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}`;
    }
    if (min) return `From ${currency} ${min.toLocaleString()}`;
    if (max) return `Up to ${currency} ${max.toLocaleString()}`;
    return 'Competitive salary';
  };

  const groupRequirementsByCategory = () => {
    const grouped: Record<string, typeof jdData.requirements> = {};
    jdData.requirements.forEach(req => {
      if (!grouped[req.category]) {
        grouped[req.category] = [];
      }
      grouped[req.category].push(req);
    });
    return grouped;
  };

  const groupBenefitsByCategory = () => {
    const grouped: Record<string, typeof jdData.benefits> = {};
    jdData.benefits.forEach(benefit => {
      if (!grouped[benefit.category]) {
        grouped[benefit.category] = [];
      }
      grouped[benefit.category].push(benefit);
    });
    return grouped;
  };

  const isRTL = language === 'ar';

  return (
    <Card className={`${className} ${isRTL ? 'rtl' : ''}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl">
            {language === 'ar' && jdData.basic_info.title_arabic 
              ? jdData.basic_info.title_arabic 
              : jdData.basic_info.title || 'Job Title'}
          </CardTitle>
          <Badge variant="outline">
            <Globe className="h-3 w-3 me-1" />
            {language === 'ar' ? 'عربي' : 'English'}
          </Badge>
        </div>
        <CardDescription className="space-y-2">
          <div className="flex items-center space-x-2">
            <Building className="h-4 w-4" />
            <span>{jdData.basic_info.department || 'Department'}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">
              <Briefcase className="h-3 w-3 me-1" />
              {formatJobType(jdData.basic_info.job_type)}
            </Badge>
            <Badge variant="secondary">
              <Award className="h-3 w-3 me-1" />
              {formatJobLevel(jdData.basic_info.job_level)}
            </Badge>
            <Badge variant="secondary">
              <MapPin className="h-3 w-3 me-1" />
              {jdData.basic_info.emirate && jdData.basic_info.city
                ? `${jdData.basic_info.city}, ${jdData.basic_info.emirate}`
                : 'Location TBD'}
            </Badge>
            {jdData.basic_info.remote_option && (
              <Badge variant="secondary">
                <Globe className="h-3 w-3 me-1" />
                Remote Option
              </Badge>
            )}
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Compensation */}
        {(jdData.compensation.salary_min || jdData.compensation.salary_max) && (
          <div className="bg-primary/5 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <span className="font-semibold text-lg">
                {formatSalary(
                  jdData.compensation.salary_min,
                  jdData.compensation.salary_max,
                  jdData.compensation.salary_currency
                )}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Monthly salary
            </p>
          </div>
        )}

        <Separator />

        {/* Job Description */}
        {jdData.description && (
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <Target className="h-5 w-5 me-2" />
              About the Role
            </h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {language === 'ar' && jdData.description_arabic
                ? jdData.description_arabic
                : jdData.description}
            </p>
          </div>
        )}

        {/* Requirements */}
        {jdData.requirements.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <CheckCircle className="h-5 w-5 me-2" />
              Requirements
            </h3>
            <div className="space-y-4">
              {Object.entries(groupRequirementsByCategory()).map(([category, reqs]) => (
                <div key={category}>
                  <h4 className="text-sm font-semibold text-primary mb-2 capitalize">
                    {category.replace('_', ' ')}
                  </h4>
                  <ul className="space-y-2">
                    {reqs.map((req, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <CheckCircle className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                          req.is_required ? 'text-primary' : 'text-muted-foreground'
                        }`} />
                        <span className="text-sm">
                          {req.description}
                          {!req.is_required && (
                            <Badge variant="outline" className="ms-2 text-xs">
                              Preferred
                            </Badge>
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Responsibilities */}
        {jdData.responsibilities.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <Award className="h-5 w-5 me-2" />
              Key Responsibilities
            </h3>
            <ul className="space-y-2">
              {jdData.responsibilities.map((resp, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span className="text-sm">{resp.description}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Benefits */}
        {jdData.benefits.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <Gift className="h-5 w-5 me-2" />
              Benefits & Perks
            </h3>
            <div className="space-y-4">
              {Object.entries(groupBenefitsByCategory()).map(([category, benefits]) => (
                <div key={category}>
                  <h4 className="text-sm font-semibold text-primary mb-2 capitalize">
                    {category.replace('_', ' ')}
                  </h4>
                  <ul className="space-y-2">
                    {benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                        <span className="text-sm">{benefit.description}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Info */}
        <Separator />
        <div className="text-xs text-muted-foreground space-y-1">
          <p className="flex items-center">
            <Clock className="h-3 w-3 me-1" />
            Posted: {new Date().toLocaleDateString()}
          </p>
          <p className="flex items-center">
            <Users className="h-3 w-3 me-1" />
            Equal opportunity employer
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default JDPreviewPanel;

