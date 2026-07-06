
import { useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from "@/context/AuthContext";
import { ResumeData, ResumeTemplate } from '../types';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface UseResumeOperationsProps {
  resumeData: ResumeData;
  template: ResumeTemplate;
  resumeTheme: "classic" | "modern" | "minimalist";
}

export const useResumeOperations = ({ 
  resumeData, 
  template, 
  resumeTheme 
}: UseResumeOperationsProps) => {
  const { user } = useAuth();
  const [currentResumeId, setCurrentResumeId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const saveResume = async () => {
    if (!user) {
      toast.warning("Authentication required", {
        description: "Please log in to save your resume to the cloud",
      });
      return;
    }

    setIsSaving(true);
    try {
      let resumeId = currentResumeId;

      if (!resumeId) {
        const resumeTitle = resumeData.personal.fullName ? 
          `${resumeData.personal.fullName}'s Resume` : 'My Resume';
          
        const { data: newResumeData, error: resumeError } = await supabase
          .from('resumes')
          .insert({
            user_id: user.id,
            title: resumeTitle,
            template_id: template.id,
            theme: resumeTheme
          })
          .select('id')
          .single();

        if (resumeError) throw resumeError;
        resumeId = newResumeData.id;
        setCurrentResumeId(resumeId);
      } else {
        const resumeTitle = resumeData.personal.fullName ? 
          `${resumeData.personal.fullName}'s Resume` : 'My Resume';
          
        const { error: updateError } = await supabase
          .from('resumes')
          .update({
            title: resumeTitle,
            template_id: template.id,
            theme: resumeTheme,
            updated_at: new Date().toISOString()
          })
          .eq('id', resumeId);

        if (updateError) throw updateError;
      }

      const { data: existingData, error: checkError } = await supabase
        .from('resume_data')
        .select('id')
        .eq('resume_id', resumeId)
        .maybeSingle();

      if (checkError) throw checkError;

      // Ensure metadata is included in the saved data
      const resumeDataWithMetadata = {
        ...resumeData,
        metadata: {
          ...(resumeData.metadata || {}),
          lastSaved: new Date().toISOString()
        }
      };

      const resumeDataAsJson = resumeDataWithMetadata as unknown as any;

      if (existingData) {
        const { error: dataUpdateError } = await supabase
          .from('resume_data')
          .update({
            data: resumeDataAsJson,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingData.id);

        if (dataUpdateError) throw dataUpdateError;
      } else {
        const { error: dataInsertError } = await supabase
          .from('resume_data')
          .insert({
            resume_id: resumeId,
            data: resumeDataAsJson
          });

        if (dataInsertError) throw dataInsertError;
      }

      toast.success("Resume Saved", {
        description: "Your resume has been saved successfully!"
      });
    } catch (error) {
      console.error('Error saving resume:', error);
      toast.error("Error Saving Resume", {
        description: "There was a problem saving your resume. Please try again."
      });
    } finally {
      setIsSaving(false);
    }
  };

  const downloadResume = () => {
    const filename = `${resumeData.personal.fullName.replace(/\s+/g, '_') || 'resume'}_resume.json`;
    const jsonStr = JSON.stringify(resumeData, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Resume Downloaded", {
      description: "Your resume has been downloaded as JSON"
    });
  };

  const exportToPdf = async (previewRef: React.RefObject<HTMLDivElement>, setIsPreviewOpen: (open: boolean) => void) => {
    setIsExporting(true);
    try {
      setIsPreviewOpen(true);
      
      setTimeout(async () => {
        const resumeElement = document.querySelector('.resume-preview-wrapper');
        if (!resumeElement) {
          throw new Error('Resume preview not found');
        }

        try {
          const canvas = await html2canvas(resumeElement as HTMLElement, {
            scale: 2,
            useCORS: true,
            logging: false
          });
          
          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
          });
          
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();
          const imgWidth = canvas.width;
          const imgHeight = canvas.height;
          const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
          
          const imgX = (pdfWidth - imgWidth * ratio) / 2;
          const imgY = 0;
          
          pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
          
          const filename = `${resumeData.personal.fullName.replace(/\s+/g, '_') || 'resume'}_resume.pdf`;
          pdf.save(filename);
          
          toast.success("PDF Export Complete", {
            description: `${filename} has been downloaded`
          });
        } catch (error) {
          console.error('PDF generation error:', error);
          throw error;
        }
      }, 1000);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      toast.error("PDF Export Failed", {
        description: "There was a problem exporting your resume to PDF."
      });
    } finally {
      setIsExporting(false);
    }
  };

  return {
    saveResume,
    downloadResume,
    exportToPdf,
    isSaving,
    isExporting,
    currentResumeId
  };
};
