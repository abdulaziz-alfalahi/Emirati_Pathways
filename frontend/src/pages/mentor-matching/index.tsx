
import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import MobileLayout from '@/components/mobile/MobileLayout';
import { useMobileDetection } from '@/hooks/use-mobile-detection';
import { CareerEntryHeroSection } from '@/components/career/CareerEntryHeroSection';
import { MentorDiscovery } from '@/components/mentor-matching/MentorDiscovery';
import { MatchingAlgorithm } from '@/components/mentor-matching/MatchingAlgorithm';
import { ConnectionManager } from '@/components/mentor-matching/ConnectionManager';
import { SessionScheduler } from '@/components/mentor-matching/SessionScheduler';
import { ProgressTracker } from '@/components/mentor-matching/ProgressTracker';
import { CommunityHub } from '@/components/mentor-matching/CommunityHub';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Target, Calendar, BarChart3, Network, Star } from 'lucide-react';

const MentorMatchingPage: React.FC = () => {
  const { isMobile, isCapacitor } = useMobileDetection();
  const [activeTab, setActiveTab] = useState('discovery');

  const content = (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
      {/* Standardized Hero Section */}
      <CareerEntryHeroSection
        title="Mentor Matching"
        description="Connect with experienced professionals who will guide your career journey and unlock your full potential"
        icon={<Users className="h-12 w-12" />}
        primaryActionLabel="Find My Mentor"
        primaryActionIcon={<Target className="h-5 w-5" />}
        secondaryActionLabel="Become a Mentor"
        secondaryActionIcon={<Users className="h-5 w-5" />}
      />

      {/* Key Statistics */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-ehrdc-teal mb-2">1000+</div>
              <div className="text-gray-600">Active Mentors</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-ehrdc-teal mb-2">98%</div>
              <div className="text-gray-600">Match Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-ehrdc-teal mb-2">50+</div>
              <div className="text-gray-600">Industry Experts</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-ehrdc-teal mb-2">AI-Powered</div>
              <div className="text-gray-600">Matching Algorithm</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 mb-8 bg-white border">
            <TabsTrigger value="discovery" className="flex items-center gap-2 text-ehrdc-teal">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Discovery</span>
            </TabsTrigger>
            <TabsTrigger value="matching" className="flex items-center gap-2 text-ehrdc-teal">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Matching</span>
            </TabsTrigger>
            <TabsTrigger value="connections" className="flex items-center gap-2 text-ehrdc-teal">
              <Network className="h-4 w-4" />
              <span className="hidden sm:inline">Connections</span>
            </TabsTrigger>
            <TabsTrigger value="sessions" className="flex items-center gap-2 text-ehrdc-teal">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Sessions</span>
            </TabsTrigger>
            <TabsTrigger value="progress" className="flex items-center gap-2 text-ehrdc-teal">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Progress</span>
            </TabsTrigger>
            <TabsTrigger value="community" className="flex items-center gap-2 text-ehrdc-teal">
              <Star className="h-4 w-4" />
              <span className="hidden sm:inline">Community</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="discovery">
            <MentorDiscovery />
          </TabsContent>
          
          <TabsContent value="matching">
            <MatchingAlgorithm />
          </TabsContent>
          
          <TabsContent value="connections">
            <ConnectionManager />
          </TabsContent>
          
          <TabsContent value="sessions">
            <SessionScheduler />
          </TabsContent>
          
          <TabsContent value="progress">
            <ProgressTracker />
          </TabsContent>
          
          <TabsContent value="community">
            <CommunityHub />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );

  if (isMobile || isCapacitor) {
    return <MobileLayout>{content}</MobileLayout>;
  }

  return <Layout>{content}</Layout>;
};

export default MentorMatchingPage;
