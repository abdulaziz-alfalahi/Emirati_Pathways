
import React from 'react';
import { Wallet } from 'lucide-react';

const WalletEmptyState: React.FC = () => {
  return (
    <div className="text-center py-8 text-muted-foreground">
      <Wallet className="mx-auto h-12 w-12 mb-4 opacity-50" />
      <p>No credentials in your wallet yet</p>
      <p className="text-sm">Credentials you receive will appear here</p>
    </div>
  );
};

export default WalletEmptyState;
