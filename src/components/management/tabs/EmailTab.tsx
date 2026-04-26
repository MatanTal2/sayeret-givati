/**
 * Email tab component - extracted from management page
 */
import React, { useState } from 'react';
import { Card, Button, FormField, ConfirmationModal } from '@/components/ui';
import { UserType } from '@/types/user';
import type { EmailRecipientType, EmailPriority, UserTypeOption, TeamOption } from '@/types/management';
import CustomUserSelectionModal from './CustomUserSelectionModal';
import { UserForEmail } from '@/hooks/useUsers';
import { TEXT_CONSTANTS } from '@/constants/text';

// Move these to constants if they grow
const USER_TYPES: UserTypeOption[] = [
  { value: UserType.ADMIN, label: 'מנהל מערכת' },
  { value: UserType.SYSTEM_MANAGER, label: 'מנהל מערכת' },
  { value: UserType.MANAGER, label: 'מנהל' },
  { value: UserType.TEAM_LEADER, label: 'מפקד צוות' },
  { value: UserType.USER, label: 'חייל' }
];

const TEAMS: TeamOption[] = [
  { value: 'platoon_a', label: 'פלוגה א' },
  { value: 'platoon_b', label: 'פלוגה ב' },
  { value: 'platoon_c', label: 'פלוגה ג' },
  { value: 'headquarters', label: 'מטה' },
  { value: 'support', label: 'תמיכה' }
];

const EMAIL_TEMPLATES = [
  { title: 'תזכורת ציוד', content: 'תזכורת להחזרת ציוד עד סוף השבוע' },
  { title: 'עדכון מערכת', content: 'המערכת תעודכן היום בשעה 23:00' },
  { title: 'הודעה כללית', content: 'הודעה חשובה לכל המשתמשים' }
];

const RECENT_EMAILS = [
  { subject: 'תזכורת ציוד', date: '15/01/2024', recipients: '24 משתמשים' },
  { subject: 'עדכון מערכת', date: '14/01/2024', recipients: 'כל המשתמשים' },
  { subject: 'הודעה דחופה', date: '13/01/2024', recipients: 'מנהלים' }
];

