
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';
import { Link } from 'react-router-dom';

interface AuthenticationRequiredProps {
  message?: string;
  icon?: React.ReactNode;
}

export const AuthenticationRequired: React.FC<AuthenticationRequiredProps> = ({
  message = "Please log in to access this feature",
  icon = <Users className="h-12 w-12 text-muted-foreground mb-4" />
}) => {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        {icon}
        <h3 className="text-lg font-semibold mb-2">Login Required</h3>
        <p className="text-muted-foreground text-center mb-4">
          {message}
        </p>
        <Link to="/auth">
          <Button>Sign In</Button>
        </Link>
      </CardContent>
    </Card>
  );
};
