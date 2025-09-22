import React from 'react';

const TestCareerPlanningHub: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-teal-600">
          Career Planning Hub - Test Page
        </h1>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Career Explorer</h2>
            <p className="text-gray-600">Discover your ideal career path with AI-powered guidance.</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Skill Assessment</h2>
            <p className="text-gray-600">Evaluate your skills and identify areas for growth.</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Job Market</h2>
            <p className="text-gray-600">Explore current job opportunities in the UAE market.</p>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-lg text-gray-700">
            This is a test page to verify the Career Planning Hub is loading correctly.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TestCareerPlanningHub;
