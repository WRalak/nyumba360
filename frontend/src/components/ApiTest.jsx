import React, { useState } from 'react';
import { propertyAPI, authAPI } from '../services/api';

const ApiTest = () => {
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const addResult = (test, success, message, data = null) => {
    setTestResults(prev => [...prev, {
      test,
      success,
      message,
      data,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  const testConnection = async () => {
    setLoading(true);
    setTestResults([]);

    // Test 1: API Connection
    try {
      const response = await propertyAPI.getAll();
      addResult('API Connection', true, 'Successfully connected to API', response);
    } catch (error) {
      addResult('API Connection', false, `Connection failed: ${error.message}`);
    }

    // Test 2: Auth API
    try {
      const response = await authAPI.getProfile();
      addResult('Auth API', true, 'Auth API working', response);
    } catch (error) {
      addResult('Auth API', false, `Auth API failed: ${error.message}`);
    }

    // Test 3: Properties API
    try {
      const response = await propertyAPI.getStats('test-user');
      addResult('Properties API', true, 'Properties API working', response);
    } catch (error) {
      addResult('Properties API', false, `Properties API failed: ${error.message}`);
    }

    setLoading(false);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">API Integration Test</h3>
        <div className="space-x-2">
          <button
            onClick={clearResults}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
          >
            Clear
          </button>
          <button
            onClick={testConnection}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test APIs'}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {testResults.map((result, index) => (
          <div
            key={index}
            className={`p-3 rounded border ${
              result.success
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="font-medium">{result.test}</span>
                <span className={`ml-2 text-sm ${
                  result.success ? 'text-green-600' : 'text-red-600'
                }`}>
                  {result.success ? 'SUCCESS' : 'FAILED'}
                </span>
              </div>
              <span className="text-xs text-gray-500">{result.timestamp}</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">{result.message}</p>
            {result.data && (
              <details className="mt-2">
                <summary className="text-sm font-medium cursor-pointer">Response Data</summary>
                <pre className="text-xs bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </details>
            )}
          </div>
        ))}
      </div>

      {testResults.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          Click "Test APIs" to check the integration
        </div>
      )}
    </div>
  );
};

export default ApiTest;
