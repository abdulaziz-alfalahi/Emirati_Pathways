
import { Portfolio } from "@/types/portfolio";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PortfolioHeader from "./PortfolioHeader";
import ResumeSection from "./sections/ResumeSection";
import AssessmentsSection from "./sections/AssessmentsSection";
import InterviewsSection from "./sections/InterviewsSection";
import CertificationsSection from "./sections/CertificationsSection";
import TrainingsSection from "./sections/TrainingsSection";
import HighlightsSection from "./sections/HighlightsSection";

interface PortfolioViewerProps {
  portfolio: Portfolio | null;
  isOwnPortfolio: boolean;
  onEdit?: () => void;
}

const PortfolioViewer: React.FC<PortfolioViewerProps> = ({
  portfolio,
  isOwnPortfolio,
  onEdit,
}) => {
  if (!portfolio) {
    return <div>Loading portfolio...</div>;
  }

  return (
    <div className="space-y-8">
      <PortfolioHeader 
        portfolio={portfolio}
        isOwnPortfolio={isOwnPortfolio}
        onEdit={onEdit}
      />
      
      <Tabs defaultValue="resume" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="resume">Resume</TabsTrigger>
          <TabsTrigger value="certificates">Certifications</TabsTrigger>
          <TabsTrigger value="assessments">Assessments</TabsTrigger>
          <TabsTrigger value="interviews">Interviews</TabsTrigger>
          <TabsTrigger value="trainings">Training</TabsTrigger>
          <TabsTrigger value="highlights">Highlights</TabsTrigger>
        </TabsList>
        
        <TabsContent value="resume">
          <ResumeSection resumeData={portfolio.resumeData} />
        </TabsContent>
        
        <TabsContent value="certificates">
          <CertificationsSection certificates={portfolio.certificates} />
        </TabsContent>
        
        <TabsContent value="assessments">
          <AssessmentsSection assessments={portfolio.assessments} />
        </TabsContent>
        
        <TabsContent value="interviews">
          <InterviewsSection interviews={portfolio.interviews} />
        </TabsContent>
        
        <TabsContent value="trainings">
          <TrainingsSection trainings={portfolio.trainings} />
        </TabsContent>
        
        <TabsContent value="highlights">
          <HighlightsSection highlights={portfolio.highlights} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PortfolioViewer;
