
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BlockchainCredential } from '@/types/blockchainCredentials';
import { credentialTemplateService } from '@/services/blockchain/credentialTemplateService';
import { Award, GraduationCap, Shield, FileCheck, Calendar, Hash, ExternalLink } from 'lucide-react';

interface CredentialTemplateProps {
  credential: BlockchainCredential;
  variant?: 'card' | 'certificate' | 'preview';
  className?: string;
}

const CredentialTemplate: React.FC<CredentialTemplateProps> = ({ 
  credential, 
  variant = 'card',
  className = ''
}) => {
  const template = credentialTemplateService.getTemplate(credential.credential_type);

  const getCredentialIcon = () => {
    switch (credential.credential_type) {
      case 'certification':
        return <Award className="h-6 w-6" />;
      case 'degree':
        return <GraduationCap className="h-6 w-6" />;
      case 'skill_badge':
        return <Shield className="h-6 w-6" />;
      case 'completion_certificate':
        return <FileCheck className="h-6 w-6" />;
      default:
        return <Award className="h-6 w-6" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (variant === 'certificate') {
    return (
      <div 
        className={`relative overflow-hidden rounded-lg shadow-lg ${className}`}
        style={{
          background: `linear-gradient(135deg, ${template.primaryColor}, ${template.secondaryColor})`,
          minHeight: '400px'
        }}
      >
        {/* Background Pattern */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(`
              <svg width="60" height="60" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="pattern" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
                    <circle cx="15" cy="15" r="5" fill="${template.accentColor}"/>
                  </pattern>
                </defs>
                <rect width="60" height="60" fill="url(#pattern)"/>
              </svg>
            `)}")`,
            backgroundRepeat: 'repeat'
          }}
        />

        {/* Border */}
        <div 
          className="absolute inset-2 rounded-lg border-2"
          style={{ borderColor: template.accentColor }}
        />

        {/* Content */}
        <div className="relative z-10 p-8 h-full flex flex-col justify-between">
          {/* Header */}
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div 
                className="p-4 rounded-full text-white"
                style={{ backgroundColor: template.accentColor }}
              >
                {getCredentialIcon()}
              </div>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">{credential.title}</h1>
            <p className="text-lg text-white/90 uppercase tracking-wider">
              {credential.credential_type.replace('_', ' ')}
            </p>
          </div>

          {/* Main Content */}
          <div className="bg-white/95 rounded-lg p-6 my-6">
            {credential.description && (
              <p className="text-gray-700 text-center mb-4">{credential.description}</p>
            )}
            
            {credential.skills && credential.skills.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold text-gray-800 mb-2">Skills Certified:</h3>
                <div className="flex flex-wrap gap-2 justify-center">
                  {credential.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary" style={{ backgroundColor: template.secondaryColor, color: 'white' }}>
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 me-2" />
                <span>Issued: {formatDate(credential.issued_date)}</span>
              </div>
              {credential.expiry_date && (
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 me-2" />
                  <span>Expires: {formatDate(credential.expiry_date)}</span>
                </div>
              )}
              <div className="flex items-center">
                <Hash className="h-4 w-4 me-2" />
                <span>Block: #{credential.block_number}</span>
              </div>
              <div className="flex items-center">
                <ExternalLink className="h-4 w-4 me-2" />
                <span>Tx: {credential.transaction_hash.substring(0, 12)}...</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center">
            <div className="flex justify-center items-center mb-2">
              <div 
                className={`w-3 h-3 rounded-full me-2 ${
                  credential.verification_status === 'verified' ? 'bg-green-400' : 
                  credential.verification_status === 'pending' ? 'bg-yellow-400' : 'bg-red-400'
                }`}
              />
              <span className="text-white font-semibold capitalize">
                {credential.verification_status}
              </span>
            </div>
            <p className="text-white/80 text-sm">
              Blockchain Verified Credential
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'preview') {
    return (
      <div className={`relative ${className}`}>
        <img 
          src={credentialTemplateService.generateCredentialPreview(credential)}
          alt={`${credential.title} Preview`}
          className="w-full h-auto rounded-lg shadow-md"
        />
      </div>
    );
  }

  // Default card variant
  return (
    <Card className={`hover:shadow-lg transition-shadow ${className}`}>
      <CardContent className="p-6">
        <div 
          className="w-full h-32 rounded-lg mb-4 flex items-center justify-center relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${template.primaryColor}, ${template.secondaryColor})`
          }}
        >
          {/* Pattern overlay */}
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(`
                <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="20" cy="20" r="5" fill="${template.accentColor}"/>
                </svg>
              `)}")`,
              backgroundRepeat: 'repeat'
            }}
          />
          
          <div className="relative z-10 text-white text-center">
            <div className="mb-2">{getCredentialIcon()}</div>
            <h3 className="font-bold text-lg">{credential.title}</h3>
            <p className="text-sm opacity-90 uppercase tracking-wider">
              {credential.credential_type.replace('_', ' ')}
            </p>
          </div>
          
          <Badge 
            className={`absolute top-2 end-2 ${
              credential.verification_status === 'verified' ? 'bg-green-500' : 
              credential.verification_status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
            }`}
          >
            {credential.verification_status}
          </Badge>
        </div>

        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 me-2" />
            <span>Issued: {formatDate(credential.issued_date)}</span>
          </div>
          <div className="flex items-center">
            <Hash className="h-4 w-4 me-2" />
            <span>Block: #{credential.block_number}</span>
          </div>
        </div>

        {credential.skills && credential.skills.length > 0 && (
          <div className="mt-4">
            <div className="flex flex-wrap gap-1">
              {credential.skills.slice(0, 3).map((skill, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {credential.skills.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{credential.skills.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CredentialTemplate;
