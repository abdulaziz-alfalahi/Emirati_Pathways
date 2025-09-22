
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Award } from "lucide-react";
import { Certificate } from "@/types/portfolio";
import { formatDate } from "@/utils/dateFormat";
import { Button } from "@/components/ui/button";

interface CertificationsSectionProps {
  certificates: Certificate[] | undefined;
  isEditable?: boolean;
  onAddCertificate?: () => void;
  onEditCertificate?: (certificate: Certificate) => void;
}

const CertificationsSection: React.FC<CertificationsSectionProps> = ({ 
  certificates, 
  isEditable = false,
  onAddCertificate,
  onEditCertificate
}) => {
  if (!certificates || certificates.length === 0) {
    return (
      <Card className="bg-muted/40">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Award className="h-5 w-5 mr-2" />
              Certifications
            </CardTitle>
            <CardDescription>No certifications available</CardDescription>
          </div>
          
          {isEditable && onAddCertificate && (
            <Button variant="outline" size="sm" onClick={onAddCertificate}>
              Add Certificate
            </Button>
          )}
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center">
            <Award className="h-5 w-5 mr-2" />
            Certifications
          </CardTitle>
          <CardDescription>{certificates.length} certifications</CardDescription>
        </div>
        
        {isEditable && onAddCertificate && (
          <Button variant="outline" size="sm" onClick={onAddCertificate}>
            Add Certificate
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
          {certificates.map((cert) => (
            <div 
              key={cert.id} 
              className="border rounded-lg p-4 hover:border-primary/50 transition-colors relative"
              onClick={() => isEditable && onEditCertificate && onEditCertificate(cert)}
            >
              <h3 className="font-medium">{cert.title}</h3>
              <p className="text-sm">{cert.issuer}</p>
              
              <div className="text-xs text-muted-foreground mt-1">
                Issued: {formatDate(new Date(cert.issue_date))}
                {cert.expiry_date && (
                  <> • Expires: {formatDate(new Date(cert.expiry_date))}</>
                )}
              </div>
              
              {cert.credential_url && (
                <div className="mt-2">
                  <a 
                    href={cert.credential_url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-xs text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View Credential →
                  </a>
                </div>
              )}
              
              {isEditable && (
                <div className="absolute top-2 right-2 text-xs text-muted-foreground">
                  Click to edit
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default CertificationsSection;
