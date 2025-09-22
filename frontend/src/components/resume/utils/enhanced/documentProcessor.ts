
/**
 * Document processor module for enhanced resume parsing
 * Handles document preprocessing based on file type
 */
import { v4 as uuidv4 } from 'uuid';
import * as mammoth from 'mammoth';

// Define the metadata type to include processingMethod
export interface DocumentMetadata {
  fileType: string;
  processedAt: string;
  textLength: number;
  processingMethod: string;
  error?: string;
  fallbackReason?: string;
}

// Advanced document processor functionality
export const processDocument = (fileContent: string, fileType: string): { text: string, metadata: DocumentMetadata } => {
  console.log(`Processing document of type: ${fileType} with content length: ${fileContent.length}`);
  
  let text = fileContent;
  let metadata: DocumentMetadata = {
    fileType,
    processedAt: new Date().toISOString(),
    textLength: fileContent.length,
    processingMethod: 'generic-extraction'
  };
  
  // Process based on file type
  if (fileType.includes('pdf')) {
    // For PDF content that comes as text (already extracted client-side)
    text = cleanText(fileContent);
    metadata.processingMethod = 'text-extraction-from-pdf';
  } 
  else if (fileType.includes('word') || fileType.includes('doc')) {
    // For Word document content - enhanced processing to remove XML artifacts
    try {
      text = cleanWordDocument(fileContent);
      metadata.processingMethod = 'text-extraction-from-doc';
      
      // Check if the processed content looks valid
      if (!text || text.length < 20) {
        throw new Error("Insufficient text extracted from Word document");
      }
      
      // Check for binary content indicators even after cleaning
      if (text.includes('PK!') || text.includes('[Content_Types]')) {
        throw new Error("Document appears to be binary format, not text");
      }
    } catch (error) {
      console.error("Error processing Word document:", error);
      text = "";
      metadata.error = error instanceof Error ? error.message : "Unknown processing error";
      metadata.fallbackReason = "Word document processing failed";
    }
  } 
  else if (fileType.includes('text/plain')) {
    // For plain text
    text = cleanText(fileContent);
    metadata.processingMethod = 'text-extraction-from-txt';
  }
  else if (fileType.includes('html')) {
    // For HTML content, strip HTML tags
    text = stripHtml(fileContent);
    metadata.processingMethod = 'html-extraction';
  }
  else {
    // Default case - just clean the text
    text = cleanText(fileContent);
    metadata.processingMethod = 'generic-extraction';
  }
  
  return { text, metadata };
};

// Helper function to clean text similar to the Python implementation
export const cleanText = (text: string): string => {
  if (!text) return "";
  
  // Replace multiple newlines with a single newline
  text = text.replace(/\n\s*\n/g, '\n\n');
  
  // Replace multiple spaces with a single space
  text = text.replace(/ +/g, ' ');
  
  // Remove non-printable characters (adjust as needed for JS)
  text = text.replace(/[^\x20-\x7E\n]/g, '');
  
  return text.trim();
};

