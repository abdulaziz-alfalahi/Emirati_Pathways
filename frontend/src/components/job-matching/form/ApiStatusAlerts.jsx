
import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react';

export function ApiStatusAlerts({ apiStatus, errorMessage }) {
  if (!apiStatus) return null;
  
  return (
    <>
      {apiStatus === 'success' && (
        <Alert className="bg-green-50 text-green-800 border-green-200">
          <CheckCircle className="h-5 w-5" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>
            OpenAI API is working properly! Job description has been successfully parsed.
          </AlertDescription>
        </Alert>
      )}
      
      {apiStatus === 'error' && (
        <Alert className="bg-red-50 text-red-800 border-red-200">
          <AlertTriangle className="h-5 w-5" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            {errorMessage || 'Error connecting to OpenAI API. Check console for details.'}
            
            {errorMessage && errorMessage.includes('quota') && (
              <div className="mt-2">
                <p className="font-medium">Possible solutions:</p>
                <ul className="list-disc pl-5 mt-1">
                  <li>Check your OpenAI API key billing status</li>
                  <li>Upgrade your OpenAI plan if needed</li>
                  <li>Add payment method to your OpenAI account</li>
                  <li>Generate a new API key if your current one is compromised</li>
                </ul>
                <a 
                  href="https://platform.openai.com/account/billing/overview" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-blue-700 hover:underline mt-2"
                >
                  Visit OpenAI Billing Page <ExternalLink className="ml-1 h-4 w-4" />
                </a>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
    </>
  );
}
