'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuthGuard from '@/components/auth/AuthGuard';
import Header from '@/app/components/Header';
import { UserRole } from '@/types/equipment';
import { MANAGEMENT } from '@/constants/text';
import { canManageTemplates } from '@/types/templateSystem';
import { Users, Shield, ArrowRightLeft, Settings, Database, UserCheck, Mail, Layers, Package, LucideIcon, Menu, X, ChevronRight, LogOut, User, Home, ChevronDown } from 'lucide-react';

// Template interface for management
interface TemplateData {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  categoryName: string;
  subcategoryId: string;
  subcategoryName: string;
  icon: string;
  usageCount: number;
  lastUsed: string;
  createdBy: string;
  createdAt: string;
  isActive: boolean;
  productName?: string;
  defaultStatus?: string;
  defaultCondition?: string;
  defaultLocation?: string;
  idPrefix?: string;
  commonNotes?: string;
}

// Management tabs configuration
interface ManagementTab {
  id: string;
  label: string;
  icon: LucideIcon;
  description: string;
  category: string;
  requiresTemplatePermission?: boolean;
}

interface TabCategory {
  id: string;
  name: string;
  icon: LucideIcon;
  order: number;
}

// Tab Categories
const TAB_CATEGORIES: TabCategory[] = [
  {
    id: 'user-management',
    name: 'ניהול משתמשים',
    icon: Users,
    order: 1
  },
  {
    id: 'equipment',
    name: 'ניהול ציוד',
    icon: Package,
    order: 2
  },
  {
    id: 'system',
    name: 'מערכת',
    icon: Settings,
    order: 3
  },
  {
    id: 'communication',
    name: 'תקשורת',
    icon: Mail,
    order: 4
  }
];

const MANAGEMENT_TABS: ManagementTab[] = [
  {
    id: 'users',
    label: MANAGEMENT.TABS.USERS,
    icon: Users,
    description: MANAGEMENT.TAB_DESCRIPTIONS.USERS,
    category: 'user-management'
  },
  {
    id: 'permissions',
    label: MANAGEMENT.TABS.PERMISSIONS,
    icon: Shield,
    description: MANAGEMENT.TAB_DESCRIPTIONS.PERMISSIONS,
    category: 'user-management'
  },
  {
    id: 'template-management',
    label: MANAGEMENT.TABS.TEMPLATE_MANAGEMENT,
    icon: Layers,
    description: MANAGEMENT.TAB_DESCRIPTIONS.TEMPLATE_MANAGEMENT,
    category: 'equipment',
    requiresTemplatePermission: true
  },
  {
    id: 'equipment-creation',
    label: MANAGEMENT.TABS.EQUIPMENT_CREATION,
    icon: Package,
    description: MANAGEMENT.TAB_DESCRIPTIONS.EQUIPMENT_CREATION,
    category: 'equipment'
  },
  {
    id: 'enforce-transfer',
    label: MANAGEMENT.TABS.ENFORCE_TRANSFER,
    icon: ArrowRightLeft,
    description: MANAGEMENT.TAB_DESCRIPTIONS.ENFORCE_TRANSFER,
    category: 'equipment'
  },
  {
    id: 'system-config',
    label: MANAGEMENT.TABS.SYSTEM_CONFIG,
    icon: Settings,
    description: MANAGEMENT.TAB_DESCRIPTIONS.SYSTEM_CONFIG,
    category: 'system'
  },
  {
    id: 'data-management',
    label: MANAGEMENT.TABS.DATA_MANAGEMENT,
    icon: Database,
    description: MANAGEMENT.TAB_DESCRIPTIONS.DATA_MANAGEMENT,
    category: 'system'
  },
  {
    id: 'audit-logs',
    label: MANAGEMENT.TABS.AUDIT_LOGS,
    icon: UserCheck,
    description: MANAGEMENT.TAB_DESCRIPTIONS.AUDIT_LOGS,
    category: 'system'
  },
  {
    id: 'send-email',
    label: MANAGEMENT.TABS.SEND_EMAIL,
    icon: Mail,
    description: MANAGEMENT.TAB_DESCRIPTIONS.SEND_EMAIL,
    category: 'communication'
  }
];

