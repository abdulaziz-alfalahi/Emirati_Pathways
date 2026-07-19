import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calculator, DollarSign, PieChart, TrendingUp, Shield, FileText, ExternalLink } from 'lucide-react';
import { DirhamSign } from '@/components/icons/DirhamSign';

export const RetireeFinancialPlanningTab: React.FC = () => {
  const financialTools = [
    {
      id: 'retirement-income',
      title: 'Retirement Income Calculator',
      description: 'Calculate your monthly retirement income based on pension and savings',
      icon: <DirhamSign className="h-5 w-5" />,
      category: 'Calculator',
      features: ['Pension calculation', 'Savings projection', 'Monthly budgeting']
    },
    {
      id: 'healthcare-costs',
      title: 'Healthcare Cost Planner',
      description: 'Estimate healthcare expenses and plan for medical needs',
      icon: <Shield className="h-5 w-5" />,
      category: 'Planning',
      features: ['Medical insurance', 'Treatment costs', 'Emergency fund']
    },
    {
      id: 'estate-planning',
      title: 'Estate Planning Guide',
      description: 'Resources for wills, inheritance, and asset distribution',
      icon: <FileText className="h-5 w-5" />,
      category: 'Legal',
      features: ['Will preparation', 'Asset protection', 'Inheritance planning']
    },
    {
      id: 'investment-retiree',
      title: 'Conservative Investment Options',
      description: 'Low-risk investment strategies suitable for retirees',
      icon: <TrendingUp className="h-5 w-5" />,
      category: 'Investment',
      features: ['Bond investments', 'Fixed deposits', 'Dividend stocks']
    }
  ];

  const financialResources = [
    {
      title: 'UAE Pension System Overview',
      description: 'Complete guide to UAE pension benefits and entitlements',
      url: '#',
      category: 'Benefits'
    },
    {
      title: 'Tax Planning for Retirees',
      description: 'Understanding tax implications of retirement income',
      url: '#',
      category: 'Tax'
    },
    {
      title: 'Social Security Benefits',
      description: 'Navigating social security and government benefits',
      url: '#',
      category: 'Benefits'
    },
    {
      title: 'Financial Fraud Protection',
      description: 'Protecting yourself from financial scams and fraud',
      url: '#',
      category: 'Security'
    }
  ];

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Financial Planning for Retirees</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Comprehensive financial planning tools and resources to help you manage your retirement finances effectively and securely.
        </p>
      </div>

      {/* Financial Planning Tools */}
      <div>
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Financial Planning Tools
        </h3>
        <div className="grid gap-6 md:grid-cols-2">
          {financialTools.map((tool) => (
            <Card key={tool.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {tool.icon}
                    <Badge variant="outline">{tool.category}</Badge>
                  </div>
                </div>
                <CardTitle className="text-lg">{tool.title}</CardTitle>
                <CardDescription>{tool.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-1">
                    {tool.features.map((feature, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    <Calculator className="h-4 w-4 me-2" />
                    Use Tool
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Financial Resources */}
      <div>
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Financial Resources & Guides
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          {financialResources.map((resource, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{resource.title}</CardTitle>
                  <Badge variant="outline" className="text-xs">
                    {resource.category}
                  </Badge>
                </div>
                <CardDescription className="text-sm">
                  {resource.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <a href={resource.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 me-2" />
                    Read Guide
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Financial Health Check */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5 text-blue-600" />
            Financial Health Check
          </CardTitle>
          <CardDescription>
            Get a quick assessment of your retirement financial readiness
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">85%</div>
                <div className="text-sm text-muted-foreground">Pension Security</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">78%</div>
                <div className="text-sm text-muted-foreground">Healthcare Coverage</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">62%</div>
                <div className="text-sm text-muted-foreground">Emergency Fund</div>
              </div>
            </div>
            <Button className="w-full">
              <Calculator className="h-4 w-4 me-2" />
              Take Full Financial Assessment
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
