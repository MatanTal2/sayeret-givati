import { Timestamp } from 'firebase/firestore';

export type UnitMediaType = 'image' | 'video';

export interface UnitMedia {
  id: string;
  type: UnitMediaType;
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  createdAt: Timestamp;
}
