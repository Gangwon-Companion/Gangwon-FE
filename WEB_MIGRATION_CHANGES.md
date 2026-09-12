# 웹 전환 수정·추가 내역

작성일: 2026-09-06

## 0. 추가 보완 사항

초기 웹 전환 후 실제 AI 추천 요청에서 `503 AI_SERVICE_UNAVAILABLE`이 확인되어 다음 사항을 추가로 점검하고 수정했습니다.

- 브라우저 요청은 `http://localhost:8080/api/v1/courses/recommendations` 백엔드까지 정상 도착했습니다.
- 로컬 백엔드의 일반 API는 정상 응답했지만 기본 AI 서버 주소 `http://127.0.0.1:8000/health`는 연결 거절 상태였습니다.
- AI 서버를 기존 가상환경으로 시작했을 때 `python-dotenv` 모듈 누락으로 종료되는 것을 확인했습니다. 키 파일이나 키 값은 열거나 출력하지 않았습니다.
- AI 프로젝트의 `requirements.txt`에는 `python-dotenv`가 선언되어 있으므로 해당 가상환경에서 의존성 설치 후 AI 서버를 실행해야 합니다.
- 프론트는 `AI_SERVICE_UNAVAILABLE`, 타임아웃, 인증 만료, 요청 과다 등을 구분해 이해하기 쉬운 메시지와 재시도 버튼을 표시하도록 수정했습니다.
- PC 웹에는 화면 전체 너비를 사용하는 콘텐츠 영역과 상단 내비게이션을 적용하고 앱용 하단 탭을 숨겼습니다.
- 홈은 소개 영역과 3열 탐색 카드, 목록 화면은 반응형 카드 그리드로 변경했습니다.
- AI 추천은 좌측 여행 조건 패널과 우측 채팅 영역의 2열 화면으로 변경했습니다.
- 커뮤니티, 마이페이지, 상세 화면에 적용했던 고정 최대 폭을 제거해 브라우저 전체 너비를 사용하도록 조정했습니다.
- 모바일 브라우저와 앱에서는 기존 하단 탭과 1열 화면 구성을 유지합니다.
- AI 요청의 중복 전송을 방지하고 120초 타임아웃 및 화면 종료 시 요청 취소 처리를 추가했습니다.
- 웹 PC 화면에는 상단 내비게이션을 추가하고 모바일 하단 탭을 숨겼습니다.
- 홈·테마·관광지·숙소·음식점 목록에 반응형 그리드를 적용했습니다.
- AI 추천 화면은 PC에서 여행 조건 사이드 영역과 채팅 영역을 나눈 2열 구조로 변경했습니다.
- 시작 화면은 PC에서 소개 영역과 가입·로그인 영역을 나란히 표시하도록 변경했습니다.

AI 서버 복구 명령은 다음과 같습니다. `Gangwon-AI` 폴더에서 실행해야 합니다.

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

이 명령은 AI 서버 프로그램이 기존 설정을 내부적으로 로드하게 하지만, 프론트 코드가 AI API 키를 읽거나 브라우저로 전달하지는 않습니다.

## 1. 작업 범위

기존 React Native + Expo 프로젝트를 재사용하여 브라우저에서 실행할 수 있도록 수정했습니다. 기본 실행 명령을 웹 기준으로 변경하고, 화면 주소 연결·반응형 크기 조정·알림·사진 선택·지도 연결을 보완했습니다.

기존 Android·iOS 실행 명령은 유지했습니다. 백엔드 코드, API 명세, DB 구조는 변경하지 않았으며 운영 서버 배포는 수행하지 않았습니다. `react-native-web` 등 웹 실행 의존성은 이미 설치되어 있어 새 패키지를 추가하지 않았습니다.

## 2. 주요 수정 사항

### 실행 및 빌드 설정

| 파일 | 변경 내용 |
| --- | --- |
| `package.json` | `npm start`를 웹 실행으로 변경하고 `start:native`, `build`, `preview`, `typecheck` 명령 추가 |
| `app.json` | 웹 이름 `강원동행`, Metro 번들러, 단일 HTML 출력 방식(`single`) 지정 |
| `tsconfig.json` | TypeScript 소스 파일을 검사 대상으로 지정하고 `dist`, `web-build` 등 빌드 결과물 제외 |
| `.env.example` | 로컬 API 주소 예시와 배포 시 주소 설정 설명, 지도 클라이언트 키 설정 추가 |

