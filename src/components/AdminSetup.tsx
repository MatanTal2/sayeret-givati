'use client';

import { useState } from 'react';
import { TEXT_CONSTANTS } from '@/constants/text';
import { auth } from '@/lib/firebase';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { ADMIN_CONFIG } from '@/constants/admin';

export default function AdminSetup() {
  const [status, setStatus] = useState<string>('Ready to create admin user...');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreated, setIsCreated] = useState(false);
  const [password, setPassword] = useState('');

  const adminEmail = ADMIN_CONFIG.EMAIL;


  const createAdminUser = async () => {
    if (isLoading || !password.trim()) return;
    
    setIsLoading(true);
    setStatus('Creating admin user...');

    try {
      // Create the admin user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, password);
      
      setStatus(`✅ Admin user created successfully!`);
      setIsCreated(true);
      
      console.log('Admin user created:', {
        uid: userCredential.user.uid,
        email: userCredential.user.email
      });

      // Sign out immediately after creation
      await signOut(auth);
      setStatus(`✅ Admin user created! You can now login with: ${adminEmail}`);
      
    } catch (error: unknown) {
      const firebaseError = error as { code?: string; message?: string };
      
      if (firebaseError.code === 'auth/email-already-in-use') {
        setStatus(`ℹ️ Admin user already exists! You can login with: ${adminEmail}`);
        setIsCreated(true);
      } else {
        setStatus(`❌ Failed to create admin user: ${firebaseError.message}`);
        console.error('Admin creation error:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-neutral-800 rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-6 text-white">🔧 Admin User Setup</h1>
      
      <div className="space-y-4">
        <div className="bg-info-900/50 border border-info-700 p-4 rounded-lg">
          <h2 className="font-semibold text-info-200 mb-2">Setup Instructions:</h2>
          <div className="text-info-100 text-sm space-y-1">
            <div>1. This will create the admin user in Firebase Authentication</div>
            <div>2. Email: <code className="bg-info-800 px-1 rounded">{adminEmail}</code></div>
            <div>3. Enter a secure password below</div>
            <div>4. After creation, you can login to the admin panel</div>
          </div>
        </div>

        <div className="bg-success-900/50 border border-success-700 p-4 rounded-lg">
          <h2 className="font-semibold text-success-200 mb-2">Status:</h2>
          <p className="text-success-100">{status}</p>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="adminPassword" className="block text-white font-medium mb-2">
              Admin Password:
            </label>
            <input
              type="password"
              id="adminPassword"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={TEXT_CONSTANTS.ADMIN_COMPONENTS.ADMIN_PASSWORD_PLACEHOLDER}
              disabled={isLoading || isCreated}
              className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg 
                       text-white placeholder-neutral-400 focus:ring-2 focus:ring-info-500 
                       focus:border-info-500 outline-none transition-colors
                       disabled:bg-neutral-800 disabled:cursor-not-allowed"
              required
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={createAdminUser}
              disabled={isLoading || isCreated || !password.trim()}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                isLoading || isCreated || !password.trim()
                  ? 'bg-neutral-600 text-neutral-400 cursor-not-allowed'
                  : 'bg-info-600 hover:bg-info-700 text-white'
              }`}
            >
              {isLoading ? '⏳ Creating...' : isCreated ? '✅ Created' : '🔧 Create Admin User'}
            </button>

            {isCreated && (
              <a
                href="/admin"
                className="px-6 py-2 bg-success-600 hover:bg-success-700 text-white rounded-lg font-medium transition-colors"
              >
                🚀 Go to Admin Login
              </a>
            )}
          </div>
        </div>

        {isCreated && (
          <div className="bg-warning-900/50 border border-warning-700 p-4 rounded-lg">
            <h2 className="font-semibold text-warning-200 mb-2">⚠️ Important Next Steps:</h2>
            <div className="text-warning-100 text-sm space-y-1">
              <div>• You must set the userType to &quot;admin&quot; in the Firestore users collection</div>
              <div>• Navigate to Firestore → users collection → find this user → set userType: &quot;admin&quot;</div>
              <div>• Remember to change the default password after first login</div>
              <div>• This setup component should be removed in production</div>
              <div>• Store admin credentials securely</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 