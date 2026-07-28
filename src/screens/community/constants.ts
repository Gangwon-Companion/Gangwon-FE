import { CommentSortOption, PeriodOption, SortOptionConfig } from './types';

export const COMMUNITY_COLORS = {
  primary: '#008A9A',
  primaryDark: '#006F7D',
  primaryLight: '#D7F1ED',
  bg: '#F7F8FA',
  white: '#FFFFFF',
  text: '#1F2933',
  textSub: '#6B7280',
  textMuted: '#9CA3AF',
  border: '#E5E7EB',
  red: '#EF4444',
};

export const SORT_OPTIONS: SortOptionConfig[] = [
  { key: 'latest', label: '최신순', icon: 'time-outline' },
  { key: 'likes', label: '좋아요순', icon: 'heart-outline' },
  { key: 'saves', label: '저장순', icon: 'bookmark-outline' },
];

export const COMMENT_SORT_OPTIONS: Array<{ key: CommentSortOption; label: string }> = [
  { key: 'latest', label: '최신순' },
  { key: 'likes', label: '추천순' },
];

export const PERIOD_OPTIONS: Array<{ key: PeriodOption; label: string; days?: number }> = [
  { key: 'all', label: '전체' },
  { key: 'week', label: '1주일', days: 7 },
  { key: 'month', label: '한달', days: 30 },
  { key: 'threeMonths', label: '3개월', days: 90 },
  { key: 'sixMonths', label: '6개월', days: 180 },
  { key: 'year', label: '1년', days: 365 },
];

export const POST_PAGE_SIZE = 2;
export const MAX_MEDIA_COUNT = 10;
export const DAY_MS = 24 * 60 * 60 * 1000;
