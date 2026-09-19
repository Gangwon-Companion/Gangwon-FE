import type { AxisScores, TravelerType } from './api';

export const TRAVEL_AXES: Array<{
  key: keyof AxisScores;
  left: string;
  right: string;
  leftLabel: string;
  rightLabel: string;
  description: string;
}> = [
  { key: 'space', left: 'C', right: 'N', leftLabel: 'City 도시형', rightLabel: 'Nature 자연형', description: '도시의 활기와 자연의 여유 중 더 끌리는 공간을 나타내요.' },
  { key: 'activity', left: 'A', right: 'R', leftLabel: 'Active 체험형', rightLabel: 'Rest 휴식형', description: '몸을 움직이는 체험과 편안한 휴식 중 선호하는 방식을 나타내요.' },
  { key: 'schedule', left: 'P', right: 'S', leftLabel: 'Planned 계획형', rightLabel: 'Spontaneous 즉흥형', description: '미리 짠 일정과 현장에서 정하는 자유 일정 중 가까운 방식을 나타내요.' },
  { key: 'place', left: 'F', right: 'H', leftLabel: 'Famous 명소형', rightLabel: 'Hidden 로컬형', description: '대표 명소와 숨은 로컬 공간 중 더 자주 찾는 장소를 나타내요.' },
];

export const TRAVEL_TYPE_CATALOG: Array<{ code: TravelerType; title: string; description: string }> = [
  { code: 'CAPF', title: '도시 정복 플래너', description: '도시의 대표 명소와 체험을 촘촘한 일정으로 즐겨요.' },
  { code: 'CAPH', title: '히든시티 전략가', description: '숨은 도시 콘텐츠를 미리 조사해 경험해요.' },
  { code: 'CASF', title: '랜드마크 액션러', description: '유명한 도심 명소와 체험을 자유롭게 누벼요.' },
  { code: 'CASH', title: '골목 모험 스카우트', description: '발길 닿는 골목에서 새로운 활동을 발견해요.' },
  { code: 'CRPF', title: '도심 힐링 가이드', description: '대표 도시 공간을 여유로운 계획으로 즐겨요.' },
  { code: 'CRPH', title: '골목 감성 큐레이터', description: '조용한 카페와 숨은 공간을 코스로 엮어요.' },
  { code: 'CRSF', title: '도심 여유 산책가', description: '유명 도시 공간을 부담 없이 산책하듯 즐겨요.' },
  { code: 'CRSH', title: '골목 낭만 유랑자', description: '계획 없이 걷다가 마음에 드는 공간에 머물러요.' },
  { code: 'NAPF', title: '자연 원정대장', description: '유명 자연 명소와 액티비티를 계획적으로 공략해요.' },
  { code: 'NAPH', title: '자연 탐험 플래너', description: '숨은 자연 명소와 활동을 미리 조사해 찾아가요.' },
  { code: 'NASF', title: '자연 액티비티 헌터', description: '유명 자연 명소와 레포츠를 즉흥적으로 즐겨요.' },
  { code: 'NASH', title: '야생 모험 개척자', description: '정해진 코스 없이 숨은 자연에 뛰어들어요.' },
  { code: 'NRPF', title: '절경 힐링 설계자', description: '대표적인 자연 명소에서 완벽한 휴식을 계획해요.' },
  { code: 'NRPH', title: '숲속 힐링 설계자', description: '한적한 자연 속 숨은 휴식처를 계획해 찾아가요.' },
  { code: 'NRSF', title: '풍경 따라 쉼표 여행자', description: '유명한 자연 풍경을 따라 자유롭게 쉬어가요.' },
  { code: 'NRSH', title: '자연 속 은둔 유랑자', description: '사람 적은 자연에서 즉흥적으로 머물 곳을 정해요.' },
];
