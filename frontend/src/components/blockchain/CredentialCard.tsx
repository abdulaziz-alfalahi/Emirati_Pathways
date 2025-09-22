
import React from 'react';
import { BlockchainCredential } from '@/types/blockchainCredentials';
import CredentialTemplate from './CredentialTemplate';

interface CredentialCardProps {
  credential: BlockchainCredential;
  onClick?: () => void;
}

const CredentialCard: React.FC<CredentialCardProps> = ({ credential, onClick }) => {
  return (
    <div onClick={onClick} className="cursor-pointer">
      <CredentialTemplate credential={credential} variant="card" />
    </div>
  );
};

export default CredentialCard;
