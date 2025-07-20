'use client';

import { useState } from 'react';
import SimpleUserTest from '@/components/SimpleUserTest';
import FirebasePersistentTest from '@/components/FirebasePersistentTest';

// TypeScript interface for test components
interface TestComponent {
  id: string;
  name: string;
  description: string;
  component: React.ComponentType;
  category: string;
  badge?: string;
}

// Define available test components
const testComponents: TestComponent[] = [
  {
    id: 'simple-user',
    name: '🔐 Complete Authentication Test',
    description: 'Comprehensive auth testing: registration, login, sign out, invalid credentials, password reset',
    component: SimpleUserTest,
    category: 'Core Testing',
    badge: 'Main'
  },
  {
    id: 'equipment-management',
    name: '🎖️ Equipment Management Test',
    description: 'Test equipment creation, transfer, tracking, and military workflows',
    component: FirebasePersistentTest, // Will be replaced with EquipmentTest
    category: 'Military Features',
    badge: 'Coming Soon'
  }
  // Future test components can be added here:
  // {
  //   id: 'equipment-test',
  //   name: '🎖️ Equipment Management',
  //   description: 'Test equipment creation, transfer, and tracking',
  //   component: EquipmentTest,
  //   category: 'Military Features'
  // },
  // {
  //   id: 'approval-test', 
  //   name: '📱 OTP Approval Test',
  //   description: 'Test OTP-based approval workflows',
  //   component: ApprovalTest,
  //   category: 'Military Features'
  // }
];

export default function FirebaseTestPage() {
  const [activeTest, setActiveTest] = useState(testComponents[0].id);
  
  const ActiveComponent = testComponents.find(t => t.id === activeTest)?.component || SimpleUserTest;
  const activeTestInfo = testComponents.find(t => t.id === activeTest);

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Sidebar Navigation */}
      <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-2xl font-bold text-white mb-2">
            🔥 Firebase Tests
          </h1>
          <p className="text-gray-400 text-sm">
            Select a test component to run
          </p>
        </div>

        {/* Test Categories */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Group tests by category */}
          {['Core Testing', 'Military Features'].map(category => (
            <div key={category}>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                {category}
              </h3>
              <div className="space-y-1">
                {testComponents
                  .filter(test => test.category === category)
                  .map(test => (
                    <button
                      key={test.id}
                      onClick={() => setActiveTest(test.id)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        activeTest === test.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-medium text-sm">
                          {test.name}
                        </div>
                        {test.badge && (
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            test.badge === 'Main' 
                              ? 'bg-green-600 text-green-100'
                              : 'bg-yellow-600 text-yellow-100'
                          }`}>
                            {test.badge}
                          </span>
                        )}
                      </div>
                      <div className="text-xs opacity-75">
                        {test.description}
                      </div>
                    </button>
                  ))
                }
              </div>
            </div>
          ))}
          
          {/* Coming Soon Section */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Future Tests
            </h3>
            <div className="space-y-1">
              <div className="w-full text-left p-3 rounded-lg bg-gray-800 text-gray-500 cursor-not-allowed">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-medium text-sm">
                    📱 OTP Approval Test
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded bg-gray-600 text-gray-300">
                    Soon
                  </span>
                </div>
                <div className="text-xs opacity-75">
                  Test OTP-based approval workflows for equipment transfers
                </div>
              </div>
              
              <div className="w-full text-left p-3 rounded-lg bg-gray-800 text-gray-500 cursor-not-allowed">
                <div className="flex items-center justify-between mb-1">
                  <div className="font-medium text-sm">
                    🛡️ Role Permissions Test
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded bg-gray-600 text-gray-300">
                    Later
                  </span>
                </div>
                <div className="text-xs opacity-75">
                  Test military role-based access control and permissions
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="p-4 border-t border-gray-700">
          <div className="text-xs text-gray-500">
            <p className="mb-1">🎯 Active Test:</p>
            <p className="font-medium text-gray-400">{activeTestInfo?.name}</p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        {/* Active Test Header */}
                 <div className="bg-gray-800 border-b border-gray-700 p-6">
           <div className="max-w-6xl mx-auto">
             <div className="flex items-center justify-between">
               <div>
                 <h2 className="text-xl font-bold text-white mb-2">
                   {activeTestInfo?.name}
                 </h2>
                 <p className="text-gray-400">
                   {activeTestInfo?.description}
                 </p>
               </div>
               {activeTestInfo?.badge && (
                 <div>
                   <span className={`inline-block text-xs px-3 py-1 rounded-full font-medium ${
                     activeTestInfo.badge === 'Main' 
                       ? 'bg-green-600 text-green-100'
                       : 'bg-yellow-600 text-yellow-100'
                   }`}>
                     {activeTestInfo.badge}
                   </span>
                 </div>
               )}
             </div>
             <div className="mt-3">
               <span className="inline-block bg-blue-600 text-blue-100 text-xs px-2 py-1 rounded">
                 {activeTestInfo?.category}
               </span>
             </div>
           </div>
         </div>

        {/* Test Component */}
        <div className="p-6">
          <div className="max-w-6xl mx-auto">
            <ActiveComponent />
          </div>
        </div>
      </div>
    </div>
  );
} 