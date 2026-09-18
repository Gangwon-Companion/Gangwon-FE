# 강원동행 웹

Expo와 React Native Web으로 실행하는 강원도 여행 웹사이트입니다. 기존 앱 화면과 API를 재사용하며 모바일 브라우저와 PC 화면을 지원합니다.

## 실행

Node.js 20.19 이상에서 의존성을 설치하고 실행합니다.

```sh
npm install
npm start
```

`npm run web`도 같은 웹 개발 서버를 실행합니다. 기존 앱 실행은 `npm run android`, `npm run ios`, `npm run start:native`를 사용합니다.

`.env.example`을 참고해 `.env`의 `EXPO_PUBLIC_API_URL`을 실제 백엔드 주소로 설정하세요. 기존 `.env`가 있다면 주소를 확인하세요. `EXPO_PUBLIC_` 변수는 브라우저에 공개되므로 비밀 키를 넣으면 안 됩니다.

## 검증과 배포

```sh
npm run typecheck
npm run build
npm run preview
```

빌드 결과는 `dist/`, 로컬 미리보기는 `http://localhost:4173`입니다. 환경변수는 빌드 시 반영되므로 API 주소 변경 후 다시 빌드하세요. 미리보기 서버는 로컬 검증용입니다.

배포 서버는 정적 파일을 제공하고 `/home`, `/hotels/1`, `/community` 같은 화면 주소를 `index.html`로 연결해야 합니다. `/api/` 요청을 HTML로 연결하면 안 됩니다. API를 별도 주소에 배포한다면 HTTPS API 주소를 환경변수에 지정하세요. 변수가 없으면 로컬에서는 `http://localhost:8080`, 배포 환경에서는 웹사이트와 같은 주소의 `/api`를 사용합니다. 같은 주소 방식은 서버의 API 프록시 설정이 필요합니다.

Nginx 예시(실제 API 주소에 맞게 수정):

```nginx
location /api/ {
    proxy_pass http://backend:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
}
location / {
    try_files $uri $uri/ /index.html;
}
```

## 백엔드 연결

여행 취향 프로필의 마이페이지 UI, 분석 Job Polling과 상태별 동작은 [docs/AI_TRAVEL_PROFILE.md](docs/AI_TRAVEL_PROFILE.md)에 정리되어 있습니다.

기존 API와 DB 구조를 바꾸는 작업은 포함하지 않습니다. 별도 origin의 API를 사용하는 경우 서버에서 다음을 허용해야 합니다.

- 웹 주소: 개발 서버 주소, `http://localhost:4173`, 실제 배포 도메인.
- 사용하는 메서드: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`.
- 요청 헤더: `Authorization`, `Content-Type`, `ngrok-skip-browser-warning`.
- 인증 필터보다 먼저 CORS 사전 요청(`OPTIONS`) 처리.

사진은 기존 presigned URL 방식으로 S3에 직접 업로드합니다. S3에도 웹 도메인에서 `PUT` 및 `Content-Type`을 사용하는 업로드를 허용하는 CORS 설정이 필요합니다. API 서버 CORS와 별도입니다. [CORS 참고](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS)

## 웹 동작

- 시작 화면에서 회원가입, 로그인, 여행지 둘러보기를 선택할 수 있습니다.
- 화면 주소와 브라우저 뒤로가기·앞으로가기를 연결했습니다. [React Navigation 링크 설정](https://reactnavigation.org/docs/configuring-links/)
- 알림과 삭제 확인은 웹 대화상자로 표시합니다.
- 사진 선택은 버튼 클릭에서 브라우저 파일 선택기를 바로 엽니다. 파일 이름과 MIME 타입을 업로드에 전달합니다. [Expo ImagePicker](https://docs.expo.dev/versions/v54.0.0/sdk/imagepicker/)
- 웹 지도 버튼은 네이버 지도에서 목적지를 검색하는 새 탭을 엽니다. 길찾기는 열린 지도에서 선택합니다.
- 지도 테스트 화면의 내장 지도는 별도로 Naver Cloud의 웹 서비스 URL 등록과 지도 키가 필요합니다.

실제 로그인·게시글 저장·사진 업로드 검증에는 실행 중인 백엔드와 S3 설정이 필요합니다.
