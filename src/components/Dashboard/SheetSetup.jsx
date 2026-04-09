import React, { useState } from 'react';
import { useSheetsData } from '../../hooks/useSheetsData';

const SheetSetup = ({ onConfigured }) => {
  const { testConnection, updateConfig, loading } = useSheetsData();
  const [urls, setUrls] = useState({
    poolData: '',
    poolRules: '',
    participants: ''
  });
  const [testResults, setTestResults] = useState(null);
  const [showInstructions, setShowInstructions] = useState(false);

  const handleUrlChange = (key, value) => {
    setUrls(prev => ({ ...prev, [key]: value }));
  };

  const handleTestConnection = async () => {
    // Update configuration with new URLs
    updateConfig(urls);

    // Test the connection
    const results = await testConnection();
    setTestResults(results);

    // If all tests passed, notify parent component
    const allPassed = results.every(result => result.status === 'success');
    if (allPassed && onConfigured) {
      onConfigured();
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-50';
      case 'error': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="golf-card max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          📊 Google Sheets Configuration
        </h2>
        <button
          onClick={() => setShowInstructions(!showInstructions)}
          className="golf-button text-sm"
        >
          {showInstructions ? 'Hide' : 'Show'} Instructions
        </button>
      </div>

      {showInstructions && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">Setup Instructions for Sheet Owner:</h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800 text-sm">
            <li>Open your Google Sheet with pool data</li>
            <li>Go to <code className="bg-blue-100 px-1 rounded">File → Share → Publish to web</code></li>
            <li>For each sheet/tab (Pool Data, Rules, Participants):</li>
            <li className="ml-4">• Select the specific sheet from dropdown</li>
            <li className="ml-4">• Choose "Comma-separated values (.csv)" format</li>
            <li className="ml-4">• Click "Publish" and copy the URL</li>
            <li>Paste each URL in the fields below</li>
          </ol>
          <p className="mt-3 text-sm text-blue-700">
            <strong>Note:</strong> The sheet will be publicly readable but not editable.
            Only you can still edit it in Google Sheets.
          </p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pool Data Sheet URL
          </label>
          <input
            type="url"
            value={urls.poolData}
            onChange={(e) => handleUrlChange('poolData', e.target.value)}
            placeholder="https://docs.google.com/spreadsheets/d/.../pub?gid=...&output=csv"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-golf-green focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            Main sheet with participant scores and picks
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pool Rules Sheet URL
          </label>
          <input
            type="url"
            value={urls.poolRules}
            onChange={(e) => handleUrlChange('poolRules', e.target.value)}
            placeholder="https://docs.google.com/spreadsheets/d/.../pub?gid=...&output=csv"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-golf-green focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            Sheet containing pool rules and scoring system
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Participants Sheet URL (Optional)
          </label>
          <input
            type="url"
            value={urls.participants}
            onChange={(e) => handleUrlChange('participants', e.target.value)}
            placeholder="https://docs.google.com/spreadsheets/d/.../pub?gid=...&output=csv"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-golf-green focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            Detailed participant information (can be same as Pool Data)
          </p>
        </div>
      </div>

      <div className="mt-6">
        <button
          onClick={handleTestConnection}
          disabled={loading || !urls.poolData}
          className="golf-button w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Testing Connection...' : 'Test Connection & Save'}
        </button>
      </div>

      {testResults && (
        <div className="mt-6">
          <h3 className="font-semibold text-gray-900 mb-3">Connection Test Results:</h3>
          <div className="space-y-2">
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg ${getStatusColor(result.status)}`}
              >
                <div className="flex justify-between items-start">
                  <span className="font-medium capitalize">{result.sheet} Sheet</span>
                  <span className="text-sm">
                    {result.status === 'success' ? '✅' : '❌'}
                  </span>
                </div>
                {result.status === 'success' ? (
                  <div className="text-sm mt-1">
                    Found {result.rowCount} rows with columns: {result.columns.join(', ')}
                  </div>
                ) : (
                  <div className="text-sm mt-1">
                    Error: {result.error}
                  </div>
                )}
              </div>
            ))}
          </div>

          {testResults.every(r => r.status === 'success') && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium">
                🎉 All sheets connected successfully!
                Your golf pool data will update every 4 hours automatically.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SheetSetup;