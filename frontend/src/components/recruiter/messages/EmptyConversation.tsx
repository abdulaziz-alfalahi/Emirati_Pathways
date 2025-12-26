/**
 * EmptyConversation Component
 * Displays a placeholder when no conversation is selected
 * 
 * @description This component is shown when the user has not selected
 * any conversation from the list, prompting them to make a selection.
 */

import React from 'react';
import { MessageSquare } from 'lucide-react';

const EmptyConversation: React.FC = () => {
  return (
    <div 
      className="flex items-center justify-center h-full p-6"
      role="status"
      aria-label="No conversation selected"
    >
      <div className="text-center">
        <MessageSquare 
          className="h-12 w-12 mx-auto text-muted-foreground" 
          aria-hidden="true"
        />
        <h3 className="mt-4 text-lg font-medium">No conversation selected</h3>
        <p className="mt-2 text-muted-foreground">
          Select a conversation from the list to start messaging.
        </p>
      </div>
    </div>
  );
};

export default EmptyConversation;
