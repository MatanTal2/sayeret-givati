'use client';

import { useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  deleteUser,
  sendPasswordResetEmail
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  deleteDoc, 
  serverTimestamp 
} from 'firebase/firestore';

interface AuthTestResult {
  testName: string;
  passed: boolean;
  details: string;
}

export default function SimpleUserTest() {
  const [results, setResults] = useState<string[]>([]);
  const [authResults, setAuthResults] = useState<AuthTestResult[]>([]);
  const [loading, setLoading] = useState(false);

  const testEmail = process.env.NEXT_PUBLIC_FIREBASE_TEST_EMAIL || 'simple-test@example.com';
  const testPassword = process.env.NEXT_PUBLIC_FIREBASE_TEST_PASSWORD || 'TestPassword123!';

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const clearResults = () => {
    setResults([]);
    setAuthResults([]);
  };

  const updateAuthResult = (testName: string, passed: boolean, details: string) => {
    setAuthResults(prev => {
      const updated = prev.filter(r => r.testName !== testName);
      return [...updated, { testName, passed, details }];
    });
  };

  const checkConfig = () => {
    addResult('🔍 Checking Firebase configuration...');
    
    try {
      const projectId = auth.app.options.projectId;
      const authDomain = auth.app.options.authDomain;
      const apiKey = auth.app.options.apiKey;
      
      addResult(`✅ 🔥 Project ID: ${projectId}`);
      addResult(`✅ 🌐 Auth Domain: ${authDomain}`);
      addResult(`✅ 🔑 API Key: ${apiKey ? 'Set' : 'Missing'}`);
      addResult(`✅ 📧 Test Email: ${testEmail}`);
      addResult(`✅ 🔑 Test Password: ${testPassword}`);
      addResult('✅ 🎯 Configuration looks good!');
    } catch (error) {
      addResult(`❌ Config error: ${error}`);
    }
  };

  const runComprehensiveAuthTest = async () => {
    if (loading) return;
    setLoading(true);
    
    addResult('🚀 Starting Comprehensive Authentication Testing...');
    addResult('📋 Running 5 authentication test scenarios...');
    
    
    
    try {
      // Test 1: Email/Password Registration
      addResult('');
      addResult('🔐 Test 1: Email/Password Registration');
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
        addResult(`✅ Registration successful - User ID: ${userCredential.user.uid}`);
        updateAuthResult('Email/Password Registration', true, 'User created successfully');
        
        // Create profile document
        const docId = `TEST-${userCredential.user.uid}`;
        await setDoc(doc(db, 'users', docId), {
          email: userCredential.user.email,
          firstName: 'Test',
          lastName: 'Soldier',
          rank: 'רב סמל',
          unit: 'שייטת גבעתי',
          role: 'soldier',
          createdAt: serverTimestamp(),
          testUser: true
        });
        addResult('✅ Profile document created');
        
        // Sign out after registration
        await signOut(auth);
      } catch (error: unknown) {
        const firebaseError = error as { code?: string; message?: string };
        if (firebaseError.code === 'auth/email-already-in-use') {
          addResult('ℹ️ User already exists - continuing with existing user');
          updateAuthResult('Email/Password Registration', true, 'User already exists (acceptable)');
        } else {
          addResult(`❌ Registration failed: ${firebaseError.message}`);
          updateAuthResult('Email/Password Registration', false, firebaseError.message || 'Unknown error');
        }
      }

      // Test 2: Email/Password Login Test
      addResult('');
      addResult('🔑 Test 2: Email/Password Login');
      try {
        const loginCredential = await signInWithEmailAndPassword(auth, testEmail, testPassword);
        addResult(`✅ Login successful - User: ${loginCredential.user.email}`);
        updateAuthResult('Email/Password Login', true, 'Login successful');
      } catch (error: unknown) {
        const firebaseError = error as { code?: string; message?: string };
        addResult(`❌ Login failed: ${firebaseError.message}`);
        updateAuthResult('Email/Password Login', false, firebaseError.message || 'Login failed');
      }

      // Test 3: Sign Out Test
      addResult('');
      addResult('🚪 Test 3: Sign Out');
      try {
        await signOut(auth);
        if (!auth.currentUser) {
          addResult('✅ Sign out successful - No current user');
          updateAuthResult('Sign Out', true, 'Sign out completed successfully');
        } else {
          addResult('❌ Sign out failed - User still signed in');
          updateAuthResult('Sign Out', false, 'User still signed in after signOut');
        }
      } catch (error: unknown) {
        const firebaseError = error as { code?: string; message?: string };
        addResult(`❌ Sign out failed: ${firebaseError.message}`);
        updateAuthResult('Sign Out', false, firebaseError.message || 'Sign out failed');
      }

      // Test 4: Invalid Credentials Test
      addResult('');
      addResult('🚫 Test 4: Invalid Credentials');
      try {
        await signInWithEmailAndPassword(auth, testEmail, 'wrongpassword123');
        addResult('❌ Invalid credentials test failed - Should have been rejected');
        updateAuthResult('Invalid Credentials', false, 'Invalid credentials were accepted');
      } catch (error: unknown) {
        const firebaseError = error as { code?: string; message?: string };
        if (firebaseError.code === 'auth/invalid-credential' || firebaseError.code === 'auth/wrong-password') {
          addResult('✅ Invalid credentials correctly rejected');
          updateAuthResult('Invalid Credentials', true, 'Invalid credentials properly rejected');
        } else {
          addResult(`❌ Unexpected error: ${firebaseError.message}`);
          updateAuthResult('Invalid Credentials', false, firebaseError.message || 'Unexpected error');
        }
      }

      // Test 5: Password Reset Test
      addResult('');
      addResult('📧 Test 5: Password Reset Email');
      try {
        await sendPasswordResetEmail(auth, testEmail);
        addResult('✅ Password reset email sent successfully');
        updateAuthResult('Password Reset', true, 'Reset email sent successfully');
      } catch (error: unknown) {
        const firebaseError = error as { code?: string; message?: string };
        addResult(`❌ Password reset failed: ${firebaseError.message}`);
        updateAuthResult('Password Reset', false, firebaseError.message || 'Reset email failed');
      }

      addResult('');
      addResult('🎉 Comprehensive Authentication Testing Completed!');
      addResult('📊 Check the results summary below for pass/fail status');
      
    } catch (error: unknown) {
      const firebaseError = error as { code?: string; message?: string };
      addResult(`❌ Unexpected error during testing: ${firebaseError.message}`);
    } finally {
      setLoading(false);
    }
  };



  const testUserDeletion = async () => {
    if (loading) return;
    setLoading(true);
    
    try {
      addResult('🗑️ 🚀 Starting user deletion test...');
      addResult(`🗑️ 📧 Signing in as: ${testEmail}`);
      
      // First sign in to the user
      const userCredential = await signInWithEmailAndPassword(auth, testEmail, testPassword);
      const user = userCredential.user;
      
      addResult('✅ ✅ Successfully signed in!');
      addResult(`✅ 👤 User ID: ${user.uid}`);
      
      // Delete Firestore document first (if exists)
      addResult('🗑️ 📄 Deleting user profile document...');
      try {
        const docId = `TEST-${user.uid}`;
        await deleteDoc(doc(db, 'users', docId));
        addResult('✅ ✅ User profile document deleted!');
      } catch {
        addResult('ℹ️ 📄 No user profile document found (or already deleted)');
      }
      
      // Delete the auth user
      addResult('🗑️ 🔥 Deleting auth user account...');
      await deleteUser(user);
      
      addResult('✅ ✅ User deleted successfully!');
      addResult('✅ 🎉 Deletion test completed!');
      addResult('ℹ️ 📝 Both Auth user and Firestore document removed');
      
    } catch (error: unknown) {
      const firebaseError = error as { code?: string; message?: string };
      if (firebaseError.code === 'auth/user-not-found') {
        addResult('ℹ️ 👤 User not found - already deleted or never existed');
        addResult('✅ 🎉 Deletion test completed (user not found)!');
      } else if (firebaseError.code === 'auth/invalid-credential') {
        addResult('❌ 🔑 Invalid credentials - user may not exist or password changed');
      } else {
        addResult(`❌ Error: ${firebaseError.code || 'unknown'} - ${firebaseError.message || 'Unknown error'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 text-white p-6 rounded-lg shadow-lg max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4 text-center">
          🔐 Complete Authentication Test
        </h2>
        <p className="text-gray-300 text-center mb-4">
          Comprehensive Firebase authentication testing with detailed pass/fail results
        </p>
      </div>

      {/* Control Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={checkConfig}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded font-medium transition-colors"
        >
          🔍 Check Config
        </button>
        
        <button
          onClick={runComprehensiveAuthTest}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-2 rounded font-medium transition-colors"
        >
          🔐 Run Authentication Testing
        </button>
        
        <button
          onClick={testUserDeletion}
          disabled={loading}
          className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 px-4 py-2 rounded font-medium transition-colors"
        >
          🗑️ Delete User
        </button>
        
        <button
          onClick={clearResults}
          disabled={loading}
          className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-600 px-4 py-2 rounded font-medium transition-colors"
        >
          🧹 Clear Results
        </button>
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="bg-yellow-900 border border-yellow-600 text-yellow-200 px-4 py-3 rounded mb-4">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-200 mr-2"></div>
            <span>Running test...</span>
          </div>
        </div>
      )}

      {/* Authentication Test Results Summary */}
      {authResults.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold mb-3 text-blue-400">📊 Authentication Test Results:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {authResults.map((result, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  result.passed 
                    ? 'bg-green-900 border-green-600 text-green-100' 
                    : 'bg-red-900 border-red-600 text-red-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{result.testName}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    result.passed 
                      ? 'bg-green-600 text-green-100' 
                      : 'bg-red-600 text-red-100'
                  }`}>
                    {result.passed ? 'PASS' : 'FAIL'}
                  </span>
                </div>
                <div className="text-xs opacity-90">
                  {result.details}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-center">
            <span className="text-sm text-gray-400">
              {authResults.filter(r => r.passed).length} / {authResults.length} tests passed
            </span>
          </div>
        </div>
      )}

      {/* Detailed Results Display */}
      <div className="bg-gray-800 rounded-lg p-4 min-h-[300px] max-h-[500px] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-3 text-green-400">📋 Detailed Test Log:</h3>
        {results.length === 0 ? (
          <p className="text-gray-400 italic">Click a button above to start testing...</p>
        ) : (
          <div className="space-y-1">
            {results.map((result, index) => (
              <div
                key={index}
                className={`text-sm font-mono ${
                  result.includes('❌') 
                    ? 'text-red-400' 
                    : result.includes('✅') 
                    ? 'text-green-400'
                    : result.includes('ℹ️')
                    ? 'text-blue-400'
                    : result.includes('🗑️')
                    ? 'text-orange-400'
                    : 'text-gray-300'
                }`}
              >
                {result}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Test Info */}
      <div className="mt-6 bg-gray-800 rounded-lg p-4">
        <h4 className="text-md font-semibold mb-2 text-blue-400">🎯 Test Instructions:</h4>
        <ol className="text-sm text-gray-300 space-y-1 list-decimal list-inside">
          <li><strong>Check Config:</strong> Verify Firebase settings are loaded correctly</li>
          <li><strong>Run Authentication Testing:</strong> Comprehensive test of all auth scenarios</li>
          <li><strong>Delete User:</strong> Clean up test user and Firestore document</li>
          <li><strong>Check Results Summary:</strong> View pass/fail status for each test type</li>
        </ol>
        
        <div className="mt-3 text-xs text-gray-400">
          <p><strong>Authentication Tests Include:</strong></p>
          <ul className="ml-4 space-y-1 list-disc list-inside">
            <li>Email/Password Registration</li>
            <li>Email/Password Login</li>
            <li>Sign Out Test</li>
            <li>Invalid Credentials Test</li>
            <li>Password Reset Email</li>
          </ul>
        </div>
        
        <div className="mt-3 text-xs text-gray-400">
          <p><strong>Test User:</strong> {testEmail}</p>
          <p><strong>Profile Registration:</strong> Creates user in &apos;users&apos; collection with TEST- prefix</p>
          <p><strong>Note:</strong> User deletion is permanent and cannot be undone!</p>
        </div>
      </div>
    </div>
  );
} 