// Users Management Tab Component
function UsersManagementTabContent() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const mockUsers = [
    { id: '1', name: 'יוסי כהן', email: 'yossi@example.com', role: 'admin', status: 'active', lastLogin: '2024-01-15', team: 'פלוגה א' },
    { id: '2', name: 'שרה לוי', email: 'sara@example.com', role: 'manager', status: 'active', lastLogin: '2024-01-14', team: 'פלוגה ב' },
    { id: '3', name: 'דוד אבן', email: 'david@example.com', role: 'user', status: 'inactive', lastLogin: '2024-01-10', team: 'פלוגה ג' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">ניהול משתמשים</h3>
          <p className="text-sm text-gray-600">נהל משתמשים, תפקידים והרשאות במערכת</p>
        </div>
        <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors shadow-sm">
          + הוסף משתמש חדש
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">חיפוש</label>
            <input
              type="text"
              placeholder="חפש לפי שם או אימייל..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">תפקיד</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              <option value="all">כל התפקידים</option>
              <option value="admin">מנהל מערכת</option>
              <option value="manager">מנהל</option>
              <option value="user">משתמש</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">סטטוס</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">כל הסטטוסים</option>
              <option value="active">פעיל</option>
              <option value="inactive">לא פעיל</option>
              <option value="pending">ממתין לאישור</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">משתמש</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">תפקיד</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">צוות</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">סטטוס</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">התחברות אחרונה</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">פעולות</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mockUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center ml-3">
                        <span className="text-sm font-bold text-purple-600">{user.name[0]}</span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      user.role === 'admin' ? 'bg-red-100 text-red-800' :
                      user.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {user.role === 'admin' ? 'מנהל מערכת' : user.role === 'manager' ? 'מנהל' : 'משתמש'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.team}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      user.status === 'active' ? 'bg-green-100 text-green-800' :
                      user.status === 'inactive' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {user.status === 'active' ? 'פעיל' : user.status === 'inactive' ? 'לא פעיל' : 'ממתין'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.lastLogin}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <button className="text-blue-600 hover:text-blue-900 ml-2">ערוך</button>
                    <button className="text-red-600 hover:text-red-900">מחק</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-blue-600" />
            <div className="mr-4">
              <div className="text-2xl font-bold text-gray-900">24</div>
              <div className="text-sm text-gray-600">סך המשתמשים</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 font-bold">✓</span>
            </div>
            <div className="mr-4">
              <div className="text-2xl font-bold text-green-600">21</div>
              <div className="text-sm text-gray-600">פעילים</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-red-600 font-bold">×</span>
            </div>
            <div className="mr-4">
              <div className="text-2xl font-bold text-red-600">2</div>
              <div className="text-sm text-gray-600">לא פעילים</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <span className="text-yellow-600 font-bold">⏳</span>
            </div>
            <div className="mr-4">
              <div className="text-2xl font-bold text-yellow-600">1</div>
              <div className="text-sm text-gray-600">ממתינים</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Permissions Management Tab Component
function PermissionsManagementTabContent() {
  const [selectedUser, setSelectedUser] = useState('');
  
  const permissions = [
    { id: 'view_equipment', name: 'צפייה בציוד', category: 'ציוד' },
    { id: 'edit_equipment', name: 'עריכת ציוד', category: 'ציוד' },
    { id: 'delete_equipment', name: 'מחיקת ציוד', category: 'ציוד' },
    { id: 'manage_users', name: 'ניהול משתמשים', category: 'מערכת' },
    { id: 'view_reports', name: 'צפייה בדוחות', category: 'דוחות' },
    { id: 'manage_templates', name: 'ניהול תבניות', category: 'ציוד' },
  ];

  const roles = [
    { id: 'admin', name: 'מנהל מערכת', permissions: ['view_equipment', 'edit_equipment', 'delete_equipment', 'manage_users', 'view_reports', 'manage_templates'] },
    { id: 'manager', name: 'מנהל', permissions: ['view_equipment', 'edit_equipment', 'view_reports', 'manage_templates'] },
    { id: 'user', name: 'משתמש', permissions: ['view_equipment'] },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">ניהול הרשאות</h3>
        <p className="text-sm text-gray-600">נהל הרשאות לתפקידים שונים במערכת</p>
      </div>

      {/* Roles Management */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">תפקידים והרשאות</h4>
        <div className="space-y-6">
          {roles.map((role) => (
            <div key={role.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h5 className="text-md font-medium text-gray-900">{role.name}</h5>
                <button className="text-blue-600 hover:text-blue-800 text-sm">ערוך הרשאות</button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {permissions.map((permission) => (
                  <div key={permission.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={role.permissions.includes(permission.id)}
                      className="text-purple-600 focus:ring-purple-500 ml-2"
                      readOnly
                    />
                    <span className="text-sm text-gray-700">{permission.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Permissions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">הרשאות מותאמות אישית</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">בחר משתמש</label>
            <select
              className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
            >
              <option value="">בחר משתמש...</option>
              <option value="1">יוסי כהן</option>
              <option value="2">שרה לוי</option>
              <option value="3">דוד אבן</option>
            </select>
          </div>
          {selectedUser && (
            <div className="border border-gray-200 rounded-lg p-4">
              <h6 className="font-medium text-gray-900 mb-3">הרשאות מותאמות עבור המשתמש</h6>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {permissions.map((permission) => (
                  <div key={permission.id} className="flex items-center">
                    <input
                      type="checkbox"
                      className="text-purple-600 focus:ring-purple-500 ml-2"
                    />
                    <span className="text-sm text-gray-700">{permission.name}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors">
                  שמור שינויים
                </button>
                <button className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors">
                  ביטול
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Template Management Tab Component
function TemplateManagementTabContent() {
  const [activeView, setActiveView] = useState<'list' | 'create' | 'edit'>('list');
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState('all');
  const [showCreateTemplateModal, setShowCreateTemplateModal] = useState(false);

  // Mock data for templates (this would come from a service)
  const mockTemplates = [
    {
      id: 'template_1',
      name: 'רובה M4A1',
      description: 'רובה סער M4A1 סטנדרטי',
      categoryId: 'weapons',
      categoryName: 'נשק אישי',
      subcategoryId: 'rifles',
      subcategoryName: 'רובים',
      icon: '🔫',
      usageCount: 45,
      lastUsed: '2024-01-15',
      createdBy: 'יוסי כהן',
      createdAt: '2024-01-10',
      isActive: true
    },
    {
      id: 'template_2',
      name: 'אפוד טקטי',
      description: 'אפוד טקטי סטנדרטי לחי"ר',
      categoryId: 'protection',
      categoryName: 'הגנה אישית',
      subcategoryId: 'vests',
      subcategoryName: 'אפודים',
      icon: '🦺',
      usageCount: 32,
      lastUsed: '2024-01-14',
      createdBy: 'שרה לוי',
      createdAt: '2024-01-08',
      isActive: true
    },
    {
      id: 'template_3',
      name: 'קסדת לחימה',
      description: 'קסדה מתקדמת עם ציוד ראיית לילה',
      categoryId: 'protection',
      categoryName: 'הגנה אישית',
      subcategoryId: 'helmets',
      subcategoryName: 'קסדות',
      icon: '⛑️',
      usageCount: 28,
      lastUsed: '2024-01-13',
      createdBy: 'דוד אבן',
      createdAt: '2024-01-05',
      isActive: false
    }
  ];

  const mockCategories = [
    { id: 'weapons', name: 'נשק אישי', subcategories: [
      { id: 'rifles', name: 'רובים' },
      { id: 'pistols', name: 'אקדחים' },
      { id: 'grenades', name: 'רימונים' }
    ]},
    { id: 'protection', name: 'הגנה אישית', subcategories: [
      { id: 'vests', name: 'אפודים' },
      { id: 'helmets', name: 'קסדות' },
      { id: 'shields', name: 'מגנים' }
    ]},
    { id: 'communication', name: 'ציוד קשר', subcategories: [
      { id: 'radios', name: 'מכשירי קשר' },
      { id: 'antennas', name: 'אנטנות' }
    ]}
  ];

  // Filter templates based on search and category
  const filteredTemplates = mockTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.categoryId === selectedCategory;
    const matchesSubcategory = selectedSubcategory === 'all' || template.subcategoryId === selectedSubcategory;
    return matchesSearch && matchesCategory && matchesSubcategory;
  });

  const handleEditTemplate = (template: TemplateData) => {
    setSelectedTemplate(template);
    setActiveView('edit');
  };

  const handleDeleteTemplate = (templateId: string) => {
    // TODO: Implement delete logic
    console.log('Delete template:', templateId);
  };

  const handleCreateTemplate = () => {
    setSelectedTemplate(null);
    setShowCreateTemplateModal(true);
  };

  if (activeView === 'create' || showCreateTemplateModal) {
    return <CreateTemplateForm onBack={() => {setActiveView('list'); setShowCreateTemplateModal(false);}} />;
  }

  if (activeView === 'edit' && selectedTemplate) {
    return <EditTemplateForm template={selectedTemplate} onBack={() => setActiveView('list')} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">ניהול תבניות ציוד</h3>
          <p className="text-sm text-gray-600">צור, ערוך ונהל תבניות לציוד צבאי</p>
        </div>
        <button 
          onClick={handleCreateTemplate}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors shadow-sm"
        >
          + הוסף תבנית חדשה
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <Layers className="w-8 h-8 text-purple-600" />
            <div className="mr-4">
              <div className="text-2xl font-bold text-gray-900">{mockTemplates.length}</div>
              <div className="text-sm text-gray-600">סך התבניות</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 font-bold">✓</span>
            </div>
            <div className="mr-4">
              <div className="text-2xl font-bold text-green-600">{mockTemplates.filter(t => t.isActive).length}</div>
              <div className="text-sm text-gray-600">פעילות</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-bold">📊</span>
            </div>
            <div className="mr-4">
              <div className="text-2xl font-bold text-blue-600">{mockTemplates.reduce((sum, t) => sum + t.usageCount, 0)}</div>
              <div className="text-sm text-gray-600">שימושים</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-orange-600 font-bold">📁</span>
            </div>
            <div className="mr-4">
              <div className="text-2xl font-bold text-orange-600">{mockCategories.length}</div>
              <div className="text-sm text-gray-600">קטגוריות</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">חיפוש</label>
            <input
              type="text"
              placeholder="חפש תבניות..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">קטגוריה</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setSelectedSubcategory('all'); // Reset subcategory when category changes
              }}
            >
              <option value="all">כל הקטגוריות</option>
              {mockCategories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">תת-קטגוריה</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              value={selectedSubcategory}
              onChange={(e) => setSelectedSubcategory(e.target.value)}
              disabled={selectedCategory === 'all'}
            >
              <option value="all">כל התת-קטגוריות</option>
              {selectedCategory !== 'all' && mockCategories
                .find(cat => cat.id === selectedCategory)?.subcategories
                .map(subcategory => (
                  <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* Templates List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h4 className="text-lg font-medium text-gray-900">תבניות ציוד ({filteredTemplates.length})</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">תבנית</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">קטגוריה</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">שימושים</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">שימוש אחרון</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">סטטוס</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">פעולות</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTemplates.map((template) => (
                <tr key={template.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center ml-3">
                        <span className="text-lg">{template.icon}</span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{template.name}</div>
                        <div className="text-sm text-gray-500">{template.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{template.categoryName}</div>
                    <div className="text-sm text-gray-500">{template.subcategoryName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{template.usageCount}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{template.lastUsed}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      template.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {template.isActive ? 'פעיל' : 'לא פעיל'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <button 
                      onClick={() => handleEditTemplate(template)}
                      className="text-blue-600 hover:text-blue-900 ml-2"
                    >
                      ערוך
                    </button>
                    <button 
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      מחק
                    </button>
                    <button className="text-purple-600 hover:text-purple-900 ml-2">שכפל</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredTemplates.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Layers className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">אין תבניות</h3>
          <p className="text-gray-500 mb-4">לא נמצאו תבניות התואמות לחיפוש שלך</p>
          <button 
            onClick={handleCreateTemplate}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
          >
            צור תבנית ראשונה
          </button>
        </div>
      )}
    </div>
  );
}

// Create Template Form Component
function CreateTemplateForm({ onBack }: { onBack: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
    subcategoryId: '',
    productName: '',
    defaultStatus: 'available',
    defaultCondition: 'good',
    defaultLocation: '',
    idPrefix: '',
    icon: '📦',
    commonNotes: '',
    isActive: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const mockCategories = [
    { id: 'weapons', name: 'נשק אישי', subcategories: [
      { id: 'rifles', name: 'רובים' },
      { id: 'pistols', name: 'אקדחים' },
      { id: 'grenades', name: 'רימונים' }
    ]},
    { id: 'protection', name: 'הגנה אישית', subcategories: [
      { id: 'vests', name: 'אפודים' },
      { id: 'helmets', name: 'קסדות' },
      { id: 'shields', name: 'מגנים' }
    ]},
    { id: 'communication', name: 'ציוד קשר', subcategories: [
      { id: 'radios', name: 'מכשירי קשר' },
      { id: 'antennas', name: 'אנטנות' }
    ]}
  ];

  const iconOptions = ['📦', '🔫', '🛡️', '⛑️', '🦺', '📡', '🔭', '🎯', '🗡️', '🏹', '💣', '🚁'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'שם התבנית נדרש';
    if (!formData.description.trim()) newErrors.description = 'תיאור נדרש';
    if (!formData.categoryId) newErrors.categoryId = 'קטגוריה נדרשת';
    if (!formData.subcategoryId) newErrors.subcategoryId = 'תת-קטגוריה נדרשת';
    if (!formData.productName.trim()) newErrors.productName = 'שם המוצר נדרש';
    if (!formData.defaultLocation.trim()) newErrors.defaultLocation = 'מיקום ברירת מחדל נדרש';
    if (!formData.idPrefix.trim()) newErrors.idPrefix = 'קידומת זיהוי נדרשת';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // TODO: Submit form data
    console.log('Creating template:', formData);
    onBack();
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const selectedCategory = mockCategories.find(cat => cat.id === formData.categoryId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">יצירת תבנית חדשה</h3>
          <p className="text-sm text-gray-600">צור תבנית ציוד חדשה עם הגדרות ברירת מחדל</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-900 border-b border-gray-200 pb-2">מידע בסיסי</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">שם התבנית *</label>
              <input
                type="text"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="לדוגמה: רובה M4A1"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">אייקון</label>
              <div className="grid grid-cols-6 gap-2">
                {iconOptions.map(icon => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => handleInputChange('icon', icon)}
                    className={`p-2 text-lg rounded border ${
                      formData.icon === icon ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">תיאור *</label>
            <textarea
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              rows={3}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="תיאור מפורט של סוג הציוד"
            />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
          </div>
        </div>

        {/* Category Selection */}
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-900 border-b border-gray-200 pb-2">קטגוריה</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">קטגוריה ראשית *</label>
              <select
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                  errors.categoryId ? 'border-red-500' : 'border-gray-300'
                }`}
                value={formData.categoryId}
                onChange={(e) => {
                  handleInputChange('categoryId', e.target.value);
                  handleInputChange('subcategoryId', ''); // Reset subcategory
                }}
              >
                <option value="">בחר קטגוריה...</option>
                {mockCategories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
              {errors.categoryId && <p className="text-red-500 text-xs mt-1">{errors.categoryId}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">תת-קטגוריה *</label>
              <select
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                  errors.subcategoryId ? 'border-red-500' : 'border-gray-300'
                }`}
                value={formData.subcategoryId}
                onChange={(e) => handleInputChange('subcategoryId', e.target.value)}
                disabled={!formData.categoryId}
              >
                <option value="">בחר תת-קטגוריה...</option>
                {selectedCategory?.subcategories.map(subcategory => (
                  <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>
                ))}
              </select>
              {errors.subcategoryId && <p className="text-red-500 text-xs mt-1">{errors.subcategoryId}</p>}
            </div>
          </div>
        </div>

        {/* Default Values */}
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-900 border-b border-gray-200 pb-2">ערכי ברירת מחדל</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">שם המוצר *</label>
              <input
                type="text"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                  errors.productName ? 'border-red-500' : 'border-gray-300'
                }`}
                value={formData.productName}
                onChange={(e) => handleInputChange('productName', e.target.value)}
                placeholder="שם המוצר המדויק"
              />
              {errors.productName && <p className="text-red-500 text-xs mt-1">{errors.productName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">קידומת זיהוי *</label>
              <input
                type="text"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                  errors.idPrefix ? 'border-red-500' : 'border-gray-300'
                }`}
                value={formData.idPrefix}
                onChange={(e) => handleInputChange('idPrefix', e.target.value)}
                placeholder="לדוגמה: M4, VT, HLM"
                maxLength={4}
              />
              {errors.idPrefix && <p className="text-red-500 text-xs mt-1">{errors.idPrefix}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">סטטוס ברירת מחדל</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                value={formData.defaultStatus}
                onChange={(e) => handleInputChange('defaultStatus', e.target.value)}
              >
                <option value="available">זמין</option>
                <option value="in_use">בשימוש</option>
                <option value="maintenance">תחזוקה</option>
                <option value="repair">תיקון</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">מצב ברירת מחדל</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                value={formData.defaultCondition}
                onChange={(e) => handleInputChange('defaultCondition', e.target.value)}
              >
                <option value="new">חדש</option>
                <option value="excellent">מעולה</option>
                <option value="good">טוב</option>
                <option value="fair">בסיסי</option>
                <option value="poor">גרוע</option>
                <option value="needs_repair">דורש תיקון</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">מיקום ברירת מחדל *</label>
              <input
                type="text"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                  errors.defaultLocation ? 'border-red-500' : 'border-gray-300'
                }`}
                value={formData.defaultLocation}
                onChange={(e) => handleInputChange('defaultLocation', e.target.value)}
                placeholder="לדוגמה: מחסן נשק, מחסן ציוד, משרד"
              />
              {errors.defaultLocation && <p className="text-red-500 text-xs mt-1">{errors.defaultLocation}</p>}
            </div>
          </div>
        </div>

        {/* Additional Settings */}
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-900 border-b border-gray-200 pb-2">הגדרות נוספות</h4>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">הערות נפוצות</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              rows={2}
              value={formData.commonNotes}
              onChange={(e) => handleInputChange('commonNotes', e.target.value)}
              placeholder="הערות שיופיעו באופן אוטומטי (אופציונלי)"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => handleInputChange('isActive', e.target.checked)}
              className="text-purple-600 focus:ring-purple-500 ml-2"
            />
            <span className="text-sm text-gray-700">תבנית פעילה (זמינה לשימוש)</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-4 border-t border-gray-200">
          <button
            type="submit"
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
          >
            צור תבנית
          </button>
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors"
          >
            ביטול
          </button>
        </div>
      </form>
    </div>
  );
}

// Edit Template Form Component  
function EditTemplateForm({ template, onBack }: { template: TemplateData; onBack: () => void }) {
  const [formData, setFormData] = useState({
    name: template.name || '',
    description: template.description || '',
    categoryId: template.categoryId || '',
    subcategoryId: template.subcategoryId || '',
    productName: template.productName || '',
    defaultStatus: template.defaultStatus || 'available',
    defaultCondition: template.defaultCondition || 'good',
    defaultLocation: template.defaultLocation || '',
    idPrefix: template.idPrefix || '',
    icon: template.icon || '📦',
    commonNotes: template.commonNotes || '',
    isActive: template.isActive !== undefined ? template.isActive : true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const iconOptions = ['📦', '🔫', '🛡️', '⛑️', '🦺', '📡', '🔭', '🎯', '🗡️', '🏹', '💣', '🚁'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'שם התבנית נדרש';
    if (!formData.description.trim()) newErrors.description = 'תיאור נדרש';
    if (!formData.categoryId) newErrors.categoryId = 'קטגוריה נדרשת';
    if (!formData.subcategoryId) newErrors.subcategoryId = 'תת-קטגוריה נדרשת';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // TODO: Update template
    console.log('Updating template:', template.id, formData);
    onBack();
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">עריכת תבנית: {template.name}</h3>
          <p className="text-sm text-gray-600">ערוך הגדרות התבנית וערכי ברירת המחדל</p>
        </div>
      </div>

      {/* Usage Stats */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-blue-900">סטטיסטיקות שימוש</h4>
            <p className="text-blue-700 text-sm">התבנית שימשה {template.usageCount} פעמים</p>
          </div>
          <div className="text-blue-600 text-sm">
            שימוש אחרון: {template.lastUsed}
          </div>
        </div>
      </div>

      {/* Form - Same as Create but with different title and submit text */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-900 border-b border-gray-200 pb-2">מידע בסיסי</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">שם התבנית *</label>
              <input
                type="text"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="לדוגמה: רובה M4A1"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">אייקון</label>
              <div className="grid grid-cols-6 gap-2">
                {iconOptions.map(icon => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => handleInputChange('icon', icon)}
                    className={`p-2 text-lg rounded border ${
                      formData.icon === icon ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">תיאור *</label>
            <textarea
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              rows={3}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="תיאור מפורט של סוג הציוד"
            />
            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => handleInputChange('isActive', e.target.checked)}
              className="text-purple-600 focus:ring-purple-500 ml-2"
            />
            <span className="text-sm text-gray-700">תבנית פעילה (זמינה לשימוש)</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-4 border-t border-gray-200">
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            שמור שינויים
          </button>
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors"
          >
            ביטול
          </button>
        </div>
      </form>
    </div>
  );
}

// Equipment Creation Tab Component
function EquipmentCreationTabContent() {
  return (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="font-semibold text-green-900 mb-2">📦 יצירת ציוד חדש - בפיתוח</h3>
        <p className="text-green-700 text-sm">
          כאן יהיה ניתן ליצור ציוד חדש למערכת. התכונה תכלול:
        </p>
        <ul className="list-disc list-inside text-green-700 text-sm mt-2 space-y-1">
          <li>יצירה מהירה מתבניות קיימות</li>
          <li>יצירה ידנית עם כל השדות</li>
          <li>אפשרות לשמור כתבנית חדשה</li>
          <li>אינטגרציה עם מערכת הוספת ציוד הקיימת</li>
        </ul>
      </div>
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-700 text-sm">
          <strong>הערה:</strong> כרגע ניתן ליצור ציוד חדש דרך דף הציוד הראשי. 
          תכונה זו תשפר את החוויה עבור מנהלי מערכת.
        </p>
      </div>
    </div>
  );
}

// Enforce Transfer Tab Component
function EnforceTransferTabContent() {
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [fromUser, setFromUser] = useState('');
  const [toUser, setToUser] = useState('');
  const [reason, setReason] = useState('');

  const pendingTransfers = [
    { id: '1', equipment: 'תבור - T001', from: 'יוסי כהן', to: 'שרה לוי', date: '2024-01-15', status: 'pending' },
    { id: '2', equipment: 'אפוד טקטי - V042', from: 'דוד אבן', to: 'רן כהן', date: '2024-01-14', status: 'approved' },
    { id: '3', equipment: 'קסדה - H123', from: 'מיכל לוי', to: 'אבי גרינברג', date: '2024-01-13', status: 'rejected' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">העברות כפויות</h3>
        <p className="text-sm text-gray-600">נהל העברות ציוד בין משתמשים במצבי חירום</p>
      </div>

      {/* Force Transfer Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-lg font-medium text-red-600 mb-4">⚠️ יצירת העברה כפויה</h4>
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-red-700 text-sm">
            <strong>אזהרה:</strong> שימוש ביצירת העברה כפויה אמור להיעשות רק במצבי חירום או כאשר המשתמש לא זמין.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">ציוד</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              value={selectedEquipment}
              onChange={(e) => setSelectedEquipment(e.target.value)}
            >
              <option value="">בחר ציוד...</option>
              <option value="1">תבור - T001</option>
              <option value="2">אפוד טקטי - V042</option>
              <option value="3">קסדה - H123</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">מ-משתמש</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              value={fromUser}
              onChange={(e) => setFromUser(e.target.value)}
            >
              <option value="">בחר משתמש...</option>
              <option value="1">יוסי כהן</option>
              <option value="2">שרה לוי</option>
              <option value="3">דוד אבן</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">אל-משתמש</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              value={toUser}
              onChange={(e) => setToUser(e.target.value)}
            >
              <option value="">בחר משתמש...</option>
              <option value="1">יוסי כהן</option>
              <option value="2">שרה לוי</option>
              <option value="3">דוד אבן</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">סיבה להעברה</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            >
              <option value="">בחר סיבה...</option>
              <option value="emergency">מצב חירום</option>
              <option value="unavailable">משתמש לא זמין</option>
              <option value="maintenance">תחזוקה</option>
              <option value="other">אחר</option>
            </select>
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">הערות נוספות</label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            rows={3}
            placeholder="הסבר מפורט לסיבת ההעברה הכפויה..."
          />
        </div>
        <div className="mt-4">
          <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors">
            ⚠️ בצע העברה כפויה
          </button>
        </div>
      </div>

      {/* Pending Transfers */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h4 className="text-lg font-medium text-gray-900">העברות בהמתנה לאישור</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">ציוד</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">מאת</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">אל</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">תאריך</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">סטטוס</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">פעולות</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pendingTransfers.map((transfer) => (
                <tr key={transfer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{transfer.equipment}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transfer.from}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transfer.to}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transfer.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      transfer.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      transfer.status === 'approved' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {transfer.status === 'pending' ? 'ממתין' : transfer.status === 'approved' ? 'אושר' : 'נדחה'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    {transfer.status === 'pending' && (
                      <>
                        <button className="text-green-600 hover:text-green-900 ml-2">אשר</button>
                        <button className="text-red-600 hover:text-red-900">דחה</button>
                      </>
                    )}
                    <button className="text-blue-600 hover:text-blue-900">פרטים</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// System Config Tab Component
function SystemConfigTabContent() {
  const [autoBackup, setAutoBackup] = useState(true);
  const [notificationEmail, setNotificationEmail] = useState('admin@example.com');
  const [sessionTimeout, setSessionTimeout] = useState('30');
  const [maxLoginAttempts, setMaxLoginAttempts] = useState('3');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">הגדרות מערכת</h3>
        <p className="text-sm text-gray-600">נהל הגדרות כלליות ותצורת המערכת</p>
      </div>

      {/* Security Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">🔒 הגדרות אבטחה</h4>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">זמן תפוגת חיבור (דקות)</label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                value={sessionTimeout}
                onChange={(e) => setSessionTimeout(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">מקסימום ניסיונות התחברות</label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                value={maxLoginAttempts}
                onChange={(e) => setMaxLoginAttempts(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={autoBackup}
              onChange={(e) => setAutoBackup(e.target.checked)}
              className="text-purple-600 focus:ring-purple-500 ml-2"
            />
            <span className="text-sm text-gray-700">גיבוי אוטומטי יומי</span>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">📧 הגדרות התראות</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">אימייל להתראות מערכת</label>
            <input
              type="email"
              className="w-full md:w-96 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              value={notificationEmail}
              onChange={(e) => setNotificationEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center">
              <input type="checkbox" defaultChecked className="text-purple-600 focus:ring-purple-500 ml-2" />
              <span className="text-sm text-gray-700">התראה על ציוד חסר</span>
            </div>
            <div className="flex items-center">
              <input type="checkbox" defaultChecked className="text-purple-600 focus:ring-purple-500 ml-2" />
              <span className="text-sm text-gray-700">התראה על ציוד הזקוק לתחזוקה</span>
            </div>
            <div className="flex items-center">
              <input type="checkbox" className="text-purple-600 focus:ring-purple-500 ml-2" />
              <span className="text-sm text-gray-700">התראה על משתמשים חדשים</span>
            </div>
          </div>
        </div>
      </div>

      {/* System Info */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">📊 מידע מערכת</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">גרסת מערכת:</span>
              <span className="text-sm font-medium text-gray-900">v1.2.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">גיבוי אחרון:</span>
              <span className="text-sm font-medium text-gray-900">15/01/2024 03:00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">משתמשים מחוברים:</span>
              <span className="text-sm font-medium text-gray-900">12</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">שימוש במסד נתונים:</span>
              <span className="text-sm font-medium text-gray-900">2.3 GB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">שימוש בשרת:</span>
              <span className="text-sm font-medium text-gray-900">45%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">עדכון אחרון:</span>
              <span className="text-sm font-medium text-gray-900">10/01/2024</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors">
          שמור הגדרות
        </button>
        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
          בצע גיבוי כעת
        </button>
        <button className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors">
          איפוס הגדרות
        </button>
      </div>
    </div>
  );
}

// Data Management Tab Component
function DataManagementTabContent() {
  const [selectedTable, setSelectedTable] = useState('');
  const [exportFormat, setExportFormat] = useState('excel');

  const databaseTables = [
    { name: 'משתמשים', records: 24, size: '0.5 MB', lastUpdate: '15/01/2024' },
    { name: 'ציוד', records: 156, size: '2.1 MB', lastUpdate: '15/01/2024' },
    { name: 'התיאמויות', records: 89, size: '0.8 MB', lastUpdate: '14/01/2024' },
    { name: 'תבניות', records: 12, size: '0.1 MB', lastUpdate: '13/01/2024' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">ניהול נתונים</h3>
        <p className="text-sm text-gray-600">ייבוא, ייצוא וניהול נתוני המערכת</p>
      </div>

      {/* Database Overview */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h4 className="text-lg font-medium text-gray-900">📊 סקירת מסד הנתונים</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">טבלה</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">רשומות</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">גודל</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">עדכון אחרון</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">פעולות</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {databaseTables.map((table, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{table.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{table.records}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{table.size}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{table.lastUpdate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    <button className="text-blue-600 hover:text-blue-900 ml-2">ייצא</button>
                    <button className="text-green-600 hover:text-green-900 ml-2">גבה</button>
                    <button className="text-orange-600 hover:text-orange-900">נקה</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Data */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">📤 ייצוא נתונים</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">בחר טבלה</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
            >
              <option value="">בחר טבלה...</option>
              <option value="users">משתמשים</option>
              <option value="equipment">ציוד</option>
              <option value="logs">התיאמויות</option>
              <option value="templates">תבניות</option>
              <option value="all">כל הנתונים</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">פורמט ייצוא</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
            >
              <option value="excel">Excel (.xlsx)</option>
              <option value="csv">CSV (.csv)</option>
              <option value="json">JSON (.json)</option>
              <option value="pdf">PDF (.pdf)</option>
            </select>
          </div>
        </div>
        <div className="mt-4">
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
            📤 ייצא נתונים
          </button>
        </div>
      </div>

      {/* Import Data */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">📥 ייבוא נתונים</h4>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <span className="text-2xl">📁</span>
          </div>
          <p className="text-gray-600 mb-4">גרור קובץ לכאן או לחץ לבחירה</p>
          <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors">
            בחר קובץ
          </button>
          <p className="text-xs text-gray-500 mt-2">תומך ב: .xlsx, .csv, .json</p>
        </div>
      </div>

      {/* Backup Management */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">💾 ניהול גיבויים</h4>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">גיבוי אוטומטי יומי</div>
              <div className="text-sm text-gray-600">מתבצע כל יום ב-03:00</div>
            </div>
            <button className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded">פעיל</button>
          </div>
          <div className="flex gap-4">
            <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors">
              צור גיבוי מלא
            </button>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
              שחזר מגיבוי
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Audit Logs Tab Component
function AuditLogsTabContent() {
  const [dateFrom, setDateFrom] = useState('2024-01-01');
  const [dateTo, setDateTo] = useState('2024-01-15');
  const [actionFilter, setActionFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');

  const auditLogs = [
    { id: '1', user: 'יוסי כהן', action: 'התחברות למערכת', resource: 'מערכת', timestamp: '15/01/2024 08:30', ip: '192.168.1.100' },
    { id: '2', user: 'שרה לוי', action: 'עריכת ציוד', resource: 'תבור T001', timestamp: '15/01/2024 09:15', ip: '192.168.1.105' },
    { id: '3', user: 'דוד אבן', action: 'יצירת משתמש', resource: 'רן כהן', timestamp: '14/01/2024 14:20', ip: '192.168.1.110' },
    { id: '4', user: 'מיכל לוי', action: 'מחיקת תבנית', resource: 'תבנית אפוד', timestamp: '14/01/2024 11:45', ip: '192.168.1.115' },
    { id: '5', user: 'אבי גרינברג', action: 'יצוא נתונים', resource: 'טבלת ציוד', timestamp: '13/01/2024 16:30', ip: '192.168.1.120' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">רישום פעולות</h3>
        <p className="text-sm text-gray-600">צפה ופלטר פעולות משתמשים במערכת</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h4 className="text-md font-medium text-gray-900 mb-4">🔍 מסננים</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">מתאריך</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">עד תאריך</label>
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">סוג פעולה</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
            >
              <option value="all">כל הפעולות</option>
              <option value="login">התחברות</option>
              <option value="edit">עריכה</option>
              <option value="create">יצירה</option>
              <option value="delete">מחיקה</option>
              <option value="export">ייצוא</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">משתמש</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
            >
              <option value="all">כל המשתמשים</option>
              <option value="1">יוסי כהן</option>
              <option value="2">שרה לוי</option>
              <option value="3">דוד אבן</option>
            </select>
          </div>
        </div>
        <div className="mt-4">
          <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors">
            🔍 חפש
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
          <h4 className="text-lg font-medium text-gray-900">📋 יומן פעולות</h4>
          <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors">
            📤 ייצא יומן
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">זמן</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">משתמש</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">פעולה</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">משאב</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">כתובת IP</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">פרטים</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.timestamp}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{log.user}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      log.action.includes('התחברות') ? 'bg-blue-100 text-blue-800' :
                      log.action.includes('עריכה') ? 'bg-yellow-100 text-yellow-800' :
                      log.action.includes('יצירה') ? 'bg-green-100 text-green-800' :
                      log.action.includes('מחיקה') ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.resource}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.ip}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button className="text-blue-600 hover:text-blue-900">צפה</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-bold">📊</span>
            </div>
            <div className="mr-4">
              <div className="text-2xl font-bold text-gray-900">1,245</div>
              <div className="text-sm text-gray-600">סך הפעולות</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 font-bold">👤</span>
            </div>
            <div className="mr-4">
              <div className="text-2xl font-bold text-green-600">12</div>
              <div className="text-sm text-gray-600">משתמשים פעילים היום</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <span className="text-yellow-600 font-bold">⚠️</span>
            </div>
            <div className="mr-4">
              <div className="text-2xl font-bold text-yellow-600">3</div>
              <div className="text-sm text-gray-600">פעולות חשודות</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-600 font-bold">🔒</span>
            </div>
            <div className="mr-4">
              <div className="text-2xl font-bold text-purple-600">156</div>
              <div className="text-sm text-gray-600">פעולות אבטחה</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Email Tab Component
function EmailTabContent() {
  const [recipients, setRecipients] = useState('all');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [priority, setPriority] = useState('normal');

  const userTypes = [
    { value: 'admin', label: 'אדמין' },
    { value: 'system_manager', label: 'מנהל מערכת' },
    { value: 'manager', label: 'מנהל' },
    { value: 'team_leader', label: 'מפקד צוות' },
    { value: 'soldier', label: 'חייל' }
  ];

  const teams = [
    { value: 'platoon_a', label: 'פלוגה א' },
    { value: 'platoon_b', label: 'פלוגה ב' },
    { value: 'platoon_c', label: 'פלוגה ג' },
    { value: 'headquarters', label: 'מטה' },
    { value: 'support', label: 'תמיכה' }
  ];

  const handleSendEmail = () => {
    const emailData = {
      recipients,
      subject,
      message,
      selectedRoles,
      selectedTeams,
      priority,
      recipientCount: getRecipientCount()
    };
    
    console.log('Sending email:', emailData);
    alert(`הודעה נשלחה בהצלחה ל-${emailData.recipientCount} נמענים!`);
  };

  const getRecipientCount = () => {
    if (recipients === 'all') return 'כל המשתמשים';
    if (recipients === 'roles') return `${selectedRoles.length} תפקידים`;
    if (recipients === 'teams') return `${selectedTeams.length} צוותים`;
    return 'בחירה מותאמת';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">שליחת מייל למשתמשים</h3>
        <p className="text-sm text-gray-600">שלח הודעות לקבוצות משתמשים או לכל המערכת</p>
      </div>

      {/* Email Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left Column */}
          <div className="space-y-4">
            {/* Recipients */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">נמענים</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                value={recipients}
                onChange={(e) => setRecipients(e.target.value)}
              >
                <option value="all">כל המשתמשים</option>
                <option value="roles">לפי תפקידים</option>
                <option value="teams">לפי צוותים</option>
                <option value="custom">בחירה מותאמת</option>
              </select>
            </div>

            {/* Role Selection (if roles selected) */}
            {recipients === 'roles' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">תפקידים</label>
                <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded p-2">
                  {userTypes.map(userType => (
                    <div key={userType.value} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedRoles.includes(userType.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRoles([...selectedRoles, userType.value]);
                          } else {
                            setSelectedRoles(selectedRoles.filter(r => r !== userType.value));
                          }
                        }}
                        className="text-purple-600 focus:ring-purple-500 ml-2"
                      />
                      <span className="text-sm text-gray-700">{userType.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Team Selection (if teams selected) */}
            {recipients === 'teams' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">צוותים</label>
                <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded p-2">
                  {teams.map(team => (
                    <div key={team.value} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedTeams.includes(team.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTeams([...selectedTeams, team.value]);
                          } else {
                            setSelectedTeams(selectedTeams.filter(t => t !== team.value));
                          }
                        }}
                        className="text-purple-600 focus:ring-purple-500 ml-2"
                      />
                      <span className="text-sm text-gray-700">{team.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">עדיפות</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="low">נמוכה</option>
                <option value="normal">רגילה</option>
                <option value="high">גבוהה</option>
                <option value="urgent">דחוף</option>
              </select>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">נושא</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="נושא ההודעה..."
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">הודעה</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="תוכן ההודעה..."
              />
            </div>

            {/* Send Button */}
            <div className="flex gap-2">
              <button
                onClick={handleSendEmail}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
              >
                📧 שלח הודעה
              </button>
              <button
                onClick={() => {
                  setSubject('');
                  setMessage('');
                  setRecipients('all');
                  setSelectedRoles([]);
                  setSelectedTeams([]);
                  setPriority('normal');
                }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-lg transition-colors"
              >
                נקה טופס
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Templates */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h4 className="text-md font-medium text-gray-900 mb-3">תבניות מהירות</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { title: 'תזכורת ציוד', content: 'תזכורת להחזרת ציוד עד סוף השבוע' },
            { title: 'עדכון מערכת', content: 'המערכת תעודכן היום בשעה 23:00' },
            { title: 'הודעה כללית', content: 'הודעה חשובה לכל המשתמשים' }
          ].map((template, index) => (
            <button
              key={index}
              onClick={() => {
                setSubject(template.title);
                setMessage(template.content);
              }}
              className="p-3 text-right border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors"
            >
              <div className="font-medium text-gray-900 text-sm">{template.title}</div>
              <div className="text-gray-600 text-xs mt-1">{template.content}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Emails */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h4 className="text-md font-medium text-gray-900 mb-3">הודעות אחרונות</h4>
        <div className="space-y-2">
          {[
            { subject: 'תזכורת ציוד', date: '15/01/2024', recipients: '24 משתמשים' },
            { subject: 'עדכון מערכת', date: '14/01/2024', recipients: 'כל המשתמשים' },
            { subject: 'הודעה דחופה', date: '13/01/2024', recipients: 'מנהלים' }
          ].map((email, index) => (
            <div key={index} className="flex justify-between items-center p-2 border border-gray-100 rounded">
              <div>
                <div className="font-medium text-gray-900 text-sm">{email.subject}</div>
                <div className="text-gray-500 text-xs">{email.recipients}</div>
              </div>
              <div className="text-gray-400 text-xs">{email.date}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ManagementContent() {
  const { enhancedUser, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleSignOut = async () => {
    await logout();
    window.location.href = '/';
  };

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Check if user has management access
  const hasManagementAccess = () => {
    if (!enhancedUser) return false;
    // Check if user is admin (userType) or has officer/commander role
    return enhancedUser.userType === 'admin' || 
           [UserRole.OFFICER, UserRole.COMMANDER].includes(enhancedUser.role as UserRole);
  };

  // Filter tabs based on user permissions
  const getAvailableTabs = () => {
    if (!enhancedUser) return [];
    
    const userCanManageTemplates = enhancedUser.userType ? canManageTemplates(enhancedUser.userType) : false;
    
    return MANAGEMENT_TABS.filter(tab => {
      // Filter template management tab based on permissions
      if (tab.requiresTemplatePermission) {
        return userCanManageTemplates;
      }
      return true;
    });
  };

  const availableTabs = getAvailableTabs();
  const [activeTab, setActiveTab] = useState<string>(availableTabs[0]?.id || 'users');

  // Group tabs by category
  const getTabsByCategory = () => {
    const tabsByCategory: Record<string, ManagementTab[]> = {};
    
    availableTabs.forEach(tab => {
      if (!tabsByCategory[tab.category]) {
        tabsByCategory[tab.category] = [];
      }
      tabsByCategory[tab.category].push(tab);
    });
    
    return tabsByCategory;
  };

  const tabsByCategory = getTabsByCategory();

  // Access denied for users without proper roles
  if (!hasManagementAccess()) {
    return (
      <div className="min-h-screen bg-gray-50" dir="rtl">
        <Header 
          title={MANAGEMENT.PAGE_TITLE}
          subtitle={MANAGEMENT.PAGE_SUBTITLE_LIMITED}
          showAuth={true}
        />
        
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <Shield className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{MANAGEMENT.ACCESS_DENIED.TITLE}</h2>
            <p className="text-gray-600 mb-6">
              {MANAGEMENT.ACCESS_DENIED.MESSAGE}
            </p>
            <p className="text-sm text-gray-500">
              {MANAGEMENT.ACCESS_DENIED.CURRENT_ROLE} {enhancedUser?.userType === 'admin' ? MANAGEMENT.DEFAULT_MANAGER : enhancedUser?.role || MANAGEMENT.ROLE_NOT_IDENTIFIED}
            </p>
          </div>
        </main>
      </div>
    );
  }

  const activeTabData = availableTabs.find(tab => tab.id === activeTab);

  return (
    <div className="min-h-screen bg-gray-50 flex" dir="rtl">
      {/* Mobile Menu Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden animate-fade-in" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 right-0 z-50 w-80 bg-white shadow-2xl transform transition-all duration-500 ease-out
        lg:relative lg:translate-x-0 lg:w-72 lg:shadow-lg lg:duration-0
        ${sidebarOpen ? 'translate-x-0 shadow-2xl' : 'translate-x-full shadow-none'}
      `}>
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{MANAGEMENT.PAGE_TITLE}</h2>
              <p className="text-sm text-gray-600">
                {enhancedUser?.firstName || MANAGEMENT.DEFAULT_MANAGER}
              </p>
            </div>
          </div>
          {/* Close button for mobile */}
          <button
            className="lg:hidden p-2 rounded-lg hover:bg-red-50 hover:text-red-600 transition-all duration-200 text-gray-500"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
          {TAB_CATEGORIES.map(category => {
            const categoryTabs = tabsByCategory[category.id] || [];
            if (categoryTabs.length === 0) return null;

            const CategoryIcon = category.icon;
            
            return (
              <div key={category.id} className="space-y-3">
                {/* Category Header */}
                <div className="px-3 py-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                    <CategoryIcon className="w-4 h-4 text-purple-600" />
                    <span>{category.name}</span>
                  </div>
                  {/* Divider */}
                  <div className="h-px bg-gradient-to-r from-purple-200 via-purple-300 to-purple-200"></div>
                </div>
                
                {/* Category Tabs */}
                <div className="space-y-1 px-1">
                  {categoryTabs.map(tab => {
                const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    
                return (
                  <button
                    key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id);
                          setSidebarOpen(false); // Close mobile menu
                        }}
                        className={`
                          w-full flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-lg 
                          transition-all duration-200 ease-in-out transform hover:scale-[1.02]
                          ${isActive 
                            ? 'bg-purple-50 text-purple-700 border border-purple-200 shadow-sm' 
                            : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                          }
                        `}
                      >
                        <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-purple-600' : 'text-gray-500'}`} />
                        <span className="flex-1 text-right truncate">{tab.label}</span>
                        {isActive && <ChevronRight className="w-4 h-4 text-purple-600" />}
                  </button>
                );
              })}
            </div>
          </div>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            {MANAGEMENT.ROLE_LABEL}: {enhancedUser?.userType === 'admin' ? MANAGEMENT.DEFAULT_MANAGER : enhancedUser?.role || MANAGEMENT.ROLE_NOT_IDENTIFIED}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header with Mobile Menu Button */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              {/* Mobile Menu Button */}
              <button
                className={`lg:hidden p-2 rounded-lg transition-all duration-200 hover:bg-purple-50 hover:text-purple-600 ${
                  sidebarOpen ? 'bg-purple-50 text-purple-600' : 'text-gray-600'
                }`}
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Logo */}
              <button
                onClick={handleGoHome}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-purple-50 transition-colors"
              >
                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">SG</span>
                </div>
                <span className="hidden sm:block text-lg font-bold text-purple-600">סיירת גבעתי</span>
              </button>
              
              {/* Current Page Info */}
            {activeTabData && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <activeTabData.icon className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">{activeTabData.label}</h1>
                    <p className="text-sm text-gray-600">{activeTabData.description}</p>
                  </div>
                </div>
              )}
                </div>
            
            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="text-right hidden md:block">
                  <div className="text-sm font-medium text-gray-900">
                    {enhancedUser?.firstName || MANAGEMENT.DEFAULT_MANAGER}
                  </div>
                  <div className="text-xs text-gray-500">
                    {enhancedUser?.userType === 'admin' ? 'מנהל מערכת' : enhancedUser?.role}
                  </div>
                </div>
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-purple-600">
                    {(enhancedUser?.firstName?.[0] || 'M').toUpperCase()}
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* User Menu Dropdown */}
              {userMenuOpen && (
                <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="py-2">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <div className="text-sm font-medium text-gray-900">
                        {enhancedUser?.firstName} {enhancedUser?.lastName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {enhancedUser?.email}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => {
                        handleGoHome();
                        setUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors"
                    >
                      <Home className="w-4 h-4" />
                      <span>דף הבית</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        window.location.href = '/profile';
                        setUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      <span>פרופיל אישי</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        window.location.href = '/settings';
                        setUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-600 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      <span>הגדרות</span>
                    </button>
                    
                    <div className="border-t border-gray-100 mt-2 pt-2">
                      <button
                        onClick={() => {
                          handleSignOut();
                          setUserMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>התנתק</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-7xl mx-auto">

                {/* Tab Content */}
            {activeTab === 'users' ? (
              <UsersManagementTabContent />
            ) : activeTab === 'permissions' ? (
              <PermissionsManagementTabContent />
            ) : activeTab === 'template-management' ? (
              <TemplateManagementTabContent />
            ) : activeTab === 'equipment-creation' ? (
              <EquipmentCreationTabContent />
            ) : activeTab === 'enforce-transfer' ? (
              <EnforceTransferTabContent />
            ) : activeTab === 'system-config' ? (
              <SystemConfigTabContent />
            ) : activeTab === 'data-management' ? (
              <DataManagementTabContent />
            ) : activeTab === 'audit-logs' ? (
              <AuditLogsTabContent />
            ) : activeTab === 'send-email' ? (
                  <EmailTabContent />
                ) : (
              /* Fallback for any missing tabs */
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  {activeTabData?.icon && (
                      <activeTabData.icon className="w-8 h-8 text-gray-400" />
                  )}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  {activeTabData?.label} - {MANAGEMENT.DEVELOPMENT.IN_DEVELOPMENT}
                    </h3>
                    <p className="text-gray-500 mb-4">
                      {MANAGEMENT.DEVELOPMENT.FEATURE_COMING_SOON}
                    </p>
                    <div className="text-sm text-gray-400">
                  {activeTabData?.description}
                    </div>
                  </div>
                )}
        </div>
      </main>
        </div>
    </div>
  );
}

export default function ManagementPage() {
  return (
    <AuthGuard>
      <ManagementContent />
    </AuthGuard>
  );
}