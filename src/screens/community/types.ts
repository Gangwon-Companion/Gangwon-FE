import { Ionicons } from '@expo/vector-icons';

export type SortOption = 'latest' | 'likes' | 'saves';
export type CommentSortOption = 'latest' | 'likes';
export type PeriodOption = 'all' | 'week' | 'month' | 'threeMonths' | 'sixMonths' | 'year';
export type MediaType = 'image' | 'video';

export type TravelCourse = {
  id: number;
  title: string;
  days: string;
  places: string[];
};

export type CommunityComment = {
  id: number;
  author: string;
  avatar?: string | null;
  content: string;
  createdAt: string;
  createdAtMs: number;
  liked: boolean;
  isMine: boolean;
  likeCount: number;
};

export type CommunityMedia = {
  id: number;
  type: MediaType;
  uri: string;
  originalUri?: string;
};

export type CommunityPost = {
  id: number;
  title?: string;
  author: string;
  avatar?: string | null;
  isMine: boolean;
  content: string;
  media: CommunityMedia[];
  course?: TravelCourse;
  hashtags: string[];
  liked: boolean;
  saved: boolean;
  likeCount: number;
  saveCount: number;
  commentCount: number;
  comments: CommunityComment[];
  createdAt: string;
  createdAtMs: number;
};

export type DraftPost = {
  title: string;
  content: string;
  hashtags: string;
  media: CommunityMedia[];
  courseId: number | null;
};

export type SortOptionConfig = {
  key: SortOption;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};
