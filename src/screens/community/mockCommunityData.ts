import { CommunityPost, DraftPost, MediaType, TravelCourse } from './types';
import { DAY_MS } from './constants';

const NOW_MS = Date.now();

export const MY_TRAVEL_COURSES: TravelCourse[] = [
  {
    id: 1,
    title: '강릉 바다 산책 1박 2일',
    days: '1박 2일',
    places: ['안목해변', '초당순두부마을', '경포호'],
  },
  {
    id: 2,
    title: '춘천 반려견 동반 코스',
    days: '당일치기',
    places: ['공지천', '소양강 스카이워크', '카페거리'],
  },
  {
    id: 3,
    title: '속초 무장애 힐링 여행',
    days: '2박 3일',
    places: ['영랑호', '속초해수욕장', '중앙시장'],
  },
];

export const MOCK_COMMUNITY_POSTS: CommunityPost[] = [
  {
    id: 101,
    author: '여행하는 민지',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop',
    isMine: false,
    content:
      '강릉 안목해변은 오전에 가면 사람이 적어서 반려견이랑 걷기 정말 좋았어요. 카페마다 야외석이 많고, 주차장도 가까워서 이동 부담이 적었습니다. 저녁에는 경포호 쪽으로 넘어가니 바람이 시원해서 산책 코스로 딱이었어요.',
    media: [
      {
        id: 1,
        type: 'image',
        uri: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=900&h=700&fit=crop',
        originalUri: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
      },
      {
        id: 2,
        type: 'video',
        uri: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=900&h=700&fit=crop',
        originalUri: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee',
      },
    ],
    course: MY_TRAVEL_COURSES[0],
    hashtags: ['강릉', '반려동물동반', '바다산책'],
    liked: false,
    saved: true,
    likeCount: 42,
    saveCount: 18,
    comments: [
      {
        id: 1,
        author: '초코보호자',
        content: '안목해변 야외석 정보 좋네요!',
        createdAt: '방금 전',
        createdAtMs: NOW_MS - 5 * 60 * 1000,
        liked: false,
        likeCount: 6,
      },
      {
        id: 2,
        author: '하늘',
        content: '경포호 저녁 산책 메모해둘게요.',
        createdAt: '12분 전',
        createdAtMs: NOW_MS - 12 * 60 * 1000,
        liked: true,
        likeCount: 12,
      },
    ],
    createdAt: '2시간 전',
    createdAtMs: NOW_MS - 2 * 60 * 60 * 1000,
  },
  {
    id: 102,
    author: '나',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&h=120&fit=crop',
    isMine: true,
    content:
      '춘천 당일치기 코스로 다녀왔습니다. 공지천 주변이 걷기 편했고, 소양강 스카이워크는 사진 찍기 좋아요. 점심 이후에는 사람이 많아서 오전 이동을 추천합니다.',
    media: [
      {
        id: 3,
        type: 'image',
        uri: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=900&h=700&fit=crop',
        originalUri: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb',
      },
    ],
    course: MY_TRAVEL_COURSES[1],
    hashtags: ['춘천', '당일치기', '여행기록'],
    liked: true,
    saved: false,
    likeCount: 27,
    saveCount: 9,
    comments: [
      {
        id: 3,
        author: '도도',
        content: '오전 이동 팁 감사합니다.',
        createdAt: '1시간 전',
        createdAtMs: NOW_MS - 60 * 60 * 1000,
        liked: false,
        likeCount: 3,
      },
    ],
    createdAt: '어제',
    createdAtMs: NOW_MS - DAY_MS,
  },
  {
    id: 103,
    author: '무장애 여행러',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop',
    isMine: false,
    content:
      '속초는 이동 동선만 잘 잡으면 휠체어로도 편하게 둘러볼 수 있었어요. 영랑호 주변 산책로가 넓고 평탄했고, 중앙시장은 일부 구간이 붐비니 이른 시간 방문이 좋았습니다.',
    media: [],
    course: MY_TRAVEL_COURSES[2],
    hashtags: ['속초', '무장애여행', '힐링'],
    liked: false,
    saved: false,
    likeCount: 64,
    saveCount: 31,
    comments: [],
    createdAt: '3일 전',
    createdAtMs: NOW_MS - 3 * DAY_MS,
  },
];

export const MEDIA_PRESETS: Record<MediaType, Array<{ uri: string; originalUri: string }>> = {
  image: [
    {
      uri: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=900&h=700&fit=crop',
      originalUri: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e',
    },
    {
      uri: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=900&h=700&fit=crop',
      originalUri: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b',
    },
    {
      uri: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=900&h=700&fit=crop',
      originalUri: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429',
    },
  ],
  video: [
    {
      uri: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=900&h=700&fit=crop',
      originalUri: 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e',
    },
  ],
};

export const EMPTY_DRAFT_POST: DraftPost = {
  title: '',
  content: '',
  hashtags: '',
  media: [],
  courseId: null,
};
