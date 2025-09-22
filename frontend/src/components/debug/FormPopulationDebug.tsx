// Debug component to test CV Builder form population

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CVData } from '@/integrations/groq';

interface FormPopulationDebugProps {
  cvData: Partial<CVData>;
  onTestFormPopulation: (data: CVData) => void;
}

const FormPopulationDebug: React.FC<FormPopulationDebugProps> = ({ 
  cvData, 
  onTestFormPopulation 
}) => {
  const [testData, setTestData] = useState<CVData | null>(null);

  // Create test data with known good values
  const createTestData = (): CVData => {
    return {
      personalInfo: {
        fullName: "Abdulaziz Essa Harib Alfalahi",
        email: "abdulaziz.harib@gmail.com",
        phone: "0558285000",
        address: "United Arab Emirates",
        summary: "Accomplished executive with over 25 years of transformative leadership experience in telecommunications and technology sectors.",
        linkedIn: "",
        website: ""
      },
      experience: [
        {
          id: "exp1",
          position: "General Superintendent of Recruitment Operations",
          company: "Emirati Human Resources Development Council",
          location: "United Arab Emirates",
          startDate: "2022-09",
          endDate: "Present",
          isCurrentlyWorking: true,
          description: "Leading Emiratization programs and recruitment operations in the private sector.",
          achievements: [
            "Initiated and led series of Emiratization programs",
            "Established recruitment operations bridging job seekers and organizations",
            "Performed pre-matching assessments for optimal alignment"
          ]
        },
        {
          id: "exp2",
          position: "Consultant",
          company: "Dubai Government Human Resources",
          location: "United Arab Emirates",
          startDate: "2021-11",
          endDate: "Present",
          isCurrentlyWorking: true,
          description: "Transforming HR department into data-driven organization.",
          achievements: [
            "Initiated transformation into data-driven organization",
            "Enhanced human welfare and long-term economic growth",
            "Collaborated with educational institutions"
          ]
        }
      ],
      education: [
        {
          id: "edu1",
          degree: "EMBA, Strategic Management",
          institution: "Higher Colleges of Technology",
          location: "United Arab Emirates",
          startDate: "2009-09",
          endDate: "2011-06",
          field: "Strategic Management",
          achievements: [
            "GPA 3.6",
            "Strategic leadership development",
            "Executive management training"
          ]
        },
        {
          id: "edu2",
          degree: "Post Graduate, Telecommunications Management",
          institution: "Sheridan College",
          location: "Canada",
          startDate: "1997-09",
          endDate: "1998-06",
          field: "Telecommunications Management",
          achievements: [
            "Specialized telecommunications training",
            "Industry consulting experience",
            "Technical management skills"
          ]
        }
      ],
      skills: {
        technical: [
          "Artificial Intelligence",
          "Data Analytics",
          "Strategic Management",
          "Telecommunications",
          "Digital Transformation",
          "Project Management",
          "Network Operations",
          "Budget Planning",
          "Technology Strategy",
          "IT Governance"
        ],
        soft: [
          "Leadership",
          "Strategic Thinking",
          "Communication",
          "Innovation",
          "Change Management",
          "Team Building",
          "Problem Solving",
          "Executive Management",
          "Stakeholder Management",
          "Cross-functional Leadership"
        ]
      },
      languages: [
        {
          id: "lang1",
          language: "Arabic",
          proficiency: "Native"
        },
        {
          id: "lang2",
          language: "English",
          proficiency: "Fluent"
        }
      ],
      certifications: [
        {
          id: "cert1",
          name: "The Artificial Intelligence Program",
          issuer: "University of Oxford (UAE National AI Program)",
          date: "2022-08"
        }
      ],
      projects: [
        {
          id: "proj1",
          name: "Digital Transformation Initiative",
          description: "Led comprehensive digital transformation at RTA focusing on data-driven strategies.",
          technologies: [
            "Data Analytics",
            "Digital Strategy",
            "Process Automation"
          ],
          startDate: "2020-01",
          endDate: "2021-11"
        }
      ]
    };
  };

  const testFormPopulation = () => {
    const goodTestData = createTestData();
    setTestData(goodTestData);
    
    console.log('🧪 Testing form population with known good data...');
    console.log('📊 Test data:', goodTestData);
    
    // Call the parent's form population handler
    onTestFormPopulation(goodTestData);
  };

  const analyzeCurrentData = () => {
    console.log('🔍 Analyzing current CV data structure...');
    console.log('📊 Current cvData:', cvData);
    
    const analysis = {
      hasPersonalInfo: !!cvData.personalInfo,
      hasValidName: cvData.personalInfo?.fullName && cvData.personalInfo.fullName !== "Professional Candidate",
      hasEmail: !!cvData.personalInfo?.email,
      hasPhone: !!cvData.personalInfo?.phone,
      experienceCount: cvData.experience?.length || 0,
      educationCount: cvData.education?.length || 0,
      hasSkills: !!(cvData.skills?.technical?.length || cvData.skills?.soft?.length),
      dataStructureValid: true
    };
    
    console.log('📊 Data analysis:', analysis);
    return analysis;
  };

  const analysis = analyzeCurrentData();

  return (
    <Card className="border-2 border-blue-200 bg-blue-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔧 Form Population Debug Tool
          <Badge variant="outline" className="ml-auto bg-blue-100 text-blue-800">
            Debug Mode
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Current Data Analysis */}
        <div className="p-3 bg-white rounded-lg border">
          <h4 className="font-semibold mb-2">📊 Current CV Data Analysis</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className={`flex items-center gap-2 ${analysis.hasPersonalInfo ? 'text-green-700' : 'text-red-700'}`}>
              {analysis.hasPersonalInfo ? '✅' : '❌'} Personal Info Structure
            </div>
            <div className={`flex items-center gap-2 ${analysis.hasValidName ? 'text-green-700' : 'text-red-700'}`}>
              {analysis.hasValidName ? '✅' : '❌'} Valid Name ({cvData.personalInfo?.fullName || 'None'})
            </div>
            <div className={`flex items-center gap-2 ${analysis.hasEmail ? 'text-green-700' : 'text-red-700'}`}>
              {analysis.hasEmail ? '✅' : '❌'} Email ({cvData.personalInfo?.email || 'None'})
            </div>
            <div className={`flex items-center gap-2 ${analysis.hasPhone ? 'text-green-700' : 'text-red-700'}`}>
              {analysis.hasPhone ? '✅' : '❌'} Phone ({cvData.personalInfo?.phone || 'None'})
            </div>
            <div className={`flex items-center gap-2 ${analysis.experienceCount > 0 ? 'text-green-700' : 'text-red-700'}`}>
              {analysis.experienceCount > 0 ? '✅' : '❌'} Experience ({analysis.experienceCount} entries)
            </div>
            <div className={`flex items-center gap-2 ${analysis.educationCount > 0 ? 'text-green-700' : 'text-red-700'}`}>
              {analysis.educationCount > 0 ? '✅' : '❌'} Education ({analysis.educationCount} entries)
            </div>
          </div>
        </div>

        {/* Data Quality Issues */}
        {(!analysis.hasValidName || analysis.experienceCount === 0) && (
          <div className="p-3 bg-yellow-100 rounded border border-yellow-200">
            <h4 className="font-semibold text-yellow-800">⚠️ Data Quality Issues Detected</h4>
            <ul className="text-sm text-yellow-700 mt-1 space-y-1">
              {!analysis.hasValidName && (
                <li>• Name is generic or missing - form may not populate properly</li>
              )}
              {analysis.experienceCount === 0 && (
                <li>• No experience entries found - experience section will be empty</li>
              )}
              {analysis.educationCount === 0 && (
                <li>• No education entries found - education section will be empty</li>
              )}
            </ul>
          </div>
        )}

        {/* Test Form Population */}
        <div className="space-y-2">
          <Button 
            onClick={testFormPopulation}
            className="w-full"
            variant="outline"
          >
            🧪 Test Form Population with Known Good Data
          </Button>
          <p className="text-xs text-gray-600">
            This will test if the form population mechanism works by sending known good data to the CV Builder.
          </p>
        </div>

        {/* Test Data Preview */}
        {testData && (
          <div className="p-3 bg-green-100 rounded border border-green-200">
            <h4 className="font-semibold text-green-800">✅ Test Data Sent to Form</h4>
            <div className="text-sm text-green-700 mt-1">
              <div><strong>Name:</strong> {testData.personalInfo.fullName}</div>
              <div><strong>Email:</strong> {testData.personalInfo.email}</div>
              <div><strong>Phone:</strong> {testData.personalInfo.phone}</div>
              <div><strong>Experience:</strong> {testData.experience.length} entries</div>
              <div><strong>Education:</strong> {testData.education.length} entries</div>
            </div>
            <p className="text-xs text-green-600 mt-2">
              Check if the CV Builder form fields are now populated with this data.
            </p>
          </div>
        )}

        {/* Current Data Raw View */}
        <details className="p-3 bg-gray-50 rounded border">
          <summary className="cursor-pointer font-semibold">📄 View Current Raw Data</summary>
          <pre className="mt-2 text-xs overflow-auto max-h-40 bg-white p-2 rounded border">
            {JSON.stringify(cvData, null, 2)}
          </pre>
        </details>

        {/* Instructions */}
        <div className="p-3 bg-blue-50 rounded border border-blue-200">
          <h4 className="font-semibold text-blue-900">🔧 Debug Instructions</h4>
          <ul className="text-sm text-blue-800 mt-1 space-y-1">
            <li>• Check if current data has quality issues (red ❌ indicators)</li>
            <li>• Test form population with known good data</li>
            <li>• Switch to Builder tab to see if form fields populate</li>
            <li>• If test data works but parsed data doesn't, the issue is data quality</li>
            <li>• If neither works, the issue is in the form population mechanism</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default FormPopulationDebug;

