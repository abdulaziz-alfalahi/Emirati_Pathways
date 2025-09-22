import React from 'react';
import LoginTest from '../components/auth/LoginTest';

const LoginTestPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">Authentication Test Page</h1>
        <LoginTest />
      </div>
    </div>
  );
};

export default LoginTestPage;
