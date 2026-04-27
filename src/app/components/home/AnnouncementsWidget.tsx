'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, X, Trash2, Megaphone } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { UserRole } from '@/types/equipment';
import { TEXT_CONSTANTS } from '@/constants/text';
import { Announcement } from '@/types/announcement';
import {
  createAnnouncement,
  deleteAnnouncement,
  getRecentAnnouncements,
} from '@/lib/announcementsService';
import CollapsibleSection from './CollapsibleSection';

const FETCH_LIMIT = 5;
const DEFAULT_VISIBLE = 1;

function canPost(userType?: string | null, role?: string): boolean {
  if (userType === 'admin') return true;
  return role === UserRole.OFFICER || role === UserRole.COMMANDER;
}

function formatTimestamp(ts: Timestamp | null | undefined): string {
  if (!ts) return '';
  const date = ts.toDate();
  return date.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function AnnouncementsWidget() {
  const { enhancedUser, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[] | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const mayPost = canPost(enhancedUser?.userType ?? null, enhancedUser?.role);

  const load = useCallback(async () => {
    try {
      const items = await getRecentAnnouncements(FETCH_LIMIT);
      setAnnouncements(items);
    } catch (err) {
      console.error('Failed to load announcements', err);
      setAnnouncements([]);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    load();
  }, [isAuthenticated, load]);

  if (!isAuthenticated) return null;

  const handleDelete = async (id: string) => {
    if (!window.confirm(TEXT_CONSTANTS.HOME.ANNOUNCEMENTS.DELETE_CONFIRM)) return;
    try {
      await deleteAnnouncement(id);
      await load();
    } catch (err) {
      console.error('Failed to delete announcement', err);
      showToast(TEXT_CONSTANTS.HOME.ANNOUNCEMENTS.POST_ERROR, 'danger');
    }
  };

  const visible = announcements
    ? expanded
      ? announcements
      : announcements.slice(0, DEFAULT_VISIBLE)
    : [];
  const hiddenCount = announcements ? announcements.length - DEFAULT_VISIBLE : 0;

  const headerAction = mayPost ? (
    <button
      type="button"
      onClick={() => setModalOpen(true)}
      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
    >
      <Plus className="w-4 h-4" aria-hidden="true" />
      {TEXT_CONSTANTS.HOME.ANNOUNCEMENTS.NEW_BUTTON}
    </button>
  ) : undefined;

  return (
    <CollapsibleSection
      id="announcements"
      title={TEXT_CONSTANTS.HOME.ANNOUNCEMENTS.SECTION_TITLE}
      icon={<Megaphone className="w-4 h-4" aria-hidden="true" />}
      headerAction={headerAction}
    >
      {announcements === null ? (
        <p className="text-sm text-neutral-500">...</p>
      ) : announcements.length === 0 ? (
        <p className="text-sm text-neutral-500">
          {TEXT_CONSTANTS.HOME.ANNOUNCEMENTS.EMPTY}
        </p>
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            {visible.map((a) => (
              <li
                key={a.id}
                className="p-4 rounded-xl bg-neutral-50 border border-neutral-100"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-neutral-900">{a.title}</h3>
                  {mayPost && (
                    <button
                      type="button"
                      onClick={() => handleDelete(a.id)}
                      className="text-neutral-400 hover:text-danger-600 p-1 rounded-md focus:outline-none focus:ring-2 focus:ring-danger-500 shrink-0"
                      aria-label={TEXT_CONSTANTS.BUTTONS.DELETE}
                    >
                      <Trash2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  )}
                </div>
                <p className="mt-1 text-sm text-neutral-700 whitespace-pre-wrap">{a.body}</p>
                <div className="mt-2 text-xs text-neutral-500 flex items-center gap-2">
                  <span>{TEXT_CONSTANTS.HOME.ANNOUNCEMENTS.POSTED_BY(a.authorName)}</span>
                  <span>•</span>
                  <span>{formatTimestamp(a.createdAt)}</span>
                </div>
              </li>
            ))}
          </ul>
          {hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => setExpanded((prev) => !prev)}
              className="mt-3 text-sm font-medium text-primary-700 hover:text-primary-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-md"
              aria-expanded={expanded}
            >
              {expanded
                ? TEXT_CONSTANTS.HOME.ANNOUNCEMENTS.SHOW_LESS
                : TEXT_CONSTANTS.HOME.ANNOUNCEMENTS.SHOW_ALL(hiddenCount)}
            </button>
          )}
        </>
      )}

      {modalOpen && (
        <CreateAnnouncementModal
          onClose={() => setModalOpen(false)}
          onCreated={async () => {
            setModalOpen(false);
            await load();
          }}
        />
      )}
    </CollapsibleSection>
  );
}

interface ModalProps {
  onClose: () => void;
  onCreated: () => void;
}

function CreateAnnouncementModal({ onClose, onCreated }: ModalProps) {
  const { enhancedUser } = useAuth();
  const { showToast } = useToast();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enhancedUser) return;
    if (!title.trim() || !body.trim()) return;
    setSubmitting(true);
    try {
      await createAnnouncement(
        { title, body },
        {
          uid: enhancedUser.uid,
          displayName:
            [enhancedUser.firstName, enhancedUser.lastName].filter(Boolean).join(' ').trim() ||
            enhancedUser.email ||
            'משתמש',
        }
      );
      onCreated();
    } catch (err) {
      console.error('Failed to create announcement', err);
      showToast(TEXT_CONSTANTS.HOME.ANNOUNCEMENTS.POST_ERROR, 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="card-base w-full max-w-md p-5 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-neutral-900">
            {TEXT_CONSTANTS.HOME.ANNOUNCEMENTS.MODAL_TITLE}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-neutral-500 hover:text-neutral-900 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            aria-label={TEXT_CONSTANTS.BUTTONS.CLOSE}
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-neutral-700">
              {TEXT_CONSTANTS.HOME.ANNOUNCEMENTS.FIELD_TITLE}
            </span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-base"
              required
              maxLength={80}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-neutral-700">
              {TEXT_CONSTANTS.HOME.ANNOUNCEMENTS.FIELD_BODY}
            </span>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              className="input-base resize-y"
              required
              maxLength={600}
            />
          </label>
          <div className="flex items-center justify-end gap-2 mt-2">
            <button type="button" onClick={onClose} className="btn-ghost">
              {TEXT_CONSTANTS.BUTTONS.CANCEL}
            </button>
            <button
              type="submit"
              disabled={submitting || !title.trim() || !body.trim()}
              className="btn-primary"
            >
              {submitting ? TEXT_CONSTANTS.BUTTONS.LOADING : TEXT_CONSTANTS.HOME.ANNOUNCEMENTS.SUBMIT}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
