
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Download, FileText, Image, Code } from 'lucide-react';
import { exportService } from '@/services/exportService';

interface ExportJourneyDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  elementRef: React.RefObject<HTMLDivElement>;
  journeyData: any;
}

const ExportJourneyDialog: React.FC<ExportJourneyDialogProps> = ({
  isOpen,
  onOpenChange,
  elementRef,
  journeyData
}) => {
  const [format, setFormat] = useState<'pdf' | 'png' | 'json'>('pdf');
  const [filename, setFilename] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!elementRef.current) {
      console.error('Element reference not available');
      return;
    }

    setIsExporting(true);
    try {
      await exportService.exportJourneyMap(elementRef.current, journeyData, {
        format,
        filename: filename || undefined
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const formatOptions = [
    {
      value: 'pdf' as const,
      label: 'PDF Document',
      description: 'High-quality document for printing or sharing',
      icon: FileText
    },
    {
      value: 'png' as const,
      label: 'PNG Image',
      description: 'High-resolution image for presentations',
      icon: Image
    },
    {
      value: 'json' as const,
      label: 'JSON Data',
      description: 'Raw data for backup or integration',
      icon: Code
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Journey Map
          </DialogTitle>
          <DialogDescription>
            Choose your preferred export format and customize the filename.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="filename">Filename (optional)</Label>
            <Input
              id="filename"
              placeholder="career-journey-map"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
            />
          </div>

          <div>
            <Label>Export Format</Label>
            <RadioGroup value={format} onValueChange={(value: any) => setFormat(value)}>
              {formatOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <div key={option.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={option.value} id={option.value} />
                    <Label htmlFor={option.value} className="flex items-center gap-2 cursor-pointer">
                      <Icon className="h-4 w-4" />
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-sm text-muted-foreground">{option.description}</div>
                      </div>
                    </Label>
                  </div>
                );
              })}
            </RadioGroup>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <div className="animate-spin me-2 h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="me-2 h-4 w-4" />
                Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportJourneyDialog;
