import React, { useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, auth } from '../../services/firebase';

const StorageDebug: React.FC = () => {
  const [testResult, setTestResult] = useState<string>('');
  const [isTestingAuth, setIsTestingAuth] = useState(false);
  const [isTestingStorage, setIsTestingStorage] = useState(false);

  const testAuthentication = async () => {
    setIsTestingAuth(true);
    setTestResult('Testing authentication...');

    try {
      const user = auth.currentUser;
      if (!user) {
        setTestResult('❌ No authenticated user found');
        return;
      }

      const token = await user.getIdToken();
      const decodedToken = JSON.parse(atob(token.split('.')[1]));

      setTestResult(`✅ User authenticated successfully:
        - UID: ${user.uid}
        - Email: ${user.email}
        - Email Verified: ${user.emailVerified}
        - Token expires: ${new Date(decodedToken.exp * 1000).toLocaleString()}
        - Custom claims: ${JSON.stringify(decodedToken, null, 2)}`);
    } catch (error) {
      setTestResult(`❌ Authentication error: ${error}`);
    } finally {
      setIsTestingAuth(false);
    }
  };

  const testStorageUpload = async () => {
    setIsTestingStorage(true);
    setTestResult('Testing storage upload...');

    try {
      const user = auth.currentUser;
      if (!user) {
        setTestResult('❌ Please login first');
        return;
      }

      // Create a test text file
      const testContent = `Test upload at ${new Date().toISOString()}`;
      const testFile = new Blob([testContent], { type: 'text/plain' });

      const fileName = `debug_test_${Date.now()}.txt`;

      // Test different paths
      const pathsToTest = [
        `products/${fileName}`,
        `images/${fileName}`,
        `uploads/${fileName}`,
        `test/${fileName}`,
        fileName // root
      ];

      let results = [];

      for (const path of pathsToTest) {
        try {
          const storageRef = ref(storage, path);

          console.log(`Testing path: ${path}`);
          setTestResult(prev => prev + `\n🔄 Testing path: ${path}`);

          const snapshot = await uploadBytes(storageRef, testFile);
          const downloadURL = await getDownloadURL(snapshot.ref);

          results.push(`✅ SUCCESS: ${path} -> ${downloadURL}`);
          console.log(`Success: ${path}`);

          // If one succeeds, we can break
          break;
        } catch (error: any) {
          results.push(`❌ FAILED: ${path} -> ${error.code}: ${error.message}`);
          console.error(`Failed: ${path}`, error);
        }
      }

      setTestResult(`Storage test results:\n${results.join('\n')}`);

    } catch (error) {
      setTestResult(`❌ Storage test error: ${error}`);
    } finally {
      setIsTestingStorage(false);
    }
  };

  const testStorageConfig = async () => {
    try {
      const config = storage.app.options;

      // Test storage bucket URLs
      const possibleBuckets = [
        config.storageBucket,
        `${config.projectId}.appspot.com`,
        `${config.projectId}.firebasestorage.app`
      ];

      let bucketTestResults = [];
      for (const bucket of possibleBuckets) {
        try {
          const response = await fetch(`https://firebasestorage.googleapis.com/v0/b/${bucket}/o`);
          bucketTestResults.push(`✅ ${bucket}: ${response.status} ${response.statusText}`);
        } catch (error) {
          bucketTestResults.push(`❌ ${bucket}: Network Error`);
        }
      }

      setTestResult(`Firebase Storage Configuration:
        - Project ID: ${config.projectId}
        - Storage Bucket: ${config.storageBucket}
        - Auth Domain: ${config.authDomain}
        - API Key: ${config.apiKey?.substring(0, 10)}...
        - Storage Instance: ${storage.toString()}
        - Storage App: ${storage.app.name}

        Bucket Connectivity Tests:
        ${bucketTestResults.join('\n        ')}`);
    } catch (error) {
      setTestResult(`❌ Config error: ${error}`);
    }
  };

  const clearResults = () => {
    setTestResult('');
  };

  return (
    <div className="p-4 bg-white border border-gray-200 rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Firebase Storage Debug Tools</h3>

      <div className="space-y-3 mb-4">
        <button
          onClick={testStorageConfig}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Test Storage Config
        </button>

        <button
          onClick={testAuthentication}
          disabled={isTestingAuth}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          {isTestingAuth ? 'Testing Auth...' : 'Test Authentication'}
        </button>

        <button
          onClick={testStorageUpload}
          disabled={isTestingStorage}
          className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
        >
          {isTestingStorage ? 'Testing Upload...' : 'Test Storage Upload'}
        </button>

        <button
          onClick={clearResults}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Clear Results
        </button>
      </div>

      {testResult && (
        <div className="mt-4 p-4 bg-gray-100 rounded-lg">
          <h4 className="font-medium mb-2">Debug Results:</h4>
          <pre className="text-sm whitespace-pre-wrap font-mono">{testResult}</pre>
        </div>
      )}
    </div>
  );
};

export default StorageDebug;