타입 검사 시 압축된 웹 빌드 결과까지 검사하면서 발생하던 스택 초과 문제는 검사 대상을 조정하여 해결했습니다. 최종 설정은 별도의 Node 스택 크기 변경 없이 `tsc --noEmit`을 사용합니다.

### 화면 구조 및 주소 연결

| 파일 | 변경 내용 |
| --- | --- |
| `App.tsx` | 웹 화면 최대 폭을 1,120px로 제한하고 가운데 정렬·배경색 적용, 웹 링크 설정 및 공통 알림 표시 컴포넌트 연결, 브라우저 제목 설정 |
| `src/navigation/RootNavigator.tsx` | 존재하지 않는 주소를 표시하는 `NotFound` 화면 등록 |
| `src/navigation/types.ts` | 탭 파라미터 타입을 이 파일로 이동하고 중첩 내비게이션 및 `NotFound` 타입 추가 |
| `src/navigation/TabNavigator.tsx` | 공통 파일에서 탭 파라미터 타입을 가져오고 기존 참조를 위한 타입 재내보내기 유지 |
| `src/screens/auth/OnboardingScreen.tsx` | 시작 화면 최대 폭 확대 및 `여행지 먼저 둘러보기` 버튼 추가 |

브라우저 주소와 화면 이동을 연결했습니다. 주소로 직접 접속하거나 새로고침할 때에도 화면을 복원할 수 있도록 상세 화면에 제목 기본값과 파라미터 변환을 보완했습니다. 배포 환경에서는 화면 주소를 `index.html`로 연결하는 서버 설정이 필요합니다.

### 화면 크기 대응

| 파일 | 변경 내용 |
| --- | --- |
| `src/screens/home/DestinationDetailScreen.tsx` | 공통 콘텐츠 폭 기준으로 이미지 너비 계산, 제목·반려동물·접근성 파라미터 기본값 추가 |
| `src/screens/home/HotelDetailScreen.tsx` | 공통 콘텐츠 폭 기준으로 이미지 너비 계산, 숙소 이름 기본값 추가 |
| `src/screens/home/RestaurantDetailScreen.tsx` | 공통 콘텐츠 폭 기준으로 이미지 너비 계산, 음식점 이름 기본값 추가 |
| `src/screens/home/ThemeDestinationListScreen.tsx` | 테마 이름 기본값 추가 |
| `src/screens/travel/MyTravelCoursesScreen.tsx` | 고정 시점의 화면 너비 대신 현재 콘텐츠 폭으로 카드 크기 계산, 카드 최대 폭 420px 적용 및 스크롤 간격 연동 |
| `src/screens/community/components/CommunityMediaList.tsx` | 실제 컨테이너 너비를 측정하여 사진 슬라이드 폭 계산, 사진 비율 및 최대 높이 적용 |

기존 화면 구성을 활용한 크기 조정이며, 모든 화면을 별도의 PC 전용 디자인으로 다시 제작한 작업은 아닙니다.

### 알림 및 확인창

앱용 `Alert`를 직접 참조하던 화면을 공통 알림 모듈로 연결했습니다. 웹에서는 알림 제목·내용·버튼을 대화상자로 표시하며, 삭제·취소 등 각 버튼의 콜백을 실행합니다. 연속해서 발생한 알림은 순서대로 표시합니다.

적용 파일:

- `src/screens/auth/EmailLoginScreen.tsx`
- `src/screens/auth/SignUpScreen.tsx`
- `src/screens/community/CommunityScreen.tsx`
- `src/screens/home/DestinationDetailScreen.tsx`
- `src/screens/home/HotelDetailScreen.tsx`
- `src/screens/home/HotelsTabScreen.tsx`
- `src/screens/home/RestaurantDetailScreen.tsx`
- `src/screens/home/RestaurantsTabScreen.tsx`
- `src/screens/home/components/ReviewSection.tsx`
- `src/screens/map/MapTestScreen.tsx`
- `src/screens/mypage/MyPageScreen.tsx`
- `src/screens/travel/MyTravelCoursesScreen.tsx`

기존에 별도로 구현되어 있던 일부 웹 확인 처리는 브라우저 기본 `confirm`을 계속 사용합니다. 모든 확인창을 하나의 형태로 교체한 것은 아닙니다.

### 사진 선택 및 업로드

