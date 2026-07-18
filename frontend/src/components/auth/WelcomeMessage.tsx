import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  Shield, 
  Globe, 
  Users, 
  Trophy,
  Heart,
  Star
} from 'lucide-react';

const WelcomeMessage: React.FC = () => {
  const features = [
    {
      icon: <Sparkles className="h-5 w-5" />,
      title: 'AI-Powered',
      description: 'Advanced AI technology for personalized career guidance'
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: 'UAE Focused',
      description: 'Designed specifically for UAE nationals and residents'
    },
    {
      icon: <Users className="h-5 w-5" />,
      title: 'Complete Ecosystem',
      description: 'Connect with employers, educators, mentors, and peers'
    },
    {
      icon: <Trophy className="h-5 w-5" />,
      title: 'Career Excellence',
      description: 'Tools and resources for professional growth and success'
    }
  ];

  return (
    <div className="text-center space-y-6 mb-8">
      {/* Main Welcome */}
      <div className="space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur opacity-25"></div>
            <div className="relative bg-white p-3 rounded-lg">
              <Heart className="h-8 w-8 text-red-500" />
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Welcome to Emirati Journey
          </h1>
        </div>
        
        <div className="flex items-center justify-center space-x-2">
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <Star className="h-3 w-3 me-1" />
            World's Most Advanced Career Platform
          </Badge>
        </div>

        <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Join the revolutionary AI-powered career development ecosystem designed specifically for the UAE. 
          Connect with opportunities, develop your skills, and build your future with cutting-edge technology 
          and cultural intelligence.
        </p>
      </div>

      {/* Feature Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
        {features.map((feature, index) => (
          <Card key={index} className="border-0 bg-gradient-to-br from-gray-50 to-white hover:shadow-md transition-all duration-300">
            <CardContent className="p-4 text-center">
              <div className="flex justify-center mb-3">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                  {feature.icon}
                </div>
              </div>
              <h3 className="font-semibold text-sm text-gray-900 mb-1">
                {feature.title}
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-center space-x-2 mb-3">
          <Globe className="h-5 w-5 text-blue-600" />
          <span className="font-semibold text-gray-900">Ready to Transform Your Career?</span>
        </div>
        <p className="text-sm text-gray-600">
          Join thousands of UAE professionals who are already using our platform to accelerate their careers. 
          Let's build your future together with the power of AI and community.
        </p>
      </div>
    </div>
  );
};

export default WelcomeMessage;
