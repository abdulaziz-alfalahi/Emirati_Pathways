
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { User } from 'lucide-react';

const NoRoleAlert: React.FC = () => {
  return (
    <Alert className="mb-4">
      <User className="h-4 w-4" />
      <AlertTitle>No role assigned</AlertTitle>
      <AlertDescription>
        Your account doesn't have any roles assigned. For testing purposes, we'll show you the student dashboard.
      </AlertDescription>
    </Alert>
  );
};

export default NoRoleAlert;
