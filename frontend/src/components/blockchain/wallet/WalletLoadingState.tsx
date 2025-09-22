
import React from 'react';

const WalletLoadingState: React.FC = () => {
  return (
    <div className="text-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
      <p className="mt-2 text-muted-foreground">Loading your credentials...</p>
    </div>
  );
};

export default WalletLoadingState;
