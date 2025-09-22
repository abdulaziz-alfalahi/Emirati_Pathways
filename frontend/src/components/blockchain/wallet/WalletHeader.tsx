
import React from 'react';
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Wallet } from 'lucide-react';

const WalletHeader: React.FC = () => {
  return (
    <CardHeader>
      <CardTitle className="flex items-center">
        <Wallet className="mr-2 h-5 w-5" />
        Digital Wallet
      </CardTitle>
      <CardDescription>
        Your secure blockchain credentials wallet
      </CardDescription>
    </CardHeader>
  );
};

export default WalletHeader;
