import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import { useRole } from '@/context/RoleContext';
import { ProfessionalGrowthLayout } from '@/components/professional-growth/ProfessionalGrowthLayout';
import { Shield, Award, Users, Zap, Eye, Database, FileCheck, Lock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import CredentialCard from '@/components/blockchain/CredentialCard';
import CredentialIssuer from '@/components/blockchain/CredentialIssuer';
import { BlockchainCredential } from '@/types/blockchainCredentials';

const BlockchainCredentialsPage: React.FC = () => {
  const { t } = useTranslation('blockchain-credentials');
  const { user } = useAuth();
  const { activeRole } = useRole();
  const [selectedCredential, setSelectedCredential] = useState<BlockchainCredential | null>(null);

  const isAdmin = activeRole === 'administrator' || activeRole === 'super_user';

  const stats = [
    {
      value: t('stats.verifiedCredentials.value'),
      label: t('stats.verifiedCredentials.label'),
      icon: Shield
    },
    {
      value: t('stats.securityUptime.value'),
      label: t('stats.securityUptime.label'),
      icon: Lock
    },
    {
      value: t('stats.partnerInstitutions.value'),
      label: t('stats.partnerInstitutions.label'),
      icon: Users
    },
    {
      value: t('stats.averageVerificationTime.value'),
      label: t('stats.averageVerificationTime.label'),
      icon: Zap
    }
  ];

  // Mock data for demonstration - updated to match BlockchainCredential interface
  const mockCredentials: BlockchainCredential[] = [
    {
      id: '1',
      recipient_id: user?.id || 'user-1',
      issuer_id: 'issuer-1',
      credential_type: 'certification',
      title: t('mockCredentials.digitalMarketing.title'),
      description: t('mockCredentials.digitalMarketing.description'),
      issued_date: '2024-01-15T00:00:00Z',
      expiry_date: '2026-01-15T00:00:00Z',
      credential_hash: '0x1234...abcd',
      merkle_proof: ['0xabc123', '0xdef456'],
      block_number: 12345,
      transaction_hash: '0x5678...efgh',
      verification_status: 'verified',
      metadata: {
        issuer_name: t('mockCredentials.digitalMarketing.issuer'),
        level: t('mockCredentials.digitalMarketing.level')
      },
      skills: [t('skills.digitalMarketing'), t('skills.seo'), t('skills.socialMedia')],
      created_at: '2024-01-15T00:00:00Z',
      updated_at: '2024-01-15T00:00:00Z'
    },
    {
      id: '2',
      recipient_id: user?.id || 'user-1',
      issuer_id: 'issuer-2',
      credential_type: 'degree',
      title: t('mockCredentials.computerScience.title'),
      description: t('mockCredentials.computerScience.description'),
      issued_date: '2023-06-20T00:00:00Z',
      credential_hash: '0x5678...efgh',
      merkle_proof: ['0xghi789', '0xjkl012'],
      block_number: 11234,
      transaction_hash: '0x9abc...defg',
      verification_status: 'verified',
      metadata: {
        issuer_name: t('mockCredentials.computerScience.issuer'),
        degree: t('mockCredentials.computerScience.degree'),
        major: t('mockCredentials.computerScience.major'),
        gpa: '3.8'
      },
      created_at: '2023-06-20T00:00:00Z',
      updated_at: '2023-06-20T00:00:00Z'
    }
  ];

  const tabs = [
    {
      id: 'my-credentials',
      label: t('tabs.myCredentials.label'),
      icon: <Award className="h-4 w-4" />,
      content: (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {mockCredentials.map((credential) => (
              <CredentialCard
                key={credential.id}
                credential={credential}
                onClick={() => setSelectedCredential(credential)}
              />
            ))}
          </div>
          {mockCredentials.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">{t('tabs.myCredentials.emptyState.title')}</h3>
                <p className="text-muted-foreground mb-4">
                  {t('tabs.myCredentials.emptyState.description')}
                </p>
                <Button>
                  {t('tabs.myCredentials.emptyState.action')}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )
    },
    {
      id: 'verify',
      label: t('tabs.verify.label'),
      icon: <FileCheck className="h-4 w-4" />,
      content: (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                {t('tabs.verify.title')}
              </CardTitle>
              <CardDescription>
                {t('tabs.verify.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">{t('tabs.verify.interface.title')}</h3>
                <p className="text-muted-foreground mb-6">
                  {t('tabs.verify.interface.description')}
                </p>
                <Button>
                  {t('tabs.verify.interface.action')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      id: 'wallet',
      label: t('tabs.wallet.label'),
      icon: <Database className="h-4 w-4" />,
      content: (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                {t('tabs.wallet.title')}
              </CardTitle>
              <CardDescription>
                {t('tabs.wallet.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">{t('tabs.wallet.secure.title')}</h3>
                <p className="text-muted-foreground mb-6">
                  {t('tabs.wallet.secure.description')}
                </p>
                <Button>
                  {t('tabs.wallet.secure.action')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }
  ];

  // Add admin tabs if user is admin
  if (isAdmin) {
    tabs.push({
      id: 'issue',
      label: t('tabs.issue.label'),
      icon: <Award className="h-4 w-4" />,
      content: (
        <div className="space-y-6">
          <CredentialIssuer />
        </div>
      )
    });
  }

  if (!user) {
    return (
      <ProfessionalGrowthLayout
        title={t('title')}
        description={t('description')}
        icon={<Shield className="h-12 w-12 text-white" />}
        stats={stats}
        tabs={[
          {
            id: 'signin',
            label: t('signInRequired.label'),
            icon: <Eye className="h-4 w-4" />,
            content: (
              <div className="text-center py-16">
                <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h1 className="text-3xl font-bold mb-4">{t('signInRequired.title')}</h1>
                <p className="text-lg text-muted-foreground mb-8">
                  {t('signInRequired.description')}
                </p>
                <Button onClick={() => window.location.href = '/auth'} size="lg">
                  {t('signInRequired.action')}
                </Button>
              </div>
            )
          }
        ]}
        defaultTab="signin"
      />
    );
  }

  return (
    <ProfessionalGrowthLayout
      title={t('title')}
      description={t('description')}
      icon={<Shield className="h-12 w-12 text-white" />}
      stats={stats}
      tabs={tabs}
      defaultTab="my-credentials"
    />
  );
};

export default BlockchainCredentialsPage;

