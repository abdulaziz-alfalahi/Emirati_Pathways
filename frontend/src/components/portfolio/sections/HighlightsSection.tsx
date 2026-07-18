
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PortfolioHighlight } from "@/types/portfolio";
import { formatDate } from "@/utils/dateFormat";
import { Button } from "@/components/ui/button";

interface HighlightsSectionProps {
  highlights: PortfolioHighlight[] | undefined;
  isEditable?: boolean;
  onAddHighlight?: () => void;
  onEditHighlight?: (highlight: PortfolioHighlight) => void;
}

const HighlightsSection: React.FC<HighlightsSectionProps> = ({
  highlights,
  isEditable = false,
  onAddHighlight,
  onEditHighlight
}) => {
  if (!highlights || highlights.length === 0) {
    return (
      <Card className="bg-muted/40">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Star className="h-5 w-5 me-2" />
              Portfolio Highlights
            </CardTitle>
            <CardDescription>No portfolio highlights available</CardDescription>
          </div>
          
          {isEditable && onAddHighlight && (
            <Button variant="outline" size="sm" onClick={onAddHighlight}>
              Add Highlight
            </Button>
          )}
        </CardHeader>
      </Card>
    );
  }

  const getHighlightTypeColor = (type: string) => {
    switch (type) {
      case "project":
        return "bg-blue-100 text-blue-800";
      case "achievement":
        return "bg-green-100 text-green-800";
      case "publication":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center">
            <Star className="h-5 w-5 me-2" />
            Portfolio Highlights
          </CardTitle>
          <CardDescription>{highlights.length} highlights</CardDescription>
        </div>
        
        {isEditable && onAddHighlight && (
          <Button variant="outline" size="sm" onClick={onAddHighlight}>
            Add Highlight
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {highlights.map((highlight) => (
            <div
              key={highlight.id}
              className="border rounded-lg p-4 hover:border-primary/50 transition-colors relative"
              onClick={() => isEditable && onEditHighlight && onEditHighlight(highlight)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{highlight.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className={getHighlightTypeColor(highlight.type)}>
                      {highlight.type.charAt(0).toUpperCase() + highlight.type.slice(1)}
                    </Badge>
                    {highlight.date && (
                      <span className="text-xs text-muted-foreground">
                        {formatDate(new Date(highlight.date))}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mt-3 text-sm text-muted-foreground">
                <p className="line-clamp-3">{highlight.description}</p>
              </div>
              
              {highlight.url && (
                <div className="mt-3">
                  <a
                    href={highlight.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs inline-flex items-center text-primary hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View more <ExternalLink className="h-3 w-3 ms-1" />
                  </a>
                </div>
              )}
              
              {isEditable && (
                <div className="absolute top-2 end-2 text-xs text-muted-foreground">
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

export default HighlightsSection;
