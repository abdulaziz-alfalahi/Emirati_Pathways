
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plane } from 'lucide-react';

interface EmptyStateProps {
  type: "available" | "registered" | "managed";
}

const EmptyState: React.FC<EmptyStateProps> = ({ type }) => {
  const messages = {
    available: {
      title: "No Aviation Camps Available",
      description: "There are no aviation summer camps available matching your filter criteria."
    },
    registered: {
      title: "Not Registered for Any Aviation Camps",
      description: "You haven't registered for any aviation camps yet. Browse available camps to find one that interests you."
    },
    managed: {
      title: "No Managed Aviation Camps",
      description: "You don't have any aviation camps set up yet. Create your first camp to start managing registrations."
    }
  };

  // Updated to use the teal color from the EHRDC logo
  return (
    <Card className="bg-white border border-gov-lightGray shadow-gov">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto bg-gov-ehrdc-light w-12 h-12 flex items-center justify-center rounded-full mb-4">
          <Plane className="h-6 w-6 text-gov-teal" />
        </div>
        <CardTitle className="text-gov-black font-gov">{messages[type].title}</CardTitle>
        <CardDescription className="text-gov-darkGray">{messages[type].description}</CardDescription>
      </CardHeader>
      <CardContent className="text-center pt-2">
        {type === "managed" && (
          <p className="text-sm text-gov-mediumGray">
            Click "Create New Camp" to set up your first educational aviation program.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default EmptyState;