export default function EmailTab() {
  const [recipients, setRecipients] = useState<EmailRecipientType>('all');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<UserForEmail[]>([]);
  const [priority, setPriority] = useState<EmailPriority>('normal');
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [emailSentCount, setEmailSentCount] = useState<string>('');

  const handleSendEmail = () => {
    const emailData = {
      recipients,
      subject,
      message,
      selectedRoles,
      selectedTeams,
      selectedUsers,
      priority,
      recipientCount: getRecipientCount()
    };
    
    console.log('Sending email:', emailData);
    
    // Set the count and show success modal
    setEmailSentCount(emailData.recipientCount);
    setIsSuccessModalOpen(true);
    
    // Clear the form after successful send
    handleClearForm();
  };

  const getRecipientCount = () => {
    if (recipients === 'all') return 'כל המשתמשים';
    if (recipients === 'roles') return `${selectedRoles.length} תפקידים`;
    if (recipients === 'teams') return `${selectedTeams.length} צוותים`;
    if (recipients === 'custom') return `${selectedUsers.length} משתמשים`;
    return 'בחירה מותאמת';
  };

  const handleClearForm = () => {
    setSubject('');
    setMessage('');
    setRecipients('all');
    setSelectedRoles([]);
    setSelectedTeams([]);
    setSelectedUsers([]);
    setPriority('normal');
  };

  const handleCustomSelection = () => {
    setIsCustomModalOpen(true);
  };

  const handleCustomModalConfirm = (users: UserForEmail[]) => {
    setSelectedUsers(users);
    setIsCustomModalOpen(false);
  };

  const handleRecipientsChange = (value: EmailRecipientType) => {
    setRecipients(value);
    if (value === 'custom') {
      handleCustomSelection();
    }
  };

  const handleTemplateSelect = (template: typeof EMAIL_TEMPLATES[0]) => {
    setSubject(template.title);
    setMessage(template.content);
  };

  return (
    <div className="space-y-4">
      {/* Email Form */}
      <Card>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left Column */}
          <div className="space-y-4">
            <FormField label="נמענים">
              <select
                value={recipients}
                onChange={(e) => handleRecipientsChange(e.target.value as EmailRecipientType)}
              >
                <option value="all">כל המשתמשים</option>
                <option value="roles">לפי תפקידים</option>
                <option value="teams">לפי צוותים</option>
                <option value="custom">בחירה מותאמת</option>
              </select>
            </FormField>

            {/* Role Selection */}
            {recipients === 'roles' && (
              <FormField label="תפקידים">
                <div className="space-y-2 max-h-32 overflow-y-auto border border-neutral-200 rounded p-2">
                  {USER_TYPES.map(userType => (
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
                        className="text-primary-600 focus:ring-primary-500 ml-2"
                      />
                      <span className="text-sm text-neutral-700">{userType.label}</span>
                    </div>
                  ))}
                </div>
              </FormField>
            )}

            {/* Team Selection */}
            {recipients === 'teams' && (
              <FormField label="צוותים">
                <div className="space-y-2 max-h-32 overflow-y-auto border border-neutral-200 rounded p-2">
                  {TEAMS.map(team => (
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
                        className="text-primary-600 focus:ring-primary-500 ml-2"
                      />
                      <span className="text-sm text-neutral-700">{team.label}</span>
                    </div>
                  ))}
                </div>
              </FormField>
            )}

            {/* Custom Selection */}
            {recipients === 'custom' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-neutral-700">
                    משתמשים נבחרים: {selectedUsers.length}
                  </span>
                  <Button variant="secondary" onClick={handleCustomSelection} size="sm">
                    ערוך בחירה
                  </Button>
                </div>
                
                {selectedUsers.length > 0 && (
                  <div className="bg-neutral-50 border border-neutral-200 rounded p-3 max-h-32 overflow-y-auto">
                    <div className="space-y-1">
                      {selectedUsers.map(user => (
                        <div key={user.uid} className="flex justify-between items-center text-sm">
                          <span className="text-neutral-900">{user.fullName}</span>
                          <span className="text-neutral-500">{user.team}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedUsers.length === 0 && (
                  <div className="bg-warning-50 border border-warning-200 rounded p-3 text-center">
                    <span className="text-warning-800 text-sm">לא נבחרו משתמשים</span>
                  </div>
                )}
              </div>
            )}

            <FormField label="עדיפות">
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as EmailPriority)}
              >
                <option value="low">נמוכה</option>
                <option value="normal">רגילה</option>
                <option value="high">גבוהה</option>
                <option value="urgent">דחוף</option>
              </select>
            </FormField>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <FormField label="נושא" required>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={TEXT_CONSTANTS.MANAGEMENT_COMPONENTS.MESSAGE_SUBJECT_PLACEHOLDER}
              />
            </FormField>

            <FormField label="הודעה" required>
              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={TEXT_CONSTANTS.MANAGEMENT_COMPONENTS.MESSAGE_CONTENT_PLACEHOLDER}
              />
            </FormField>

            <div className="flex gap-2">
              <Button onClick={handleSendEmail} disabled={!subject.trim() || !message.trim()}>
                {TEXT_CONSTANTS.MANAGEMENT_COMPONENTS.SEND_MESSAGE_BUTTON}
              </Button>
              <Button variant="secondary" onClick={handleClearForm}>
                {TEXT_CONSTANTS.MANAGEMENT_COMPONENTS.CLEAR_FORM}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Templates */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-md font-medium text-neutral-900">תבניות מהירות</h4>
          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => {/* TODO: Handle add new template */}}
          >
            ➕ הוסף תבנית חדשה
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {EMAIL_TEMPLATES.map((template, index) => (
            <button
              key={index}
              onClick={() => handleTemplateSelect(template)}
              className="p-3 text-right border border-neutral-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors"
            >
              <div className="font-medium text-neutral-900 text-sm">{template.title}</div>
              <div className="text-neutral-600 text-xs mt-1">{template.content}</div>
            </button>
          ))}
        </div>
      </Card>

      {/* Recent Emails */}
      <Card>
        <h4 className="text-md font-medium text-neutral-900 mb-3">הודעות אחרונות</h4>
        <div className="space-y-2">
          {RECENT_EMAILS.map((email, index) => (
            <div key={index} className="flex justify-between items-center p-2 border border-neutral-100 rounded">
              <div>
                <div className="font-medium text-neutral-900 text-sm">{email.subject}</div>
                <div className="text-neutral-500 text-xs">{email.recipients}</div>
              </div>
              <div className="text-neutral-400 text-xs">{email.date}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Custom User Selection Modal */}
      <CustomUserSelectionModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onConfirm={handleCustomModalConfirm}
        preSelectedUsers={selectedUsers}
      />

      {/* Success Confirmation Modal */}
      <ConfirmationModal
        isOpen={isSuccessModalOpen}
        title={TEXT_CONSTANTS.MANAGEMENT_COMPONENTS.MESSAGE_SENT_SUCCESS_TITLE}
        message={`ההודעה נשלחה בהצלחה ל-${emailSentCount} נמענים`}
        confirmText="סגור"
        onConfirm={() => setIsSuccessModalOpen(false)}
        onCancel={() => setIsSuccessModalOpen(false)}
        variant="success"
        singleButton={true}
        useHomePageStyle={true}
        icon="📧"
      />
    </div>
  );
}

