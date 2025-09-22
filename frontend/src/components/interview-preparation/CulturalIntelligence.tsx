
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Users, Heart, Handshake } from 'lucide-react';

export const CulturalIntelligence: React.FC = () => {
  const businessEtiquette = [
    {
      category: 'Greetings & Introductions',
      dos: [
        'Use "As-salamu alaykum" if appropriate, or "Good morning/afternoon"',
        'Shake hands firmly with same-gender colleagues',
        'Wait to be introduced to opposite-gender colleagues',
        'Use titles and formal address initially'
      ],
      donts: [
        'Don\'t use overly casual greetings initially',
        'Don\'t assume physical contact is appropriate',
        'Don\'t ignore hierarchy in introductions'
      ]
    },
    {
      category: 'Communication Style',
      dos: [
        'Speak clearly and at a moderate pace',
        'Show respect for senior colleagues and decisions',
        'Use diplomatic language when disagreeing',
        'Ask permission before speaking in group settings'
      ],
      donts: [
        'Don\'t interrupt or speak over others',
        'Don\'t use slang or informal expressions',
        'Don\'t challenge authority publicly'
      ]
    },
    {
      category: 'Meeting Etiquette',
      dos: [
        'Arrive on time or slightly early',
        'Wait for the senior person to start the meeting',
        'Turn off phone or put on silent mode',
        'Take notes to show engagement'
      ],
      donts: [
        'Don\'t rush to leave immediately after',
        'Don\'t eat during meetings unless offered',
        'Don\'t dominate the conversation'
      ]
    }
  ];

  const dressCodes = [
    {
      industry: 'Banking & Finance',
      men: 'Dark business suits, conservative ties, leather shoes',
      women: 'Business suits with modest necklines, knee-length skirts or pants',
      general: 'Very conservative, formal appearance essential'
    },
    {
      industry: 'Government',
      men: 'Dark suits, minimal jewelry, polished shoes',
      women: 'Professional attire covering arms and legs, modest colors',
      general: 'Formal, respectful of Islamic values'
    },
    {
      industry: 'Technology',
      men: 'Business casual to formal, depending on role level',
      women: 'Smart casual to business formal, conservative cuts',
      general: 'More relaxed but still professional'
    },
    {
      industry: 'Healthcare',
      men: 'Suits for administrative roles, professional attire',
      women: 'Conservative professional wear, consider cultural sensitivity',
      general: 'Clean, professional, culturally respectful'
    }
  ];

  const culturalConsiderations = [
    {
      title: 'Prayer Time Awareness',
      description: 'Be understanding if meetings are scheduled around prayer times',
      icon: Heart,
      importance: 'Essential'
    },
    {
      title: 'Ramadan Considerations',
      description: 'Respect fasting hours, adjusted schedules, and increased spiritual focus',
      icon: Heart,
      importance: 'Essential'
    },
    {
      title: 'Weekend Differences',
      description: 'Weekends are Friday-Saturday; Sunday is a working day',
      icon: Users,
      importance: 'Important'
    },
    {
      title: 'Family Values',
      description: 'Family time is highly valued; understand work-life balance expectations',
      icon: Handshake,
      importance: 'Important'
    }
  ];

  const crossCulturalTips = [
    'Acknowledge the multicultural nature of UAE workplaces',
    'Show appreciation for local customs while maintaining your authenticity',
    'Demonstrate knowledge of UAE\'s history and development goals',
    'Express genuine interest in learning about Emirati culture',
    'Highlight your experience working with diverse teams',
    'Show respect for Islamic traditions and values'
  ];

  return (
    <div className="space-y-6">
      {/* Introduction */}
      <Card>
        <CardHeader>
          <CardTitle className="text-ehrdc-teal">UAE Business Culture Intelligence</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-gray-800">
              The UAE workplace embraces diversity while maintaining strong cultural traditions. 
              Understanding and respecting local customs while showcasing your unique background 
              will help you excel in interviews and workplace interactions.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Business Etiquette */}
      <Card>
        <CardHeader>
          <CardTitle className="text-ehrdc-teal">Business Etiquette Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {businessEtiquette.map((section, index) => (
              <div key={index} className="border rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-4">{section.category}</h3>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-green-600 mb-3 flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      Do
                    </h4>
                    <div className="space-y-2">
                      {section.dos.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-red-600 mb-3 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" />
                      Don't
                    </h4>
                    <div className="space-y-2">
                      {section.donts.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-sm">
                          <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Dress Code Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="text-ehrdc-teal">Professional Dress Code by Industry</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dressCodes.map((code, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-lg">{code.industry}</h3>
                  <Badge variant="outline">{code.general}</Badge>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Men:</h4>
                    <p className="text-sm text-gray-700">{code.men}</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Women:</h4>
                    <p className="text-sm text-gray-700">{code.women}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cultural Considerations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-ehrdc-teal">Important Cultural Considerations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {culturalConsiderations.map((item, index) => {
              const IconComponent = item.icon;
              return (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-start gap-3">
                    <IconComponent className="h-6 w-6 text-ehrdc-teal mt-1" />
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{item.title}</h3>
                        <Badge variant={item.importance === 'Essential' ? 'default' : 'outline'}>
                          {item.importance}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{item.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Cross-Cultural Communication */}
      <Card>
        <CardHeader>
          <CardTitle className="text-ehrdc-teal">Cross-Cultural Communication Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {crossCulturalTips.map((tip, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{tip}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
