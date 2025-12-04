import React, { useState } from 'react';

const LoginTest: React.FC = () => {
  const [email, setEmail] = useState('ahmed.almansouri@gmail.com');
  const [password, setPassword] = useState('TestPassword123!');
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testLogin = async () => {
    setLoading(true);
    setResult('Testing login...');

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5005';
      console.log('🔍 API_BASE_URL:', API_BASE_URL);
      console.log('🔍 Full URL:', `${API_BASE_URL}/api/auth/login`);

      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password
        }),
      });

      console.log('🔍 Response status:', response.status);
      console.log('🔍 Response headers:', Object.fromEntries(response.headers.entries()));

      const data = await response.json();
      console.log('🔍 Response data:', data);

      if (response.ok && data.success) {
        setResult(`✅ SUCCESS: ${data.message}\nUser: ${data.data.user.full_name}\nRole: ${data.data.user.role}`);

        // Store tokens
        localStorage.setItem('access_token', data.data.access_token);
        localStorage.setItem('refresh_token', data.data.refresh_token);
        localStorage.setItem('user', JSON.stringify(data.data.user));

      } else {
        setResult(`❌ FAILED: ${data.message || 'Unknown error'}\nStatus: ${response.status}`);
      }
    } catch (error: any) {
      console.error('🔍 Login error:', error);
      setResult(`❌ ERROR: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setResult('🚪 Logged out successfully');
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-center">🧪 Login Test</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div className="flex space-x-2">
          <button
            onClick={testLogin}
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '🔄 Testing...' : '🔐 Test Login'}
          </button>

          <button
            onClick={testLogout}
            className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700"
          >
            🚪 Logout
          </button>
        </div>

        <div className="mt-4 p-3 bg-gray-100 rounded-md">
          <h3 className="font-medium text-gray-700 mb-2">Result:</h3>
          <pre className="text-sm text-gray-600 whitespace-pre-wrap">{result || 'No test run yet'}</pre>
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded-md">
          <h3 className="font-medium text-blue-700 mb-2">Environment:</h3>
          <pre className="text-sm text-blue-600">
            VITE_API_BASE_URL: {import.meta.env.VITE_API_BASE_URL || 'undefined'}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default LoginTest;
