
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download } from 'lucide-react';

export const PersonalizedReport: React.FC = () => {
  const reportData = {
    currentSalary: 15000,
    marketAverage: 18000,
    potentialIncrease: 20,
    recommendations: [
      'Consider negotiating a 15-20% increase',
      'Highlight your AI/ML certifications',
      'Research senior roles in your field'
    ]
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-ehrdc-teal" />
          Your Personalized Salary Report
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-2 border-blue-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">AED {reportData.currentSalary.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Your Current Salary</div>
            </CardContent>
          </Card>
          
          <Card className="border-2 border-green-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">AED {reportData.marketAverage.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Market Average</div>
            </CardContent>
          </Card>
          
          <Card className="border-2 border-purple-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">+{reportData.potentialIncrease}%</div>
              <div className="text-sm text-muted-foreground">Potential Increase</div>
            </CardContent>
          </Card>
        </div>

        <div>
          <h3 className="font-semibold mb-3">Personalized Recommendations</h3>
          <div className="space-y-2">
            {reportData.recommendations.map((rec, index) => (
              <div key={index} className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                <Badge variant="outline" className="bg-blue-100 text-blue-800">
                  {index + 1}
                </Badge>
                <span className="text-sm">{rec}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <Button className="flex-1 bg-ehrdc-teal hover:bg-ehrdc-dark-teal">
            <Download className="h-4 w-4 mr-2" />
            Download Report
          </Button>
          <Button variant="outline" className="flex-1">
            Schedule Consultation
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
