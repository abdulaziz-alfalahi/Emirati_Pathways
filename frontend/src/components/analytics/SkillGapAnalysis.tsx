
import React, { useState } from 'react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

// Mock data - Would be fetched from an API in a real implementation
const skillGapData = {
  'technology': [
    { subject: 'Programming', required: 90, available: 75 },
    { subject: 'Data Science', required: 80, available: 45 },
    { subject: 'Cloud Computing', required: 75, available: 60 },
    { subject: 'AI/ML', required: 70, available: 40 },
    { subject: 'Cybersecurity', required: 85, available: 65 },
    { subject: 'DevOps', required: 65, available: 55 },
  ],
  'business': [
    { subject: 'Project Management', required: 80, available: 70 },
    { subject: 'Data Analysis', required: 75, available: 55 },
    { subject: 'Leadership', required: 70, available: 60 },
    { subject: 'Communication', required: 90, available: 75 },
    { subject: 'Critical Thinking', required: 85, available: 60 },
    { subject: 'Innovation', required: 80, available: 50 },
  ],
  'healthcare': [
    { subject: 'Clinical Knowledge', required: 95, available: 85 },
    { subject: 'Medical Technology', required: 80, available: 60 },
    { subject: 'Patient Care', required: 90, available: 80 },
    { subject: 'Healthcare IT', required: 70, available: 50 },
    { subject: 'Research Methods', required: 75, available: 65 },
    { subject: 'Regulatory Compliance', required: 85, available: 70 },
  ],
};

const SkillGapAnalysis = () => {
  const [sector, setSector] = useState('technology');
  const [showInsights, setShowInsights] = useState(false);
  const { roles } = useAuth();

  // Get appropriate data based on selected sector
  const data = skillGapData[sector as keyof typeof skillGapData];
  
  // Calculate the average skill gap
  const averageGap = data.reduce((acc, curr) => 
    acc + (curr.required - curr.available), 0) / data.length;

  // Determine most critical skill gap
  const mostCriticalSkill = data.reduce((prev, curr) => 
    (curr.required - curr.available) > (prev.required - prev.available) ? curr : prev);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <Select value={sector} onValueChange={setSector}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Select sector" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="technology">Technology</SelectItem>
            <SelectItem value="business">Business</SelectItem>
            <SelectItem value="healthcare">Healthcare</SelectItem>
          </SelectContent>
        </Select>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setShowInsights(!showInsights)}
        >
          {showInsights ? 'Hide AI Insights' : 'Show AI Insights'}
        </Button>
      </div>
      
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
            <PolarGrid />
            <PolarAngleAxis dataKey="subject" />
            <PolarRadiusAxis angle={30} domain={[0, 100]} />
            <Radar
              name="Required Skills"
              dataKey="required"
              stroke="#8884d8"
              fill="#8884d8"
              fillOpacity={0.4}
            />
            <Radar
              name="Available Skills"
              dataKey="available"
              stroke="#82ca9d"
              fill="#82ca9d"
              fillOpacity={0.4}
            />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      
      {showInsights && (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-3">AI-Generated Insights</h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="bg-red-100 text-red-600 p-1 rounded-full">•</span>
                <span>
                  <strong>Overall Gap:</strong> {averageGap.toFixed(1)}% average skill deficiency across {sector} roles.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-amber-100 text-amber-600 p-1 rounded-full">•</span>
                <span>
                  <strong>Critical Area:</strong> {mostCriticalSkill.subject} shows the largest gap 
                  ({(mostCriticalSkill.required - mostCriticalSkill.available).toFixed(1)}%) between 
                  requirements and available talent.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-green-100 text-green-600 p-1 rounded-full">•</span>
                <span>
                  <strong>Recommendation:</strong>{' '}
                  {roles.includes('educational_institution') 
                    ? `Develop targeted courses in ${mostCriticalSkill.subject} to address market needs.` 
                    : roles.includes('private_sector_recruiter') 
                      ? `Consider upskilling programs focused on ${mostCriticalSkill.subject} for existing talent.`
                      : `Focus development resources on ${mostCriticalSkill.subject} to address market demand.`
                  }
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SkillGapAnalysis;
