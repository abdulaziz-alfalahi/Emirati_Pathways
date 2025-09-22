
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ExportOptions {
  format: 'pdf' | 'png' | 'json';
  filename?: string;
}

class ExportService {
  async exportJourneyMap(elementRef: HTMLElement | null, data: any, options: ExportOptions): Promise<void> {
    if (!elementRef) {
      throw new Error('Element reference is required for export');
    }

    const filename = options.filename || `career-journey-${new Date().toISOString().split('T')[0]}`;

    switch (options.format) {
      case 'pdf':
        await this.exportToPDF(elementRef, filename);
        break;
      case 'png':
        await this.exportToPNG(elementRef, filename);
        break;
      case 'json':
        this.exportToJSON(data, filename);
        break;
      default:
        throw new Error('Unsupported export format');
    }
  }

  private async exportToPDF(element: HTMLElement, filename: string): Promise<void> {
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 297; // A4 landscape width in mm
      const pageHeight = 210; // A4 landscape height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${filename}.pdf`);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      throw new Error('Failed to export as PDF');
    }
  }

  private async exportToPNG(element: HTMLElement, filename: string): Promise<void> {
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true
      });

      const link = document.createElement('a');
      link.download = `${filename}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (error) {
      console.error('Error exporting to PNG:', error);
      throw new Error('Failed to export as PNG');
    }
  }

  private exportToJSON(data: any, filename: string): void {
    try {
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.download = `${filename}.json`;
      link.href = url;
      link.click();
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting to JSON:', error);
      throw new Error('Failed to export as JSON');
    }
  }
}

export const exportService = new ExportService();
