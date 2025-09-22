
import { BlockchainCredential } from '@/types/blockchainCredentials';

export interface CredentialTemplateConfig {
  id: string;
  name: string;
  description: string;
  credentialType: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  pattern: 'geometric' | 'waves' | 'dots' | 'lines' | 'certificates';
  icon: string;
  borderStyle: 'solid' | 'dashed' | 'dotted' | 'gradient';
}

export const credentialTemplates: Record<string, CredentialTemplateConfig> = {
  certification: {
    id: 'certification',
    name: 'Professional Certification',
    description: 'Template for professional certifications',
    credentialType: 'certification',
    primaryColor: '#1e40af', // blue-800
    secondaryColor: '#3b82f6', // blue-500
    accentColor: '#fbbf24', // amber-400
    pattern: 'geometric',
    icon: 'Award',
    borderStyle: 'gradient'
  },
  degree: {
    id: 'degree',
    name: 'Academic Degree',
    description: 'Template for academic degrees and diplomas',
    credentialType: 'degree',
    primaryColor: '#7c2d12', // red-900
    secondaryColor: '#dc2626', // red-600
    accentColor: '#fcd34d', // amber-300
    pattern: 'certificates',
    icon: 'GraduationCap',
    borderStyle: 'solid'
  },
  skill_badge: {
    id: 'skill_badge',
    name: 'Skill Badge',
    description: 'Template for skill verification badges',
    credentialType: 'skill_badge',
    primaryColor: '#065f46', // emerald-800
    secondaryColor: '#10b981', // emerald-500
    accentColor: '#34d399', // emerald-400
    pattern: 'dots',
    icon: 'Shield',
    borderStyle: 'dashed'
  },
  completion_certificate: {
    id: 'completion_certificate',
    name: 'Completion Certificate',
    description: 'Template for course completion certificates',
    credentialType: 'completion_certificate',
    primaryColor: '#581c87', // purple-900
    secondaryColor: '#8b5cf6', // purple-500
    accentColor: '#a78bfa', // purple-400
    pattern: 'waves',
    icon: 'FileCheck',
    borderStyle: 'dotted'
  }
};

class CredentialTemplateService {
  getTemplate(credentialType: string): CredentialTemplateConfig {
    return credentialTemplates[credentialType] || credentialTemplates.certification;
  }

  getAllTemplates(): CredentialTemplateConfig[] {
    return Object.values(credentialTemplates);
  }

  generateCredentialPreview(credential: BlockchainCredential): string {
    const template = this.getTemplate(credential.credential_type);
    return `data:image/svg+xml;base64,${btoa(this.generateSVG(credential, template))}`;
  }

  private generateSVG(credential: BlockchainCredential, template: CredentialTemplateConfig): string {
    const svg = `
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${template.primaryColor};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${template.secondaryColor};stop-opacity:1" />
          </linearGradient>
          ${this.generatePattern(template)}
        </defs>
        
        <!-- Background -->
        <rect width="400" height="300" fill="url(#gradient)" rx="10"/>
        
        <!-- Pattern Overlay -->
        <rect width="400" height="300" fill="url(#pattern)" opacity="0.1" rx="10"/>
        
        <!-- Border -->
        <rect width="394" height="294" x="3" y="3" fill="none" 
              stroke="${template.accentColor}" stroke-width="2" 
              stroke-dasharray="${template.borderStyle === 'dashed' ? '10,5' : template.borderStyle === 'dotted' ? '2,2' : '0'}" 
              rx="10"/>
        
        <!-- Header -->
        <rect width="380" height="60" x="10" y="10" fill="rgba(255,255,255,0.9)" rx="5"/>
        
        <!-- Title -->
        <text x="200" y="35" font-family="Arial, sans-serif" font-size="18" font-weight="bold" 
              text-anchor="middle" fill="${template.primaryColor}">
          ${credential.title}
        </text>
        
        <!-- Credential Type -->
        <text x="200" y="55" font-family="Arial, sans-serif" font-size="12" 
              text-anchor="middle" fill="${template.secondaryColor}">
          ${credential.credential_type.replace('_', ' ').toUpperCase()}
        </text>
        
        <!-- Main Content Area -->
        <rect width="360" height="160" x="20" y="80" fill="rgba(255,255,255,0.95)" rx="5"/>
        
        <!-- Verification Status -->
        <circle cx="350" cy="110" r="15" fill="${credential.verification_status === 'verified' ? '#10b981' : '#f59e0b'}"/>
        <text x="350" y="115" font-family="Arial, sans-serif" font-size="10" font-weight="bold" 
              text-anchor="middle" fill="white">✓</text>
        
        <!-- Issue Date -->
        <text x="30" y="110" font-family="Arial, sans-serif" font-size="14" font-weight="bold" 
              fill="${template.primaryColor}">
          Issued: ${new Date(credential.issued_date).toLocaleDateString()}
        </text>
        
        <!-- Block Info -->
        <text x="30" y="130" font-family="Arial, sans-serif" font-size="12" 
              fill="${template.secondaryColor}">
          Block: #${credential.block_number}
        </text>
        
        <!-- Hash Preview -->
        <text x="30" y="150" font-family="Arial, sans-serif" font-size="10" 
              fill="${template.secondaryColor}">
          Hash: ${credential.credential_hash.substring(0, 20)}...
        </text>
        
        <!-- Footer -->
        <rect width="380" height="40" x="10" y="250" fill="rgba(255,255,255,0.9)" rx="5"/>
        <text x="200" y="275" font-family="Arial, sans-serif" font-size="12" font-weight="bold" 
              text-anchor="middle" fill="${template.primaryColor}">
          Blockchain Verified Credential
        </text>
      </svg>
    `;
    return svg;
  }

  private generatePattern(template: CredentialTemplateConfig): string {
    switch (template.pattern) {
      case 'geometric':
        return `
          <pattern id="pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <polygon points="20,5 35,15 35,25 20,35 5,25 5,15" fill="${template.accentColor}"/>
          </pattern>
        `;
      case 'waves':
        return `
          <pattern id="pattern" x="0" y="0" width="60" height="30" patternUnits="userSpaceOnUse">
            <path d="M0,15 Q15,5 30,15 T60,15" stroke="${template.accentColor}" stroke-width="2" fill="none"/>
          </pattern>
        `;
      case 'dots':
        return `
          <pattern id="pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r="3" fill="${template.accentColor}"/>
          </pattern>
        `;
      case 'lines':
        return `
          <pattern id="pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <line x1="0" y1="10" x2="20" y2="10" stroke="${template.accentColor}" stroke-width="1"/>
          </pattern>
        `;
      case 'certificates':
        return `
          <pattern id="pattern" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
            <rect x="15" y="15" width="20" height="15" fill="none" stroke="${template.accentColor}" stroke-width="1"/>
            <line x1="20" y1="20" x2="30" y2="20" stroke="${template.accentColor}" stroke-width="1"/>
            <line x1="20" y1="25" x2="30" y2="25" stroke="${template.accentColor}" stroke-width="1"/>
          </pattern>
        `;
      default:
        return `<pattern id="pattern" x="0" y="0" width="1" height="1" patternUnits="userSpaceOnUse"></pattern>`;
    }
  }
}

export const credentialTemplateService = new CredentialTemplateService();
