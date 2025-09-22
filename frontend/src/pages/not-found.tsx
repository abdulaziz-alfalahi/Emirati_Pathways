
import React from 'react';
import Layout from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  return (
    <Layout>
      <div className="container mx-auto py-16 flex flex-col items-center justify-center">
        <h1 className="text-6xl font-bold">404</h1>
        <p className="text-xl mt-4">Page not found</p>
        <p className="text-gray-500 mt-2 mb-8">The page you're looking for doesn't exist or has been moved.</p>
        <Button asChild>
          <Link to="/">Return to home</Link>
        </Button>
      </div>
    </Layout>
  );
};

export default NotFoundPage;