| 파일 | 변경 내용 |
| --- | --- |
| `src/screens/community/CommunityScreen.tsx` | 웹에서는 앱 사진 권한 요청을 기다리지 않고 클릭 동작에서 파일 선택기를 실행, 선택한 파일 이름과 MIME 타입을 업로드 함수에 전달 |
| `src/screens/community/types.ts` | 첨부 데이터에 선택적 `fileName`, `mimeType` 필드 추가 |
| `src/screens/mypage/MyPageScreen.tsx` | 웹 프로필 사진 선택 시 앱 권한 처리 생략, 실제 파일 이름과 MIME 타입 전달, 프로필 사진 선택 메뉴를 공통 알림으로 연결 |

기존 presigned URL 발급 및 S3 업로드 API는 재사용했습니다. PNG를 선택했을 때 파일 이름과 업로드 타입을 JPEG로 고정하지 않도록 보완했습니다.

### 지도 연결

숙소·음식점 목록과 상세 화면에서 웹 분기를 추가했습니다.

- 웹에서는 `웹 지도` 버튼으로 네이버 지도의 목적지 검색 페이지를 새 탭에 엽니다.
- 검색어에는 확인 가능한 주소와 장소 이름을 사용합니다.
- 웹 분기는 현재 위치 권한 요청 및 `nmap://` 앱 실행보다 먼저 처리합니다.
- 웹에서 경로를 직접 계산하는 기능을 추가한 것은 아니며, 길찾기는 열린 네이버 지도에서 선택합니다.

관련 파일은 `HotelsTabScreen.tsx`, `RestaurantsTabScreen.tsx`, `HotelDetailScreen.tsx`, `RestaurantDetailScreen.tsx`입니다.

`src/screens/map/MapTestScreen.tsx`에는 플랫폼별 지도 컴포넌트와 지도 키 환경변수를 연결했습니다. 웹에서는 자동 위치 권한 요청을 생략하고, 앱에서 위치 조회가 실패하면 오류 알림을 표시합니다. 지도 테스트 화면을 일반 화면 메뉴에 새로 추가하지는 않았습니다.

### API 주소 처리

`src/screens/home/api.ts`에 웹 전용 API 주소 결정 로직을 추가했습니다.

1. `EXPO_PUBLIC_API_URL`이 있으면 해당 주소를 사용합니다.
2. 변수가 없고 로컬 브라우저에서 실행 중이면 `http://localhost:8080`을 사용합니다.
3. 변수가 없고 배포 환경이면 웹사이트와 같은 origin을 사용합니다. 이 경우 서버에서 `/api`를 백엔드에 연결해야 합니다.
4. HTTP·HTTPS 주소인지 확인하고, HTTPS 웹사이트에서 HTTP API를 사용하면 오류 메시지를 표시합니다.

웹에서는 앱 개발용 주소 후보를 순차 조회하는 대신 결정된 API 주소를 사용합니다. 실제 `.env` 파일은 변경하지 않았습니다.

## 3. 추가한 파일

| 파일 | 역할 |
| --- | --- |
| `src/navigation/linking.ts` | 웹 경로와 화면 연결, 숫자·불리언 파라미터 변환 |
| `src/screens/NotFoundScreen.tsx` | 잘못된 주소 안내 및 홈 이동 버튼 |
| `src/hooks/useContentWidth.ts` | 웹 최대 콘텐츠 폭과 현재 화면 너비 계산 |
| `src/utils/alert.tsx` | 기본 플랫폼의 React Native 알림 및 빈 알림 호스트 제공 |
| `src/utils/alert.web.tsx` | 웹 대화상자, 알림 대기열 및 버튼 동작 처리 |
| `src/utils/webMap.ts` | 네이버 웹 지도 검색 페이지 열기 |
| `src/components/MapCanvas.tsx` | 앱용 WebView 지도 렌더링 |
| `src/components/MapCanvas.web.tsx` | 웹용 iframe 지도 렌더링 |
| `public/index.html` | 한국어 HTML 문서, 제목·설명·테마색·화면 높이 및 키보드 포커스 스타일 |
| `scripts/serve-web.cjs` | `dist` 정적 파일과 화면 주소 fallback을 제공하는 로컬 미리보기 서버 |
| `README.md` | 실행, 빌드, 배포, API 및 S3 연결 안내 |
| `WEB_MIGRATION_CHANGES.md` | 웹 전환 수정·추가 내역을 정리한 현재 문서 |

## 4. 웹 경로

