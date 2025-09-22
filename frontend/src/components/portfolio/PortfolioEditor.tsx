
import { useState } from "react";
import { Portfolio, Certificate, Training, PortfolioHighlight } from "@/types/portfolio";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CertificationsSection from "./sections/CertificationsSection";
import TrainingsSection from "./sections/TrainingsSection";
import HighlightsSection from "./sections/HighlightsSection";
import CertificateForm from "./forms/CertificateForm";
import TrainingForm from "./forms/TrainingForm";
import HighlightForm from "./forms/HighlightForm";
import { useToast } from "@/components/ui/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { deleteCertificate, deletePortfolioHighlight, deleteTraining } from "@/services/portfolioService";

interface PortfolioEditorProps {
  portfolio: Portfolio;
  onUpdate: () => void;
}

const PortfolioEditor: React.FC<PortfolioEditorProps> = ({ portfolio, onUpdate }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("certificates");
  
  // Form states
  const [certificateFormOpen, setCertificateFormOpen] = useState(false);
  const [trainingFormOpen, setTrainingFormOpen] = useState(false);
  const [highlightFormOpen, setHighlightFormOpen] = useState(false);
  
  // Edit states
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | undefined>();
  const [selectedTraining, setSelectedTraining] = useState<Training | undefined>();
  const [selectedHighlight, setSelectedHighlight] = useState<PortfolioHighlight | undefined>();
  
  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    type: 'certificate' | 'training' | 'highlight';
    id: string;
    title: string;
  } | null>(null);

  const handleCertificateEdit = (certificate: Certificate) => {
    setSelectedCertificate(certificate);
    setCertificateFormOpen(true);
  };

  const handleTrainingEdit = (training: Training) => {
    setSelectedTraining(training);
    setTrainingFormOpen(true);
  };

  const handleHighlightEdit = (highlight: PortfolioHighlight) => {
    setSelectedHighlight(highlight);
    setHighlightFormOpen(true);
  };

  const handleAddCertificate = () => {
    setSelectedCertificate(undefined);
    setCertificateFormOpen(true);
  };

  const handleAddTraining = () => {
    setSelectedTraining(undefined);
    setTrainingFormOpen(true);
  };

  const handleAddHighlight = () => {
    setSelectedHighlight(undefined);
    setHighlightFormOpen(true);
  };

  const confirmDelete = (type: 'certificate' | 'training' | 'highlight', id: string, title: string) => {
    setItemToDelete({ type, id, title });
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      switch (itemToDelete.type) {
        case 'certificate':
          await deleteCertificate(itemToDelete.id);
          toast({
            title: "Certificate deleted",
            description: `Certificate "${itemToDelete.title}" has been deleted`,
          });
          break;
        case 'training':
          await deleteTraining(itemToDelete.id);
          toast({
            title: "Training deleted",
            description: `Training "${itemToDelete.title}" has been deleted`,
          });
          break;
        case 'highlight':
          await deletePortfolioHighlight(itemToDelete.id);
          toast({
            title: "Highlight deleted",
            description: `Highlight "${itemToDelete.title}" has been deleted`,
          });
          break;
      }
      
      onUpdate();
    } catch (error) {
      console.error(`Error deleting ${itemToDelete.type}:`, error);
      toast({
        title: "Error",
        description: `There was an error deleting this ${itemToDelete.type}`,
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  return (
    <div className="space-y-8">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="certificates">Certifications</TabsTrigger>
          <TabsTrigger value="trainings">Training & Courses</TabsTrigger>
          <TabsTrigger value="highlights">Portfolio Highlights</TabsTrigger>
        </TabsList>
        
        <TabsContent value="certificates" className="space-y-4">
          <CertificationsSection
            certificates={portfolio.certificates}
            isEditable={true}
            onAddCertificate={handleAddCertificate}
            onEditCertificate={handleCertificateEdit}
          />
          
          {portfolio.certificates && portfolio.certificates.length > 0 && (
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-medium mb-2">Manage Certificates</h3>
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                {portfolio.certificates.map((cert) => (
                  <div key={cert.id} className="bg-background p-3 border rounded-md flex justify-between items-center">
                    <div className="truncate">
                      <div className="font-medium truncate">{cert.title}</div>
                      <div className="text-xs text-muted-foreground">{cert.issuer}</div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleCertificateEdit(cert)}
                        className="text-xs px-2 py-1 rounded hover:bg-muted"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => confirmDelete('certificate', cert.id, cert.title)}
                        className="text-xs px-2 py-1 rounded hover:bg-destructive/10 text-destructive"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="trainings" className="space-y-4">
          <TrainingsSection 
            trainings={portfolio.trainings}
            isEditable={true}
            onAddTraining={handleAddTraining}
            onEditTraining={handleTrainingEdit}
          />
          
          {portfolio.trainings && portfolio.trainings.length > 0 && (
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-medium mb-2">Manage Training Records</h3>
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                {portfolio.trainings.map((training) => (
                  <div key={training.id} className="bg-background p-3 border rounded-md flex justify-between items-center">
                    <div className="truncate">
                      <div className="font-medium truncate">{training.title}</div>
                      <div className="text-xs text-muted-foreground">{training.provider}</div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleTrainingEdit(training)}
                        className="text-xs px-2 py-1 rounded hover:bg-muted"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => confirmDelete('training', training.id, training.title)}
                        className="text-xs px-2 py-1 rounded hover:bg-destructive/10 text-destructive"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="highlights" className="space-y-4">
          <HighlightsSection
            highlights={portfolio.highlights}
            isEditable={true}
            onAddHighlight={handleAddHighlight}
            onEditHighlight={handleHighlightEdit}
          />
          
          {portfolio.highlights && portfolio.highlights.length > 0 && (
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-medium mb-2">Manage Portfolio Highlights</h3>
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                {portfolio.highlights.map((highlight) => (
                  <div key={highlight.id} className="bg-background p-3 border rounded-md flex justify-between items-center">
                    <div className="truncate">
                      <div className="font-medium truncate">{highlight.title}</div>
                      <div className="text-xs text-muted-foreground capitalize">{highlight.type}</div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleHighlightEdit(highlight)}
                        className="text-xs px-2 py-1 rounded hover:bg-muted"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => confirmDelete('highlight', highlight.id, highlight.title)}
                        className="text-xs px-2 py-1 rounded hover:bg-destructive/10 text-destructive"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Forms */}
      {certificateFormOpen && (
        <CertificateForm
          certificate={selectedCertificate}
          isOpen={certificateFormOpen}
          onClose={() => setCertificateFormOpen(false)}
          onSuccess={onUpdate}
        />
      )}
      
      {trainingFormOpen && (
        <TrainingForm
          training={selectedTraining}
          isOpen={trainingFormOpen}
          onClose={() => setTrainingFormOpen(false)}
          onSuccess={onUpdate}
        />
      )}
      
      {highlightFormOpen && (
        <HighlightForm
          highlight={selectedHighlight}
          isOpen={highlightFormOpen}
          onClose={() => setHighlightFormOpen(false)}
          onSuccess={onUpdate}
        />
      )}
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the {itemToDelete?.type} "{itemToDelete?.title}".
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PortfolioEditor;
