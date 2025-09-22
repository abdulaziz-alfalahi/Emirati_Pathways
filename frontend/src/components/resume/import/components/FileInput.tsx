
import React, { forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface FileInputProps {
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled: boolean;
}

export const FileInput = forwardRef<HTMLInputElement, FileInputProps>(
  ({ onChange, disabled }, ref) => {
    return (
      <div className="space-y-2">
        <Label htmlFor="resume-file">Select a file to upload</Label>
        <Input
          id="resume-file"
          type="file"
          ref={ref}
          accept=".pdf,.doc,.docx,.txt,.rtf"
          onChange={onChange}
          disabled={disabled}
        />
        <p className="text-xs text-muted-foreground mt-1">
          PDF files work best. We now have improved support for Word documents.
        </p>
      </div>
    );
  }
);

FileInput.displayName = 'FileInput';
