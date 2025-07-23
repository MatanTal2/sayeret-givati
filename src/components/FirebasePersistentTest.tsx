'use client';

import React, { useState } from 'react';
import { auth } from '@/lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';

export default function SimpleUserTest() {
  const [status, setStatus] = useState<string>('Ready to test user creation...');
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  // Simple test credentials
  const TEST_EMAIL = 'simple-test@example.com';
  const TEST_PASSWORD = 'TestPassword123!';

  const addResult = (message: string, success: boolean = true) => {
    const emoji = success ? '✅' : '❌';
    const result = `${emoji} ${message}`;
    setTestResults(prev => [...prev, result]);
    setStatus(result);
    console.log(result);
  };

  const testCreateUser = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setTestResults([]);
    setStatus('Starting user creation test...');

    try {
      addResult('🚀 Starting test...');

      // Step 1: Try to create user
      addResult(`📧 Creating user with email: ${TEST_EMAIL}`);
      
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);
        addResult(`✅ User created successfully!`);
        addResult(`👤 User ID: ${userCredential.user.uid}`);
        addResult(`📧 User Email: ${userCredential.user.email}`);
        addResult(`🔑 Email Verified: ${userCredential.user.emailVerified}`);

        // Step 2: Check if we're connected
        if (auth.currentUser) {
          addResult(`✅ Connected! Current user: ${auth.currentUser.email}`);
        } else {
          addResult('❌ Not connected - no current user', false);
        }

        // Step 3: Sign out and clean up
        await signOut(auth);
        addResult('✅ Signed out successfully');

        addResult('🎉 Test completed successfully!');

      } catch (createError: unknown) {
        if (createError instanceof Error) {
          addResult(`📋 Error details: ${createError.message}`, false);
          
          if (
            typeof createError === 'object' &&
            createError !== null &&
            'code' in createError &&
            typeof (createError as { code?: unknown }).code === 'string'
          ) {
            const firebaseError = createError as { code: string };
            addResult(`📋 Error code: ${firebaseError.code}`, false);

            if (firebaseError.code === 'auth/email-already-in-use') {
              addResult('👤 User already exists - trying to sign in instead...');
              
              try {
                const userCredential = await signInWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);
                addResult(`✅ Signed in successfully!`);
                addResult(`👤 User ID: ${userCredential.user.uid}`);
                addResult(`📧 User Email: ${userCredential.user.email}`);
                
                // Check connection
                if (auth.currentUser) {
                  addResult(`✅ Connected! Current user: ${auth.currentUser.email}`);
                } else {
                  addResult('❌ Not connected - no current user', false);
                }

                // Clean up
                await signOut(auth);
                addResult('✅ Signed out successfully');
                addResult('🎉 Test completed successfully!');

              } catch (signInError) {
                addResult(`❌ Sign in also failed: ${signInError}`, false);
              }
            }
          }
        } else {
          addResult(`❌ User creation failed: ${createError}`, false);
        }
      }

    } catch (error) {
      addResult(`❌ Test failed: ${error}`, false);
    } finally {
      setIsRunning(false);
    }
  };

  const checkFirebaseConfig = () => {
    setTestResults([]);
    addResult('🔍 Checking Firebase configuration...');
    addResult(`🔥 Project ID: ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}`);
    addResult(`🌐 Auth Domain: ${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}`);
    addResult(`🔑 API Key: ${process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'Set' : 'Missing'}`);
    addResult(`📧 Test Email: ${TEST_EMAIL}`);
    addResult(`🔑 Test Password: ${TEST_PASSWORD}`);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-800 rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-6 text-white">🧪 Simple User Creation Test</h1>
      
      <div className="space-y-4">
        <div className="bg-blue-900/50 border border-blue-700 p-4 rounded-lg">
          <h2 className="font-semibold text-blue-200">What This Test Does:</h2>
          <div className="text-blue-100 text-sm space-y-1">
            <div>1. Creates a user with email and password</div>
            <div>2. Checks if we&apos;re connected/authenticated</div>
            <div>3. Signs out and cleans up</div>
            <div>4. That&apos;s it! Simple and focused.</div>
          </div>
        </div>

        <div className="bg-green-900/50 border border-green-700 p-4 rounded-lg">
          <h2 className="font-semibold text-green-200">Current Status:</h2>
          <p className="text-green-100">{status}</p>
        </div>

        <div className="flex gap-4">
          <button
            onClick={checkFirebaseConfig}
            disabled={isRunning}
            className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-500 transition-colors shadow-lg disabled:opacity-50"
          >
            🔍 Check Config
          </button>
          <button
            onClick={testCreateUser}
            disabled={isRunning}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-500 transition-colors shadow-lg disabled:opacity-50"
          >
            🧪 Test User Creation
          </button>
        </div>

        <div className="bg-gray-700 border border-gray-600 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-200 mb-3">Test Results:</h3>
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-gray-400">No tests run yet...</p>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="font-mono text-sm text-gray-100 bg-gray-800 p-2 rounded border border-gray-600">
                  {result}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 