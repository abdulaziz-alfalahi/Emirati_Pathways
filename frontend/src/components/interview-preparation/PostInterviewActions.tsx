
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, Clock, DollarSign, MessageCircle, CheckCircle, Calendar } from 'lucide-react';

export const PostInterviewActions: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [customMessage, setCustomMessage] = useState('');

  const thankYouTemplates = [
    {
      type: 'Standard Thank You',
      subject: 'Thank you for the interview - [Your Name]',
      content: `Dear [Interviewer Name],

Thank you for taking the time to interview me for the [Position Title] role at [Company Name] yesterday. I enjoyed our conversation about [specific topic discussed] and learning more about [company/team details].

Our discussion reinforced my enthusiasm for this opportunity, particularly [mention specific aspect that excited you]. I believe my experience in [relevant experience] would enable me to contribute effectively to [specific team/project mentioned].

Please don't hesitate to contact me if you need any additional information. I look forward to hearing about the next steps.

Best regards,
[Your Name]`
    },
    {
      type: 'Panel Interview Thank You',
      subject: 'Thank you for the panel interview - [Your Name]',
      content: `Dear [Lead Interviewer Name] and Team,

Thank you all for the opportunity to interview for the [Position Title] position. I appreciated the diverse perspectives shared by each panel member and the comprehensive discussion about [key topics].

I was particularly interested in [specific point from different panel members]. The collaborative approach your team demonstrated during the interview process reflects the positive culture I would be excited to join.

I remain very interested in this opportunity and look forward to the next steps in the process.

Best regards,
[Your Name]`
    },
    {
      type: 'Follow-up After Delay',
      subject: 'Following up on our interview - [Your Name]',
      content: `Dear [Interviewer Name],

I hope this message finds you well. I wanted to follow up on our interview for the [Position Title] role that took place on [date].

I remain very interested in this opportunity and excited about the possibility of contributing to [company/team]. If you need any additional information from me or if there are any updates on the timeline, please let me know.

Thank you again for your time and consideration.

Best regards,
[Your Name]`
    }
  ];

  const followUpTimeline = [
    {
      timeframe: '24 hours',
      action: 'Send thank you email',
      status: 'critical',
      description: 'Express gratitude and reiterate interest'
    },
    {
      timeframe: '1 week',
      action: 'First follow-up (if no response)',
      status: 'recommended',
      description: 'Polite inquiry about timeline and next steps'
    },
    {
      timeframe: '2 weeks',
      action: 'Second follow-up',
      status: 'optional',
      description: 'Brief check-in expressing continued interest'
    },
    {
      timeframe: '1 month',
      action: 'Final follow-up',
      status: 'optional',
      description: 'Last attempt to understand status'
    }
  ];

  const negotiationTips = [
    {
      category: 'Salary Negotiation',
      points: [
        'Research market rates for your role and experience level',
        'Consider total compensation package, not just base salary',
        'Prepare your value proposition with specific achievements',
        'Be flexible and open to creative solutions'
      ]
    },
    {
      category: 'Benefits Discussion',
      points: [
        'Understand the full benefits package offered',
        'Consider health insurance, vacation days, and professional development',
        'Ask about flexible working arrangements if relevant',
        'Discuss career progression opportunities'
      ]
    },
    {
      category: 'Cultural Considerations',
      points: [
        'Respect UAE business culture in negotiation style',
        'Be patient with decision-making timelines',
        'Show appreciation for the opportunity throughout',
        'Maintain professional relationships regardless of outcome'
      ]
    }
  ];

  const feedbackRequestTemplate = `Dear [Interviewer Name],

Thank you again for the interview opportunity for the [Position Title] role. While I understand I was not selected for this position, I would greatly appreciate any feedback you could share about my interview performance.

Your insights would be invaluable for my professional development and future interviews. I'm particularly interested in areas where I could improve or skills I should focus on developing.

Thank you for your time and consideration.

Best regards,
[Your Name]`;

  return (
    <div className="space-y-6">
      {/* Thank You Note Builder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-ehrdc-teal">Thank You Note Builder</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Select Template Type</label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a thank you template" />
                </SelectTrigger>
                <SelectContent>
                  {thankYouTemplates.map((template, index) => (
                    <SelectItem key={index} value={template.type}>{template.type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedTemplate && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">
                    {thankYouTemplates.find(t => t.type === selectedTemplate)?.subject}
                  </h3>
                  <pre className="text-sm whitespace-pre-wrap font-sans">
                    {thankYouTemplates.find(t => t.type === selectedTemplate)?.content}
                  </pre>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Customize Your Message</label>
                  <Textarea
                    placeholder="Add personal touches or specific details from your interview..."
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    className="min-h-32"
                  />
                </div>
                
                <Button className="bg-ehrdc-teal hover:bg-ehrdc-teal/90">
                  <Mail className="h-4 w-4 me-2" />
                  Generate Final Email
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Follow-up Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-ehrdc-teal">Follow-up Timeline & Strategy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {followUpTimeline.map((item, index) => (
              <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="flex-shrink-0">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    item.status === 'critical' ? 'bg-red-100 text-red-600' :
                    item.status === 'recommended' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    <Clock className="h-6 w-6" />
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{item.action}</h3>
                    <Badge variant={item.status === 'critical' ? 'destructive' : 'outline'}>
                      {item.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
                
                <div className="text-end">
                  <div className="font-semibold text-ehrdc-teal">{item.timeframe}</div>
                  <div className="text-sm text-gray-500">after interview</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Negotiation Preparation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-ehrdc-teal">Negotiation Preparation Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            {negotiationTips.map((category, index) => (
              <div key={index}>
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-ehrdc-teal" />
                  {category.category}
                </h3>
                <div className="space-y-3">
                  {category.points.map((point, pointIndex) => (
                    <div key={pointIndex} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{point}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Feedback Request Template */}
      <Card>
        <CardHeader>
          <CardTitle className="text-ehrdc-teal">Request Interview Feedback</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">When to Request Feedback:</h3>
              <ul className="text-sm space-y-1">
                <li>• After receiving a rejection (wait 24-48 hours)</li>
                <li>• When you want to improve for future interviews</li>
                <li>• If you had a positive interview experience despite the outcome</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Feedback Request Template:</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="text-sm whitespace-pre-wrap font-sans">{feedbackRequestTemplate}</pre>
              </div>
            </div>
            
            <Button variant="outline">
              <MessageCircle className="h-4 w-4 me-2" />
              Copy Template
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Action Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="text-ehrdc-teal">Post-Interview Action Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-4">Immediate Actions (24-48 hours)</h3>
              <div className="space-y-3">
                {[
                  'Send personalized thank you email',
                  'Connect with interviewers on LinkedIn',
                  'Update your interview notes while fresh',
                  'Research any topics you struggled with'
                ].map((action, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm">{action}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Follow-up Actions</h3>
              <div className="space-y-3">
                {[
                  'Set calendar reminders for follow-up',
                  'Prepare negotiation talking points',
                  'Continue job search process',
                  'Reflect on interview performance'
                ].map((action, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm">{action}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
