
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Share2, Edit } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Portfolio } from "@/types/portfolio";

interface PortfolioHeaderProps {
  portfolio: Portfolio | null;
  isOwnPortfolio: boolean;
  onEdit?: () => void;
}

const PortfolioHeader: React.FC<PortfolioHeaderProps> = ({ 
  portfolio, 
  isOwnPortfolio,
  onEdit 
}) => {
  const { user } = useAuth();
  const [shareModalOpen, setShareModalOpen] = useState(false);
  
  const handleDownloadPDF = () => {
    // PDF export functionality would be implemented here
    console.log("Download PDF");
  };

  const handleShare = () => {
    setShareModalOpen(true);
  };

  if (!portfolio) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Professional Portfolio</h1>
          {portfolio?.resumeData?.personal && (
            <p className="text-muted-foreground mt-1">
              {portfolio.resumeData.personal.fullName} 
              {portfolio.resumeData.personal.jobTitle && ` • ${portfolio.resumeData.personal.jobTitle}`}
            </p>
          )}
        </div>

        <div className="flex gap-2">
          {isOwnPortfolio && onEdit && (
            <Button variant="outline" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Portfolio
            </Button>
          )}
          
          <Button variant="outline" onClick={handleDownloadPDF}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          
          {isOwnPortfolio && (
            <Button variant="outline" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PortfolioHeader;