| 경로 | 화면 |
| --- | --- |
| `/` | 시작 화면 |
| `/login` | 로그인 방식 선택 |
| `/login/email` | 아이디·비밀번호 로그인 |
| `/signup` | 회원가입 |
| `/home` | 홈 |
| `/my-trips` | 내 여행 |
| `/recommend` | AI 추천 |
| `/community` | 커뮤니티, `postId` 쿼리 파라미터 지원 |
| `/mypage` | 마이 페이지 |
| `/themes` | 테마 목록 |
| `/themes/:themeId` | 테마별 여행지 |
| `/destinations/:destinationId` | 여행지 상세 |
| `/hotels` | 숙소 목록 |
| `/hotels/:lodgingId` | 숙소 상세 |
| `/restaurants` | 음식점 목록 |
| `/restaurants/:restaurantId` | 음식점 상세 |
| `/hotel-navigation` | 기존 호텔 찾기 화면 |
| 그 외 경로 | 페이지를 찾을 수 없다는 안내 |

## 5. 실행 명령

| 명령 | 용도 |
| --- | --- |
| `npm start` 또는 `npm run web` | 웹 개발 서버 실행 |
| `npm run build` | `dist/`에 배포용 웹 결과물 생성 |
| `npm run preview` | 빌드 결과를 `http://localhost:4173`에서 미리보기 |
| `npm run typecheck` | TypeScript 검사 |
| `npm run start:native` | 기존 Expo 개발 서버 실행 |
| `npm run android` / `npm run ios` | 기존 앱 실행 |

미리보기 서버는 로컬 검증용이며 운영 배포 서버가 아닙니다. API 주소 환경변수는 빌드에 반영되므로 주소를 변경하면 다시 빌드해야 합니다.

## 6. 검증 결과

웹 전환 작업 중 다음 항목을 검증했습니다. 이 문서를 작성하면서 앱 기능 검증을 다시 실행한 것은 아닙니다.

| 항목 | 결과 |
| --- | --- |
| `npm run typecheck` | 통과 |
| `npm run build` | 통과 |
| `git diff --check` | 통과 |
| Chrome PC 화면 및 모바일 폭 390px·320px | 검증한 상세 화면에서 문서 가로 넘침 없음 |
| 시작 화면 → 홈 → 내 여행 및 브라우저 뒤로가기 | 통과 |
| 숙소 상세 주소 직접 접속 및 새로고침 | 통과 |
| 로그인 필수 입력 누락 알림 | 통과 |
| 여행 코스 삭제 취소·확인 | 취소 시 삭제 요청 없음, 확인 시 삭제 요청 1회 검증 |
| 웹 지도 버튼 | 네이버 지도 검색 URL 연결 확인 |
| 커뮤니티 사진 선택 및 업로드 | 파일 선택기 실행, PNG 파일 이름 및 `image/png` 요청·Blob 타입 확인 |
| 잘못된 주소 및 홈 복귀 | 통과 |
| 브라우저 런타임 예외 | 검증 시나리오에서 발생하지 않음 |

Chrome 검증은 별도 임시 프로필과 가짜 API·업로드 응답으로 수행했습니다. 실제 계정으로 로그인하거나 운영 게시글·S3 파일을 변경한 검증은 아닙니다. 임시 브라우저 검증 스크립트와 캡처 파일은 정리했으며 저장소에 상시 테스트로 추가하지 않았습니다.

## 7. 실제 서비스 연결 시 남은 확인 사항

다음은 이번 프론트 수정과 별도로 실제 서버 환경에서 확인할 항목입니다. 서버 설정을 확인하거나 변경한 결과를 의미하지 않습니다.

| 대상 | 확인 사항 |
| --- | --- |
| 백엔드 API | 웹과 API origin이 다르면 개발·미리보기·배포 웹 주소에 대한 CORS 허용 여부 |
| 백엔드 인증 설정 | `OPTIONS` 사전 요청 처리, `Authorization`, `Content-Type`, `ngrok-skip-browser-warning` 헤더 허용 여부 |
| 백엔드 메서드 설정 | 실제 사용하는 `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS` 허용 여부 |
| S3 | 웹 origin에서 presigned URL로 `PUT` 및 `Content-Type`을 사용하는 업로드 허용 여부 |
| 배포 서버 | 화면 주소는 `index.html`로 연결하고 `/api/` 요청은 HTML fallback에서 제외 |
| HTTPS | 배포 웹사이트에 맞는 HTTPS API 주소 설정 |
| 내장 네이버 지도 | 지도 테스트 화면 사용 시 클라이언트 키와 웹 서비스 URL 등록 확인 |
| 실제 기능 | 실제 백엔드를 통한 회원가입·로그인·게시글 저장·사진 업로드 등 최종 연동 검증 |

서버 설정 예시와 실행 절차는 [README.md](README.md)를 참고하세요.
