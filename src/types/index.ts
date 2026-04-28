export type Building = 'A' | 'B' | 'C' | 'D' | 'E';
export type Gender = 'male' | 'female';
export type UserRole = 'user' | 'admin';
export type PostType = 'community' | 'trade' | 'delivery' | 'roommate';
export type TradeSubType = 'sell' | 'buy';
export type TradeStatus = 'selling' | 'sold';
export type RoommateSubType = 'looking' | 'found';

export type VerificationStatus = 'none' | 'pending' | 'approved' | 'rejected';

export interface User {
  uid: string;
  email: string;
  name: string;
  nickname: string;
  gender: Gender;
  building: Building;
  roomNumber: string;
  role: UserRole;
  profileImageUrl?: string;
  verifiedUntil: string;
  verificationStatus?: VerificationStatus;
  acceptanceImageUrl?: string;
  verified: boolean;
}

export interface Post {
  id: string;
  type: PostType;
  subType?: TradeSubType | RoommateSubType | string;
  authorUid: string;
  authorName: string;
  title: string;
  body: string;
  imageUrls: string[];
  likes: number;
  likedBy: string[];
  createdAt: string;
  // Trade
  price?: number;
  tradeStatus?: TradeStatus;
  // Roommate
  lifePattern?: string;
  lookingFor?: string;
  // Delivery / Group
  maxPeople?: number;
  currentCount?: number;
  deadline?: string;
}

export interface Comment {
  id: string;
  postId: string;
  authorUid: string;
  authorName: string;
  body: string;
  createdAt: string;
}

export interface Chat {
  id: string;
  participants: string[];
  lastMessage: string;
  lastMessageAt: string;
}

export interface Message {
  id: string;
  senderUid: string;
  text: string;
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  maxPeople: number;
  members: string[];
  createdAt: string;
}

export interface LaundryMachine {
  id: string;
  building: Building;
  floor: number;
  type: 'washer' | 'dryer';
  inUse: boolean;
  startedAt?: string;
  durationMin?: number;
  startedByUid?: string;
}

export interface RoomWish {
  semester: string; // e.g. "2025-1"
  building: Building;
  roomNumber: string;
  wishes: string[]; // uids
}
