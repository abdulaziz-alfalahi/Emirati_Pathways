
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, 
  Download, 
  FileText, 
  Image, 
  Video, 
  Archive,
  Trash2,
  Share,
  Eye
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
  uploadedBy: string;
  url: string;
  permissions: 'view' | 'edit' | 'admin';
}

interface DocumentSharingProps {
  conversationId: string;
  documents: Document[];
  onUpload: (file: File) => void;
  onDownload: (document: Document) => void;
  onDelete: (documentId: string) => void;
}

export const DocumentSharing: React.FC<DocumentSharingProps> = ({
  conversationId,
  documents,
  onUpload,
  onDownload,
  onDelete
}) => {
  const { toast } = useToast();
  const [dragOver, setDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    setSelectedFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const uploadFiles = () => {
    selectedFiles.forEach(file => {
      onUpload(file);
    });
    setSelectedFiles([]);
    toast({
      title: "Files Uploaded",
      description: `${selectedFiles.length} file(s) uploaded successfully.`
    });
  };

  const getFileIcon = (type: string) => {
    if (type.includes('image')) return <Image className="h-4 w-4" />;
    if (type.includes('video')) return <Video className="h-4 w-4" />;
    if (type.includes('pdf') || type.includes('document')) return <FileText className="h-4 w-4" />;
    if (type.includes('zip') || type.includes('archive')) return <Archive className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Document Sharing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragOver ? 'border-primary bg-primary/10' : 'border-gray-300'
            }`}
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
          >
            <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-600 mb-2">
              Drag and drop files here, or click to select
            </p>
            <Input
              type="file"
              multiple
              onChange={handleFileSelect}
              className="max-w-xs mx-auto"
            />
          </div>
          
          {selectedFiles.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Selected Files:</h4>
              <div className="space-y-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      {getFileIcon(file.type)}
                      <span className="text-sm">{file.name}</span>
                      <Badge variant="outline">{formatFileSize(file.size)}</Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedFiles(files => files.filter((_, i) => i !== index))}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
              <Button onClick={uploadFiles} className="mt-2 w-full">
                Upload {selectedFiles.length} File(s)
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle>Shared Documents</CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No documents shared yet</p>
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getFileIcon(doc.type)}
                    <div>
                      <h4 className="font-medium">{doc.name}</h4>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(doc.size)} • Uploaded by {doc.uploadedBy} • {doc.uploadedAt}
                      </p>
                    </div>
                    <Badge variant="outline">{doc.permissions}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => window.open(doc.url, '_blank')}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => onDownload(doc)}>
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Share className="h-4 w-4" />
                    </Button>
                    {doc.permissions === 'admin' && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => onDelete(doc.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
