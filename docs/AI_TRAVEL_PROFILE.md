# AI 여행 취향 프로필 — FE 구현 현황

## 목표

마이페이지에서 로그인 사용자의 저장된 여행 취향 프로필을 조회하고, 비동기 분석 Job을 생성한 뒤 완료까지 Polling하여 결과를 표시한다.

## 현재 구현 상태

**마이페이지 카드 MVP 구현 완료**

- `GET /api/v1/users/me/travel-profile` 저장 프로필 조회
- `POST /api/v1/users/me/travel-profile/analysis-jobs` 분석 또는 재분석 요청
- `GET /api/v1/users/me/travel-profile/analysis-jobs/{jobId}` 1.5초 간격 Polling
- `NOT_ANALYZED`, 분석 중, `COMPLETED`, `INSUFFICIENT_DATA`, Job 실패와 API 오류 UI
- 완료 결과의 제목, 설명, 태그와 분석 근거 표시
- 분석 중 버튼 중복 입력 방지 및 화면 unmount 시 Polling timer 정리
- 완료 응답의 프로필로 화면 즉시 갱신
- TypeScript 타입 검사 통과

관련 구현:

- `src/screens/mypage/TravelProfileCard.tsx`
- `src/screens/mypage/api.ts`
- `src/screens/mypage/MyPageScreen.tsx`

## 화면 상태

| 상태 | 표시 |
| --- | --- |
| 최초 로딩 | 카드 내부 로딩 표시 |
| `NOT_ANALYZED` | 분석 안내와 `취향 분석하기` 버튼 |
| `PENDING` / `RUNNING` | 버튼 로딩 및 중복 요청 차단 |
| `COMPLETED` | 제목·설명·태그·근거와 `다시 분석하기` 버튼 |
| `INSUFFICIENT_DATA` | 활동이 더 필요하다는 안내와 재분석 버튼 |
| Job `FAILED` | 서버 공개 메시지와 재시도 가능한 버튼 |
| 네트워크/API 오류 | 카드 내부 오류 메시지 |

## 로컬 설정

브라우저에서 로컬 BE를 호출할 때 필요한 공개 변수는 다음 하나다.

```dotenv
EXPO_PUBLIC_API_URL=http://localhost:8080
```

`EXPO_PUBLIC_` 변수는 브라우저 번들에 포함된다. OpenAI 키, 내부 API 키, JWT 비밀키와 DB 비밀번호를 FE 환경변수에 넣지 않는다.

## 검증

```powershell
npm run typecheck
npm start
```

브라우저에서 로그인한 뒤 마이페이지의 `나의 여행 취향` 카드를 확인한다. 분석 전, 데이터 부족, 완료, 재분석과 오류 상태를 각각 확인해야 한다.

## 체크리스트

- [x] API Client와 응답 타입
- [x] 마이페이지 여행 취향 카드
- [x] 분석 Job 생성 및 Polling
- [x] 완료·데이터 부족·실패 상태 UI
- [x] 태그와 분석 근거 표시
- [x] 재분석 및 완료 결과 갱신
- [x] TypeScript 타입 검사
- [ ] 데이터 부족 상태에서 검색·리뷰 화면으로 이동하는 CTA
- [ ] Expo 웹 실제 빌드
- [ ] 브라우저와 모바일 기기 반응형·접근성 검증
- [ ] 컴포넌트·API 자동 테스트
- [ ] 실행 중인 BE·AI와 최종 E2E

