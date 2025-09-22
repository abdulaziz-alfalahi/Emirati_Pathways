
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { DubaiCard, DubaiCardHeader, DubaiCardTitle, DubaiCardContent } from '@/components/ui/dubai-card';
import { 
  Download, 
  Save, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Share,
  Settings,
  Upload,
  Send,
  RefreshCw
} from 'lucide-react';

export const ButtonShowcase: React.FC = () => {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const handleLoadingDemo = (buttonId: string) => {
    setLoadingStates(prev => ({ ...prev, [buttonId]: true }));
    setTimeout(() => {
      setLoadingStates(prev => ({ ...prev, [buttonId]: false }));
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-ehrdc-neutral-light/30 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-ehrdc-neutral-dark mb-2">
            Dubai Government Button System
          </h1>
          <p className="text-ehrdc-neutral-dark/70">
            Standardized button components following Dubai Government design patterns
          </p>
        </div>

        {/* Button Variants */}
        <section>
          <DubaiCard>
            <DubaiCardHeader>
              <DubaiCardTitle>Button Variants</DubaiCardTitle>
            </DubaiCardHeader>
            <DubaiCardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-ehrdc-neutral-dark">Primary</h3>
                  <div className="space-y-3">
                    <Button variant="default">
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                    <Button variant="default" size="sm">Small Button</Button>
                    <Button variant="default" size="lg">Large Button</Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-ehrdc-neutral-dark">Secondary</h3>
                  <div className="space-y-3">
                    <Button variant="secondary">
                      <Save className="h-4 w-4" />
                      Save Draft
                    </Button>
                    <Button variant="secondary" size="sm">Cancel</Button>
                    <Button variant="secondary" size="lg">Save Changes</Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-ehrdc-neutral-dark">Outline</h3>
                  <div className="space-y-3">
                    <Button variant="outline">
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button variant="outline" size="sm">View Details</Button>
                    <Button variant="outline" size="lg">Learn More</Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-ehrdc-neutral-dark">Text</h3>
                  <div className="space-y-3">
                    <Button variant="ghost">
                      <Eye className="h-4 w-4" />
                      Preview
                    </Button>
                    <Button variant="link">Terms & Conditions</Button>
                    <Button variant="ghost" size="sm">Skip</Button>
                  </div>
                </div>
              </div>
            </DubaiCardContent>
          </DubaiCard>
        </section>

        {/* Contextual Variants */}
        <section>
          <DubaiCard>
            <DubaiCardHeader>
              <DubaiCardTitle>Contextual Variants</DubaiCardTitle>
            </DubaiCardHeader>
            <DubaiCardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-green-700">Success</h3>
                  <div className="space-y-3">
                    <Button variant="success">
                      <Send className="h-4 w-4" />
                      Submit Application
                    </Button>
                    <Button variant="success" size="sm">Approve</Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-orange-700">Warning</h3>
                  <div className="space-y-3">
                    <Button variant="warning">
                      <Upload className="h-4 w-4" />
                      Replace File
                    </Button>
                    <Button variant="warning" size="sm">Update</Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-red-700">Destructive</h3>
                  <div className="space-y-3">
                    <Button variant="destructive">
                      <Trash2 className="h-4 w-4" />
                      Delete Account
                    </Button>
                    <Button variant="destructive" size="sm">Remove</Button>
                  </div>
                </div>
              </div>
            </DubaiCardContent>
          </DubaiCard>
        </section>

        {/* Icon Buttons */}
        <section>
          <DubaiCard>
            <DubaiCardHeader>
              <DubaiCardTitle>Icon Buttons</DubaiCardTitle>
            </DubaiCardHeader>
            <DubaiCardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-ehrdc-neutral-dark">Default Size</h3>
                  <div className="flex gap-3">
                    <Button variant="default" size="icon">
                      <Search className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button variant="secondary" size="icon">
                      <Share className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-ehrdc-neutral-dark">Small</h3>
                  <div className="flex gap-3">
                    <Button variant="default" size="icon-sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon-sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="secondary" size="icon-sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-ehrdc-neutral-dark">Large</h3>
                  <div className="flex gap-3">
                    <Button variant="default" size="icon-lg">
                      <Download className="h-5 w-5" />
                    </Button>
                    <Button variant="outline" size="icon-lg">
                      <Upload className="h-5 w-5" />
                    </Button>
                    <Button variant="secondary" size="icon-lg">
                      <RefreshCw className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </DubaiCardContent>
          </DubaiCard>
        </section>

        {/* Button States */}
        <section>
          <DubaiCard>
            <DubaiCardHeader>
              <DubaiCardTitle>Button States</DubaiCardTitle>
            </DubaiCardHeader>
            <DubaiCardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-ehrdc-neutral-dark">Loading States</h3>
                  <div className="space-y-3">
                    <Button 
                      variant="default" 
                      loading={loadingStates.primary}
                      loadingText="Processing..."
                      onClick={() => handleLoadingDemo('primary')}
                    >
                      Submit Form
                    </Button>
                    <Button 
                      variant="outline" 
                      loading={loadingStates.secondary}
                      onClick={() => handleLoadingDemo('secondary')}
                    >
                      Save Draft
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-ehrdc-neutral-dark">Disabled States</h3>
                  <div className="space-y-3">
                    <Button variant="default" disabled>
                      <Download className="h-4 w-4" />
                      Download Disabled
                    </Button>
                    <Button variant="outline" disabled>
                      Edit Disabled
                    </Button>
                    <Button variant="secondary" disabled>
                      Save Disabled
                    </Button>
                  </div>
                </div>
              </div>
            </DubaiCardContent>
          </DubaiCard>
        </section>

        {/* Button Groups */}
        <section>
          <DubaiCard>
            <DubaiCardHeader>
              <DubaiCardTitle>Button Groups</DubaiCardTitle>
            </DubaiCardHeader>
            <DubaiCardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-ehrdc-neutral-dark mb-3">Horizontal Group</h3>
                  <ButtonGroup>
                    <Button variant="outline">Previous</Button>
                    <Button variant="outline">1</Button>
                    <Button variant="default">2</Button>
                    <Button variant="outline">3</Button>
                    <Button variant="outline">Next</Button>
                  </ButtonGroup>
                </div>

                <div>
                  <h3 className="font-semibold text-ehrdc-neutral-dark mb-3">Vertical Group</h3>
                  <ButtonGroup orientation="vertical">
                    <Button variant="outline">
                      <Download className="h-4 w-4" />
                      Download PDF
                    </Button>
                    <Button variant="outline">
                      <Share className="h-4 w-4" />
                      Share Link
                    </Button>
                    <Button variant="outline">
                      <Send className="h-4 w-4" />
                      Send Email
                    </Button>
                  </ButtonGroup>
                </div>
              </div>
            </DubaiCardContent>
          </DubaiCard>
        </section>
      </div>
    </div>
  );
};
