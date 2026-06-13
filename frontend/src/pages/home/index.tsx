import React from 'react';
import Layout from '@/components/layout/Layout';
import Hero from '@/components/home/Hero';
import HomeContent from '@/components/home/HomeContent';
import HomeGridSection from '@/components/home/HomeGridSection';
import { useAuth } from '@/context/AuthContext';

const HomePage: React.FC = () => {
  const { user } = useAuth();
  
  // Check if user is a student based on email (simplified for now)
  const isStudent = user?.email && user.email.includes('candidate');

  return (
    <Layout>
      <Hero />
      <HomeContent />
      <HomeGridSection />
    </Layout>
  );
};

export default HomePage;
