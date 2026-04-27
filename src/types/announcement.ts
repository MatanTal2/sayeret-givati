import { Timestamp } from 'firebase/firestore';

export interface Announcement {
  id: string;
  title: string;
  body: string;
  authorId: string;
  authorName: string;
  createdAt: Timestamp;
}

export type NewAnnouncementInput = Pick<Announcement, 'title' | 'body'>;
