
import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye, Save, FileOutput } from "lucide-react";

interface ResumeBuilderHeaderProps {
  onBack: () => void;
  onPreview: () => void;
  onExport: () => void;
  onSave: () => void;
  isExporting: boolean;
  isSaving: boolean;
}

const ResumeBuilderHeader: React.FC<ResumeBuilderHeaderProps> = ({
  onBack,
  onPreview,
  onExport,
  onSave,
  isExporting,
  isSaving
}) => {
  return (
    <div className="flex items-center justify-between p-4 border-b bg-background">
      <Button variant="ghost" onClick={onBack}>
        <ArrowLeft size={16} className="me-2" />
        Back
      </Button>
      
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          onClick={onPreview}
        >
          <Eye size={16} className="me-2" />
          Preview
        </Button>
        
        <Button 
          variant="outline" 
          onClick={onExport}
          disabled={isExporting}
        >
          <FileOutput size={16} className="me-2" />
          {isExporting ? 'Exporting...' : 'Export PDF'}
        </Button>
        
        <Button 
          variant="default" 
          onClick={onSave}
          disabled={isSaving}
        >
          <Save size={16} className="me-2" />
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </div>
  );
};

export default ResumeBuilderHeader;