// Enhanced helper function specifically for Word documents
export const cleanWordDocument = (content: string): string => {
  if (!content) return "";
  
  // First, check if this is actually Word XML content
  const hasXmlMarkers = content.includes('<?xml') || 
                       content.includes('[Content_Types]') ||
                       content.includes('PK!') ||
                       content.includes('_rels') ||
                       content.includes('docProps');
  
  if (hasXmlMarkers) {
    console.log("Word document contains XML markers, applying specialized cleaning");
    
    // Check if content seems totally corrupted (common with binary DOCX files)
    if (content.length > 1000 && 
        (!content.match(/[a-zA-Z]{5,}/g) || content.match(/[a-zA-Z]{5,}/g)?.length < 10) && 
        (content.includes('PK!') || content.includes('[Content_Types]'))) {
      console.error("DOCX file appears to be corrupted or binary content");
      throw new Error("This Word document appears to be in binary format and cannot be parsed directly. Please save it as PDF first.");
    }
    
    // If we detect a binary DOCX file (which is actually a ZIP archive) 
    // this simple text extraction won't work - fail early
    if (content.substring(0, 200).includes('PK') && !content.substring(0, 5000).includes('<w:p')) {
      console.error("Binary DOCX detected without XML text content, cannot process as text");
      throw new Error("Binary DOCX format detected without extractable text content. Please save as PDF first.");
    }
    
    // Extract text parts that look like actual content
    let textContent = '';
    
    // Try to find paragraphs in Word XML
    const paragraphMatches = content.match(/<w:p[\s\S]*?<\/w:p>/g);
    if (paragraphMatches && paragraphMatches.length > 0) {
      textContent = paragraphMatches
        .map(p => {
          // Get text runs in paragraph
          const textRuns = p.match(/<w:t[\s\S]*?<\/w:t>/g);
          if (textRuns) {
            return textRuns
              .map(t => t.replace(/<w:t[^>]*>([\s\S]*?)<\/w:t>/, '$1'))
              .join(' ');
          }
          return '';
        })
        .filter(p => p.trim().length > 0)
        .join('\n\n');
        
      // If we have very little text, this might not be valid content
      if (textContent.length < 50 && content.length > 10000) {
        console.warn("Very little text extracted from large document, might be corrupted");
      }
    }
    
    // If we found no content with XML parsing but it has XML markers, 
    // it's likely corrupted or a binary file
    if (!textContent && hasXmlMarkers) {
      console.error("Could not extract text from Word XML structure");
      
      // Try one last approach - look for plain text in the mess
      const plainTextMatches = content.match(/[A-Za-z]{5,}[\s\S]{0,10}[A-Za-z]{5,}/g);
      if (plainTextMatches && plainTextMatches.length > 10) {
        textContent = plainTextMatches.join(' ');
      } else {
        throw new Error("Unable to extract text content from this Word document. Please save as PDF and try again.");
      }
    }
    
    // If we have content, return it after cleaning
    if (textContent) {
      return cleanText(textContent);
    }
    
    // Fallback: Try to clean by removing obvious XML/binary artifacts
    let cleaned = content
      .replace(/<\?xml[^>]*>/g, '')
      .replace(/PK![\s\S]*?\.xml/g, '')
      .replace(/\[Content_Types\][\s\S]*?\.xml/g, '')
      .replace(/<w:[\s\S]*?>/g, '')
      .replace(/<\/w:[\s\S]*?>/g, '')
      .replace(/<[\s\S]*?>/g, '\n')
      .replace(/https:\/\/schemas\.openxmlformats\.org[\s\S]*?>/g, '')
      .replace(/https:\/\/document\.xml/g, '')
      .replace(/https:\/\/docProps/g, '');
      
    // Validate that the cleaned content actually looks like text
    // Count word-like structures and non-text characters
    const wordCount = (cleaned.match(/[a-zA-Z]{3,}/g) || []).length;
    const nonTextCharRatio = (cleaned.replace(/[a-zA-Z0-9\s.,;:'"!?()-]/g, '').length / cleaned.length);
    
    if (wordCount < 10 || nonTextCharRatio > 0.3) {
      console.error("Cleaned content still appears to be corrupted");
      throw new Error("Document contains mostly non-text content or binary data. Please save as PDF or use Image upload.");
    }
    
    return cleanText(cleaned);
  }
  
  // For normal text content (not XML), apply standard cleaning
  return cleanText(content);
};

// Helper function to strip HTML tags
export const stripHtml = (html: string): string => {
  if (!html) return "";
  
  // First, replace <br>, <p>, <div> endings with newlines to preserve formatting
  const withLineBreaks = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n');
  
  // Remove all other HTML tags
  const withoutTags = withLineBreaks.replace(/<[^>]*>/g, '');
  
  // Decode HTML entities
  const decoded = withoutTags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  
  // Clean the resulting text
  return cleanText(decoded);
};
