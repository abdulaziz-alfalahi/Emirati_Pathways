
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, Upload, Download, Shield, CheckCircle, 
  Eye, Share2, Lock, Search, Calendar, User 
} from 'lucide-react';

export const DocumentationCenter: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const serviceDocuments = [
    {
      id: 1,
      name: 'Service Completion Certificate',
      type: 'Certificate',
      date: '2023-12-15',
      status: 'Verified',
      size: '2.3 MB',
      verified: true
    },
    {
      id: 2,
      name: 'Military Skills Assessment',
      type: 'Assessment',
      date: '2023-11-20',
      status: 'Verified',
      size: '1.8 MB',
      verified: true
    },
    {
      id: 3,
      name: 'Leadership Training Certificate',
      type: 'Training',
      date: '2023-10-05',
      status: 'Pending',
      size: '1.2 MB',
      verified: false
    }
  ];

  const templates = [
    {
      title: 'Military-to-Civilian CV Template',
      description: 'Professional CV template highlighting military experience',
      downloads: 1250,
      category: 'CV'
    },
    {
      title: 'Skills Translation Guide',
      description: 'Guide for translating military skills to civilian language',
      downloads: 890,
      category: 'Guide'
    },
    {
      title: 'Cover Letter Template',
      description: 'Cover letter template for veteran job applications',
      downloads: 1050,
      category: 'Cover Letter'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Document Storage */}
      <Card>
        <CardHeader>
          <CardTitle className="text-ehrdc-teal">My Service Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button className="bg-ehrdc-teal hover:bg-ehrdc-teal/90">
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </div>

          <div className="space-y-3">
            {serviceDocuments.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="bg-blue-100 rounded-lg p-2">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">{doc.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{doc.type}</span>
                      <span>{doc.size}</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {doc.date}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Badge 
                    className={doc.verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                  >
                    {doc.verified && <CheckCircle className="h-3 w-3 mr-1" />}
                    {doc.status}
                  </Badge>
                  
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Verification System */}
      <Card>
        <CardHeader>
          <CardTitle className="text-ehrdc-teal">Document Verification for Employers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-4">Verification Code Generator</h3>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Secure Verification Code</span>
                  </div>
                  <div className="bg-gray-100 p-3 rounded font-mono text-lg">
                    UAE-NS-2024-A7B9C2
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Share this code with employers to verify your service records
                  </p>
                </div>
                <Button className="w-full bg-ehrdc-teal hover:bg-ehrdc-teal/90">
                  Generate New Code
                </Button>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Verification Features</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Blockchain-secured verification</span>
                </div>
                <div className="flex items-center gap-3">
                  <Lock className="h-5 w-5 text-blue-600" />
                  <span>Privacy-protected sharing</span>
                </div>
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-purple-600" />
                  <span>Real-time verification status</span>
                </div>
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-orange-600" />
                  <span>Detailed service summary</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates and Resources */}
      <Card>
        <CardHeader>
          <CardTitle className="text-ehrdc-teal">CV & Cover Letter Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            {templates.map((template, index) => (
              <div key={index} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="bg-ehrdc-teal/10 rounded-lg p-2">
                    <FileText className="h-6 w-6 text-ehrdc-teal" />
                  </div>
                  <Badge variant="outline">{template.category}</Badge>
                </div>
                
                <h3 className="font-semibold mb-2">{template.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    {template.downloads} downloads
                  </span>
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Skills Translation Tool */}
      <Card>
        <CardHeader>
          <CardTitle className="text-ehrdc-teal">Military Skills Translator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-600">
              Translate your military experience into civilian-friendly language for your CV and applications.
            </p>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Military Role/Experience</label>
                <Input placeholder="e.g., Squad Leader, Infantry Division" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Target Industry</label>
                <Input placeholder="e.g., Corporate Management, Security" />
              </div>
            </div>
            
            <Button className="bg-ehrdc-teal hover:bg-ehrdc-teal/90">
              Generate Translation
            </Button>
            
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold mb-2">Translated Description:</h4>
              <p className="text-sm">
                "Experienced team leader with proven ability to manage cross-functional teams of 12+ members, 
                implement strategic initiatives, and maintain operational excellence under high-pressure environments. 
                Demonstrated expertise in resource allocation, performance management, and crisis resolution."
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
