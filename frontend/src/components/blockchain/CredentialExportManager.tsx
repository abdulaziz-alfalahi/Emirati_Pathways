
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  credentialExportService, 
  ExportFormat, 
  CredentialExport 
} from '@/services/blockchain/credentialExportService';
import { BlockchainCredential } from '@/types/blockchainCredentials';
import { Download, FileText, Calendar, ExternalLink } from 'lucide-react';

interface CredentialExportManagerProps {
  credential: BlockchainCredential;
  userId: string;
}

const CredentialExportManager: React.FC<CredentialExportManagerProps> = ({
  credential,
  userId
}) => {
  const { toast } = useToast();
  const [formats, setFormats] = useState<ExportFormat[]>([]);
  const [exports, setExports] = useState<CredentialExport[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadFormats();
    loadExports();
  }, []);

  const loadFormats = async () => {
    try {
      const data = await credentialExportService.getAvailableFormats();
      setFormats(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load export formats",
        variant: "destructive"
      });
    }
  };

  const loadExports = async () => {
    try {
      const data = await credentialExportService.getUserExports(userId);
      setExports(data.filter(exp => exp.credential_id === credential.id));
    } catch (error) {
      console.error('Failed to load exports:', error);
    }
  };

  const handleExport = async (formatId: string) => {
    setIsLoading(true);
    try {
      const exportRecord = await credentialExportService.exportCredential(credential, formatId, userId);
      toast({
        title: "Export Created",
        description: "Credential export created successfully"
      });
      loadExports();
      
      // Auto-download the export
      const exportedData = await credentialExportService.downloadExport(exportRecord.access_token);
      const format = formats.find(f => f.id === formatId);
      downloadFile(exportedData, `credential-${credential.title}`, format?.file_extension || 'json');
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export credential",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadFile = (data: any, filename: string, extension: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadExisting = async (accessToken: string, formatName: string) => {
    try {
      const data = await credentialExportService.downloadExport(accessToken);
      const format = formats.find(f => f.format_name === formatName);
      downloadFile(data, `credential-${credential.title}`, format?.file_extension || 'json');
      loadExports(); // Refresh to update download count
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download export",
        variant: "destructive"
      });
    }
  };

  const getFormatIcon = (formatName: string) => {
    switch (formatName) {
      case 'pdf_standard': return '📄';
      case 'open_badges': return '🏆';
      case 'europass': return '🇪🇺';
      case 'json_ld': return '🔗';
      default: return '📋';
    }
  };

  const getFormatDescription = (formatName: string) => {
    switch (formatName) {
      case 'pdf_standard': return 'Standard PDF certificate format';
      case 'open_badges': return 'Open Badges 3.0 standard format';
      case 'europass': return 'European Europass credential format';
      case 'json_ld': return 'JSON-LD verifiable credential format';
      default: return 'Standard export format';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Download className="mr-2 h-5 w-5" />
            Export Credential
          </CardTitle>
          <CardDescription>
            Export your credential in various standardized formats for interoperability
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {formats.map((format) => (
              <Card key={format.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">{getFormatIcon(format.format_name)}</span>
                        <div>
                          <h4 className="font-medium">{format.format_name.replace('_', ' ').toUpperCase()}</h4>
                          <Badge variant="outline">v{format.format_version}</Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {getFormatDescription(format.format_name)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleExport(format.id)}
                      disabled={isLoading}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {exports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Previous Exports
            </CardTitle>
            <CardDescription>
              Your previously exported credential files
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {exports.map((exportRecord) => {
                const format = formats.find(f => f.id === exportRecord.export_format_id);
                const isExpired = exportRecord.expires_at && new Date(exportRecord.expires_at) < new Date();
                
                return (
                  <div key={exportRecord.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getFormatIcon(format?.format_name || '')}</span>
                        <span className="font-medium">
                          {format?.format_name.replace('_', ' ').toUpperCase()}
                        </span>
                        {isExpired && <Badge variant="destructive">Expired</Badge>}
                      </div>
                      <div className="text-sm text-muted-foreground space-x-4">
                        <span className="flex items-center">
                          <Calendar className="mr-1 h-3 w-3" />
                          {new Date(exportRecord.created_at).toLocaleDateString()}
                        </span>
                        <span>Downloads: {exportRecord.downloaded_count}</span>
                        {exportRecord.expires_at && (
                          <span>Expires: {new Date(exportRecord.expires_at).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {!isExpired && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadExisting(exportRecord.access_token, format?.format_name || '')}
                        >
                          <Download className="mr-1 h-3 w-3" />
                          Download
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CredentialExportManager;
