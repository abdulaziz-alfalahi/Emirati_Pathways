
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Users, Lock, Link, Copy } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Portfolio } from "@/types/portfolio";

interface PortfolioVisibilityProps {
  portfolio: Portfolio;
  // In a full implementation, we would have functions to update visibility settings
  // This is a simplified version
}

const PortfolioVisibility: React.FC<PortfolioVisibilityProps> = ({ portfolio }) => {
  const [isPublic, setIsPublic] = useState(false);
  const [allowRecruiters, setAllowRecruiters] = useState(true);
  const [allowAdvisors, setAllowAdvisors] = useState(true);
  
  const portfolioUrl = `${window.location.origin}/portfolio/${portfolio.userId}`;
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(portfolioUrl);
    toast({
      title: "Link copied",
      description: "Portfolio link copied to clipboard",
    });
  };
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Portfolio Visibility</h2>
      
      <Card>
        <CardHeader>
          <CardTitle>Public Access</CardTitle>
          <CardDescription>Control who can view your professional portfolio</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="public-visibility">Public portfolio</Label>
              <p className="text-sm text-muted-foreground">
                Make your portfolio visible to anyone with the link
              </p>
            </div>
            <Switch
              id="public-visibility"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="recruiter-visibility">Visible to recruiters</Label>
              <p className="text-sm text-muted-foreground">
                Allow recruiters to discover and view your portfolio
              </p>
            </div>
            <Switch
              id="recruiter-visibility"
              checked={allowRecruiters}
              onCheckedChange={setAllowRecruiters}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="advisor-visibility">Visible to advisors</Label>
              <p className="text-sm text-muted-foreground">
                Allow career advisors and coaches to view your portfolio
              </p>
            </div>
            <Switch
              id="advisor-visibility"
              checked={allowAdvisors}
              onCheckedChange={setAllowAdvisors}
            />
          </div>
          
          <div className="pt-4 border-t">
            <h3 className="text-lg font-medium mb-3">Portfolio Link</h3>
            <div className="flex gap-2">
              <div className="relative flex-grow">
                <Input 
                  value={portfolioUrl}
                  readOnly
                  className="pl-9"
                />
                <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              <Button onClick={handleCopyLink} variant="outline" size="icon">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Current Visibility</CardTitle>
          <CardDescription>Who can currently see your portfolio</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3 p-3 border rounded-md bg-background">
            <div className="bg-primary/10 p-2 rounded-full">
              <Search className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-medium">Public Search</h4>
              <p className="text-sm text-muted-foreground">
                {isPublic ? "Your portfolio can be found via search engines" : "Your portfolio is not indexed by search engines"}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 border rounded-md bg-background">
            <div className="bg-primary/10 p-2 rounded-full">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-medium">Recruiters & Companies</h4>
              <p className="text-sm text-muted-foreground">
                {allowRecruiters ? "Recruiters can discover your profile" : "Recruiters cannot discover your profile"}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 border rounded-md bg-background">
            <div className="bg-primary/10 p-2 rounded-full">
              <Lock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-medium">Direct Access</h4>
              <p className="text-sm text-muted-foreground">
                Anyone with the link can access your portfolio {isPublic ? "without restrictions" : "if they are authorized"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PortfolioVisibility;
