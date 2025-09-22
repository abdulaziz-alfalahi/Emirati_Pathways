import React, { useState } from 'react';
import { parseCV, CVData, testGroqConnection } from '@/integrations/groq';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Upload, CheckCircle, AlertCircle, Wifi, WifiOff, Zap, FileText } from 'lucide-react';

const DebugCVParsing: React.FC = () => {
  const [isDebugging, setIsDebugging] = useState(false);
  const [debugResults, setDebugResults] = useState<any>(null);
  const [apiCallMade, setApiCallMade] = useState(false);
  const [apiStatus, setApiStatus] = useState<'unknown' | 'working' | 'failed'>('unknown');
  const [progress, setProgress] = useState(0);

  const testApiFirst = async () => {
    try {
      console.log('🧪 Testing Groq API connection...');
      const isWorking = await testGroqConnection();
      setApiStatus(isWorking ? 'working' : 'failed');
      console.log('🧪 API Status:', isWorking ? '✅ Working' : '❌ Failed');
      return isWorking;
    } catch (error) {
      console.error('❌ API test failed:', error);
      setApiStatus('failed');
      return false;
    }
  };

  const debugParseCV = async (file: File) => {
    setIsDebugging(true);
    setApiCallMade(false);
    setDebugResults(null);
    setProgress(0);

    try {
      console.log('🔍 DEBUG: Starting CV parsing debug...');
      
      // Step 1: Test API
      setProgress(20);
      const apiWorking = await testApiFirst();
      
      // Check if API key is available
      const apiKey = import.meta.env.VITE_GROQ_API_KEY;
      console.log('🔑 DEBUG: API Key available:', !!apiKey);
      console.log('🔑 DEBUG: API Key length:', apiKey?.length || 0);
      
      setProgress(40);
      
      // Monitor API calls by intercepting fetch
      const originalFetch = window.fetch;
      let apiCallDetected = false;
      
      window.fetch = async (...args) => {
        const url = args[0]?.toString() || '';
        if (url.includes('groq') || url.includes('api.groq.com')) {
          console.log('🌐 DEBUG: Groq API call detected!', url);
          apiCallDetected = true;
          setApiCallMade(true);
        }
        return originalFetch(...args);
      };

      setProgress(60);

      // Call parseCV with detailed logging
      console.log('📄 DEBUG: Calling parseCV...');
      const startTime = Date.now();
      
      try {
        const result = await parseCV(file);
        
        const endTime = Date.now();
        console.log(`⏱️ DEBUG: Parsing took ${endTime - startTime}ms`);
        
        // Restore original fetch
        window.fetch = originalFetch;
        
        setProgress(100);
        
        setDebugResults({
          success: true,
          apiCallMade: apiCallDetected,
          apiWorking: apiWorking,
          processingTime: endTime - startTime,
          resultData: result,
          dataQuality: {
            hasPersonalInfo: !!result.personalInfo?.fullName,
            hasEmail: !!result.personalInfo?.email,
            hasPhone: !!result.personalInfo?.phone,
            experienceCount: result.experience?.length || 0,
            educationCount: result.education?.length || 0,
            skillsCount: (result.skills?.technical?.length || 0) + (result.skills?.soft?.length || 0)
          }
        });
        
        console.log('✅ DEBUG: Parsing completed successfully');
        console.log('📊 DEBUG: API call made:', apiCallDetected);
        console.log('📊 DEBUG: Result data:', result);
        
      } catch (parseError) {
        console.error('❌ DEBUG: parseCV function failed:', parseError);
        
        // Restore original fetch
        window.fetch = originalFetch;
        
        setProgress(100); // Complete the progress even on error
        
        setDebugResults({
          success: false,
          error: parseError instanceof Error ? parseError.message : 'parseCV function failed',
          apiCallMade: apiCallDetected,
          apiWorking: apiStatus === 'working',
          processingTime: Date.now() - startTime
        });
      }
      
    } catch (error) {
      console.error('❌ DEBUG: Parsing failed:', error);
      setDebugResults({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        apiCallMade: apiCallMade,
        apiWorking: apiStatus === 'working'
      });
    } finally {
      setIsDebugging(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      debugParseCV(file);
    }
  };

  const getApiStatusIcon = () => {
    if (apiStatus === 'working') return <Wifi className="h-4 w-4 text-green-600" />;
    if (apiStatus === 'failed') return <WifiOff className="h-4 w-4 text-red-600" />;
    return <Zap className="h-4 w-4 text-gray-400" />;
  };

  const getApiStatusText = () => {
    if (apiStatus === 'working') return 'API Connected';
    if (apiStatus === 'failed') return 'API Disconnected';
    return 'API Status Unknown';
  };

  return (
    <Card className="border-2 border-yellow-200 bg-yellow-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-yellow-600" />
          🔍 CV Parsing Debug Tool
          <Badge variant="outline" className="ml-auto bg-yellow-100 text-yellow-800">
            Testing Mode
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* API Status */}
        <div className="p-3 bg-white rounded-lg border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getApiStatusIcon()}
              <span className="text-sm font-medium">{getApiStatusText()}</span>
            </div>
            {apiCallMade && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Zap className="h-3 w-3 mr-1" />
                API Called
              </Badge>
            )}
          </div>
        </div>

        {/* File Upload */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">Upload CV for Debug Testing:</label>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            onChange={handleFileUpload}
            disabled={isDebugging}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100"
          />
        </div>

        {/* Progress */}
        {isDebugging && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>🔄 Debugging CV parsing...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Results */}
        {debugResults && (
          <div className="space-y-3">
            {/* Success/Failure Status */}
            <div className={`p-3 rounded ${debugResults.success ? 'bg-green-100 border border-green-200' : 'bg-red-100 border border-red-200'}`}>
              <h4 className="font-semibold flex items-center gap-2">
                {debugResults.success ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    ✅ Parsing Success
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    ❌ Parsing Failed
                  </>
                )}
              </h4>
            </div>

            {/* API Call Status */}
            <div className={`p-3 rounded border ${debugResults.apiCallMade ? 'bg-green-100 border-green-200' : 'bg-yellow-100 border-yellow-200'}`}>
              <h4 className="font-semibold flex items-center gap-2">
                {debugResults.apiCallMade ? (
                  <>
                    <Wifi className="h-4 w-4 text-green-600" />
                    🌐 Groq API Called Successfully
                  </>
                ) : (
                  <>
                    <WifiOff className="h-4 w-4 text-yellow-600" />
                    ⚠️ No API Call Detected
                  </>
                )}
              </h4>
              <p className="text-sm mt-1">
                {debugResults.apiCallMade 
                  ? 'The Groq API was successfully called during parsing. Your API counter should increase.' 
                  : 'No API call was made - parsing used fallback methods only. Check API key and connectivity.'}
              </p>
            </div>

            {/* API Working Status */}
            <div className={`p-3 rounded border ${debugResults.apiWorking ? 'bg-green-100 border-green-200' : 'bg-red-100 border-red-200'}`}>
              <h4 className="font-semibold">
                {debugResults.apiWorking ? '✅ API Test Passed' : '❌ API Test Failed'}
              </h4>
              <p className="text-sm mt-1">
                {debugResults.apiWorking 
                  ? 'API connectivity test was successful before parsing.' 
                  : 'API connectivity test failed. Check your API key and network connection.'}
              </p>
            </div>

            {/* Data Quality Analysis */}
            {debugResults.success && debugResults.dataQuality && (
              <div className="p-3 bg-blue-100 rounded border border-blue-200">
                <h4 className="font-semibold">📊 Data Quality Analysis</h4>
                <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                  <div>Personal Info: {debugResults.dataQuality.hasPersonalInfo ? '✅' : '❌'}</div>
                  <div>Email: {debugResults.dataQuality.hasEmail ? '✅' : '❌'}</div>
                  <div>Phone: {debugResults.dataQuality.hasPhone ? '✅' : '❌'}</div>
                  <div>Experience: {debugResults.dataQuality.experienceCount} entries</div>
                  <div>Education: {debugResults.dataQuality.educationCount} entries</div>
                  <div>Skills: {debugResults.dataQuality.skillsCount} items</div>
                </div>
              </div>
            )}

            {/* Performance Metrics */}
            {debugResults.processingTime && (
              <div className="p-3 bg-gray-100 rounded border">
                <h4 className="font-semibold">⏱️ Performance Metrics</h4>
                <p className="text-sm">Processing Time: {debugResults.processingTime}ms</p>
              </div>
            )}

            {/* Error Details */}
            {debugResults.error && (
              <div className="p-3 bg-red-100 rounded border border-red-200">
                <h4 className="font-semibold">❌ Error Details</h4>
                <p className="text-sm text-red-700">{debugResults.error}</p>
              </div>
            )}

            {/* Raw Data Preview */}
            {debugResults.success && debugResults.resultData && (
              <details className="p-3 bg-gray-50 rounded border">
                <summary className="cursor-pointer font-semibold">📄 View Raw Parsed Data</summary>
                <pre className="mt-2 text-xs overflow-auto max-h-40 bg-white p-2 rounded border">
                  {JSON.stringify(debugResults.resultData, null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="p-3 bg-blue-50 rounded border border-blue-200">
          <h4 className="font-semibold text-blue-900">🔍 Debug Instructions</h4>
          <ul className="text-sm text-blue-800 mt-1 space-y-1">
            <li>• Upload a CV file to test parsing accuracy</li>
            <li>• Check if the Groq API is being called (should show "API Called")</li>
            <li>• Verify data quality and extraction accuracy</li>
            <li>• Monitor console for detailed logging information</li>
            <li>• If API not called, check your VITE_GROQ_API_KEY environment variable</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default DebugCVParsing;

