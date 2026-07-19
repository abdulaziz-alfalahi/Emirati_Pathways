
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Users, Shield, TrendingUp, ExternalLink, Download } from 'lucide-react';

export const ResourcesTab: React.FC = () => {
  const resources = [
    {
      category: "Governance Guidelines",
      icon: Shield,
      items: [
        {
          title: "Board Governance Best Practices",
          description: "Comprehensive guide to effective board governance in the UAE context.",
          type: "PDF Guide",
          url: "#"
        },
        {
          title: "Advisory Role Responsibilities",
          description: "Understanding your duties and obligations as an advisory board member.",
          type: "Article",
          url: "#"
        },
        {
          title: "Legal Framework for Advisors",
          description: "Key legal considerations for advisory positions in UAE organizations.",
          type: "Legal Guide",
          url: "#"
        }
      ]
    },
    {
      category: "Professional Development",
      icon: TrendingUp,
      items: [
        {
          title: "Strategic Advisory Skills",
          description: "Develop the strategic thinking skills essential for effective advisory roles.",
          type: "Online Course",
          url: "#"
        },
        {
          title: "Financial Literacy for Advisors",
          description: "Understanding financial statements and key performance indicators.",
          type: "Workshop",
          url: "#"
        },
        {
          title: "Industry-Specific Advisory Training",
          description: "Specialized training programs for different industry sectors.",
          type: "Training Series",
          url: "#"
        }
      ]
    },
    {
      category: "Ethical Considerations",
      icon: BookOpen,
      items: [
        {
          title: "Code of Ethics for Advisors",
          description: "Ethical guidelines and standards for advisory board members.",
          type: "Ethics Code",
          url: "#"
        },
        {
          title: "Conflict of Interest Management",
          description: "How to identify and manage potential conflicts of interest.",
          type: "Guide",
          url: "#"
        },
        {
          title: "Confidentiality and Information Security",
          description: "Best practices for handling sensitive organizational information.",
          type: "Security Guide",
          url: "#"
        }
      ]
    },
    {
      category: "Networking & Community",
      icon: Users,
      items: [
        {
          title: "UAE Advisory Board Network",
          description: "Connect with other advisory board members across the UAE.",
          type: "Community",
          url: "#"
        },
        {
          title: "Monthly Advisory Roundtables",
          description: "Regular networking events for current and aspiring advisors.",
          type: "Events",
          url: "#"
        },
        {
          title: "Mentor Matching Program",
          description: "Get paired with experienced advisors for guidance and support.",
          type: "Program",
          url: "#"
        }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Resources for Advisors</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Access comprehensive resources to excel in your advisory role. From governance guidelines 
          to professional development opportunities, everything you need to be an effective advisor.
        </p>
      </div>

      {resources.map((category, categoryIndex) => {
        const IconComponent = category.icon;
        return (
          <Card key={categoryIndex}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconComponent className="h-5 w-5 text-blue-600" />
                {category.category}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {category.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-medium text-sm">{item.title}</h4>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {item.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {item.description}
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <ExternalLink className="h-3 w-3 me-1" />
                        View
                      </Button>
                      {item.type.includes('PDF') || item.type.includes('Guide') && (
                        <Button size="sm" variant="ghost">
                          <Download className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Need Additional Support?</h3>
            <p className="text-gray-600 mb-4">
              Our advisory support team is here to help you succeed in your advisory roles.
            </p>
            <div className="flex gap-3 justify-center">
              <Button>Contact Advisory Support</Button>
              <Button variant="outline">Schedule Consultation</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
