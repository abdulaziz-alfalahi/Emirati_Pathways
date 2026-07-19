
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Image, Table, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ExportManagerProps {
  data: any;
  chartRefs: React.RefObject<HTMLDivElement>[];
  selectedFilters: {
    emirate: string;
    sector: string;
    timeframe: string;
  };
}

export const ExportManager: React.FC<ExportManagerProps> = ({ 
  data, 
  chartRefs, 
  selectedFilters 
}) => {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'png' | 'csv' | 'excel'>('pdf');

  const exportFormats = [
    { value: 'pdf', label: 'PDF Report', icon: FileText, description: 'Complete report with charts' },
    { value: 'png', label: 'PNG Images', icon: Image, description: 'Individual chart images' },
    { value: 'csv', label: 'CSV Data', icon: Table, description: 'Raw data export' },
    { value: 'excel', label: 'Excel Report', icon: Table, description: 'Structured data with charts' }
  ];

  const convertToCSV = (data: any[], filename: string) => {
    if (!data.length) return '';
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
      Object.values(row).map(value => 
        typeof value === 'string' ? `"${value}"` : value
      ).join(',')
    ).join('\n');
    
    return `${headers}\n${rows}`;
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const captureChart = async (chartRef: React.RefObject<HTMLDivElement>, filename: string) => {
    if (!chartRef.current) return null;
    
    try {
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true
      });
      
      if (exportFormat === 'png') {
        const link = document.createElement('a');
        link.download = `${filename}.png`;
        link.href = canvas.toDataURL();
        link.click();
      }
      
      return canvas;
    } catch (error) {
      console.error('Error capturing chart:', error);
      return null;
    }
  };

  const exportToPDF = async () => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 20;

    // Add title
    pdf.setFontSize(20);
    pdf.text('UAE Workforce Analytics Report', 20, yPosition);
    yPosition += 15;

    // Add filters info
    pdf.setFontSize(12);
    pdf.text(`Emirates: ${selectedFilters.emirate}`, 20, yPosition);
    yPosition += 7;
    pdf.text(`Sector: ${selectedFilters.sector}`, 20, yPosition);
    yPosition += 7;
    pdf.text(`Timeframe: ${selectedFilters.timeframe}`, 20, yPosition);
    yPosition += 7;
    pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 20, yPosition);
    yPosition += 15;

    // Capture and add charts
    for (let i = 0; i < chartRefs.length; i++) {
      const canvas = await captureChart(chartRefs[i], `chart-${i}`);
      if (canvas) {
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pageWidth - 40;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        if (yPosition + imgHeight > pageHeight - 20) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.addImage(imgData, 'PNG', 20, yPosition, imgWidth, imgHeight);
        yPosition += imgHeight + 10;
      }
    }

    pdf.save(`uae-workforce-analytics-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportToCSV = () => {
    const datasets = [
      { name: 'skills-data', data: data.skillsData || [] },
      { name: 'education-data', data: data.educationData || [] },
      { name: 'sectors-data', data: data.sectorsData || [] },
      { name: 'emiratization-trends', data: data.emiratizationTrends || [] }
    ];

    datasets.forEach(dataset => {
      if (dataset.data.length > 0) {
        const csv = convertToCSV(dataset.data, dataset.name);
        downloadFile(csv, `${dataset.name}-${selectedFilters.timeframe}.csv`, 'text/csv');
      }
    });
  };

  const exportToExcel = async () => {
    // For simplicity, we'll export as multiple CSV files
    // In a real implementation, you'd use a library like xlsx
    exportToCSV();
    
    toast({
      title: "Excel Export",
      description: "Data exported as CSV files. Consider using xlsx library for true Excel format.",
    });
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      switch (exportFormat) {
        case 'pdf':
          await exportToPDF();
          break;
        case 'png':
          for (let i = 0; i < chartRefs.length; i++) {
            await captureChart(chartRefs[i], `uae-workforce-chart-${i + 1}`);
          }
          break;
        case 'csv':
          exportToCSV();
          break;
        case 'excel':
          await exportToExcel();
          break;
      }

      toast({
        title: "Export Successful",
        description: `Report exported as ${exportFormat.toUpperCase()} successfully.`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Export Reports
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exportFormats.map((format) => (
            <div
              key={format.value}
              className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                exportFormat === format.value 
                  ? 'border-primary bg-primary/5' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setExportFormat(format.value as any)}
            >
              <div className="flex items-center gap-3">
                <format.icon className="h-5 w-5" />
                <div>
                  <h4 className="font-medium">{format.label}</h4>
                  <p className="text-sm text-muted-foreground">{format.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Current filters:</span>
          <Badge variant="outline">{selectedFilters.emirate}</Badge>
          <Badge variant="outline">{selectedFilters.sector}</Badge>
          <Badge variant="outline">{selectedFilters.timeframe}</Badge>
        </div>

        <Button 
          onClick={handleExport} 
          disabled={isExporting}
          className="w-full"
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 me-2 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 me-2" />
              Export as {exportFormat.toUpperCase()}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
