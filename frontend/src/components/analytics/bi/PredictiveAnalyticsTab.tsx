
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, AlertTriangle, Target, Lightbulb } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Bar, Area } from 'recharts';

interface PredictiveAnalyticsTabProps {
  timeRange: string;
  selectedPhases: string[];
}

// Mock predictive data
const demandForecastData = [
  { month: 'Jul', actual: 2400, predicted: 2450, confidence: 0.92 },
  { month: 'Aug', actual: 2800, predicted: 2750, confidence: 0.89 },
  { month: 'Sep', actual: 3200, predicted: 3100, confidence: 0.87 },
  { month: 'Oct', actual: null, predicted: 3400, confidence: 0.85 },
  { month: 'Nov', actual: null, predicted: 3650, confidence: 0.82 },
  { month: 'Dec', actual: null, predicted: 3900, confidence: 0.79 },
];

const scenarioData = [
  { scenario: 'Conservative', q1: 3200, q2: 3400, q3: 3600, q4: 3800 },
  { scenario: 'Expected', q1: 3600, q2: 4000, q3: 4400, q4: 4800 },
  { scenario: 'Optimistic', q1: 4000, q2: 4600, q3: 5200, q4: 5800 },
];

export const PredictiveAnalyticsTab: React.FC<PredictiveAnalyticsTabProps> = ({
  timeRange,
  selectedPhases
}) => {
  const [selectedModel, setSelectedModel] = useState('ml_ensemble');
  const [selectedScenario, setSelectedScenario] = useState('expected');

  return (
    <div className="space-y-6">
      {/* Predictive Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-sm font-medium">Prediction Settings:</span>
            
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="ML Model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ml_ensemble">ML Ensemble</SelectItem>
                <SelectItem value="time_series">Time Series</SelectItem>
                <SelectItem value="regression">Regression Analysis</SelectItem>
                <SelectItem value="neural_network">Neural Network</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedScenario} onValueChange={setSelectedScenario}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Scenario" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="conservative">Conservative</SelectItem>
                <SelectItem value="expected">Expected</SelectItem>
                <SelectItem value="optimistic">Optimistic</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm">
              Run New Prediction
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Prediction Confidence Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Model Accuracy</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87.3%</div>
            <p className="text-xs text-muted-foreground">
              Based on historical validation
            </p>
            <Badge variant="default" className="mt-2 bg-green-600">High Confidence</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Prediction Horizon</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">6 Months</div>
            <p className="text-xs text-muted-foreground">
              Optimal forecasting period
            </p>
            <Badge variant="secondary" className="mt-2">Validated Range</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Assessment</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Low</div>
            <p className="text-xs text-muted-foreground">
              Stable trend patterns
            </p>
            <Badge variant="outline" className="mt-2">Minimal Volatility</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Demand Forecasting */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Demand Forecasting</CardTitle>
          <CardDescription>
            Predicted user engagement and service demand over the next 6 months
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={demandForecastData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value, name) => [
                typeof value === 'number' ? value.toLocaleString() : value,
                name
              ]} />
              <Bar dataKey="actual" fill="#8884d8" name="Actual Demand" />
              <Line 
                type="monotone" 
                dataKey="predicted" 
                stroke="#ff7300" 
                strokeWidth={3}
                strokeDasharray="5 5"
                name="Predicted Demand"
              />
              <Area 
                type="monotone" 
                dataKey="confidence" 
                stroke="#82ca9d" 
                fill="#82ca9d" 
                fillOpacity={0.3}
                name="Confidence Level"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Scenario Modeling */}
      <Card>
        <CardHeader>
          <CardTitle>Scenario Modeling</CardTitle>
          <CardDescription>
            Strategic planning scenarios for resource allocation and policy decisions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {scenarioData.map((scenario) => (
              <div key={scenario.scenario} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{scenario.scenario} Scenario</span>
                  <Badge variant={
                    scenario.scenario === 'Conservative' ? 'outline' :
                    scenario.scenario === 'Expected' ? 'default' : 'secondary'
                  }>
                    {scenario.scenario === selectedScenario.charAt(0).toUpperCase() + selectedScenario.slice(1) ? 'Selected' : 'Available'}
                  </Badge>
                </div>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div className="text-center p-2 bg-blue-50 rounded">
                    <div className="font-bold">{scenario.q1.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Q1</div>
                  </div>
                  <div className="text-center p-2 bg-green-50 rounded">
                    <div className="font-bold">{scenario.q2.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Q2</div>
                  </div>
                  <div className="text-center p-2 bg-yellow-50 rounded">
                    <div className="font-bold">{scenario.q3.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Q3</div>
                  </div>
                  <div className="text-center p-2 bg-purple-50 rounded">
                    <div className="font-bold">{scenario.q4.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Q4</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              AI-Generated Recommendations
            </CardTitle>
            <CardDescription>
              Proactive policy interventions based on predictive analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 rounded border-l-4 border-blue-500">
                <div className="font-medium text-blue-800">Resource Scaling</div>
                <div className="text-sm text-blue-700">
                  Increase capacity by 25% in Q4 to meet predicted demand surge
                </div>
                <Badge variant="outline" className="mt-2">High Priority</Badge>
              </div>
              
              <div className="p-3 bg-green-50 rounded border-l-4 border-green-500">
                <div className="font-medium text-green-800">Skills Program Expansion</div>
                <div className="text-sm text-green-700">
                  Launch additional digital literacy programs in technology sector
                </div>
                <Badge variant="outline" className="mt-2">Medium Priority</Badge>
              </div>
              
              <div className="p-3 bg-yellow-50 rounded border-l-4 border-yellow-500">
                <div className="font-medium text-yellow-800">Geographic Distribution</div>
                <div className="text-sm text-yellow-700">
                  Consider expanding services to northern emirates based on demand patterns
                </div>
                <Badge variant="outline" className="mt-2">Long-term</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Emerging Trends Detection</CardTitle>
            <CardDescription>
              Early identification of emerging citizen needs and opportunities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-2 rounded bg-gray-50">
                <span className="text-sm font-medium">Remote Work Services</span>
                <Badge variant="default" className="bg-green-600">+145% Interest</Badge>
              </div>
              
              <div className="flex justify-between items-center p-2 rounded bg-gray-50">
                <span className="text-sm font-medium">Sustainability Careers</span>
                <Badge variant="default" className="bg-blue-600">+89% Growth</Badge>
              </div>
              
              <div className="flex justify-between items-center p-2 rounded bg-gray-50">
                <span className="text-sm font-medium">Digital Health Services</span>
                <Badge variant="default" className="bg-purple-600">+67% Adoption</Badge>
              </div>
              
              <div className="flex justify-between items-center p-2 rounded bg-gray-50">
                <span className="text-sm font-medium">Gig Economy Support</span>
                <Badge variant="default" className="bg-orange-600">+54% Demand</Badge>
              </div>
              
              <div className="flex justify-between items-center p-2 rounded bg-gray-50">
                <span className="text-sm font-medium">AI Skills Training</span>
                <Badge variant="default" className="bg-indigo-600">+134% Requests</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
