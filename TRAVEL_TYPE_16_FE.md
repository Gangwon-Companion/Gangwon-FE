# Travel Type 16 — FE 구현 및 운영 명세

## 구현 상태

- 상태: 구현 완료
- 별도 설문 없이 활동 기록 자동 분석
- 마이페이지 요약 카드와 상세 결과 화면 구현
- 네 축 설명과 16유형 전체 카탈로그 구현
- 프로필 GET 요청 캐시 비활성화

## 진입점

```text
마이페이지 → 나의 여행 유형
```

마이페이지 요약 카드:

- 완료 상태: `CAPF · 도시 정복 플래너`, 설명 일부 표시
- 미분석 상태: 활동 기록 자동 분석 안내
- 화면 포커스마다 프로필을 다시 조회해 최신 결과 반영

## 상세 화면

### 결과 영역

- 4글자 유형 코드
- 유형명과 설명
- 태그
- 네 축의 좌우 비율
- 분석 근거
- 자동 분석 또는 다시 분석하기 버튼

### 유형 안내 영역

- `C/N`: City 도시형 / Nature 자연형
- `A/R`: Active 체험형 / Rest 휴식형
- `P/S`: Planned 계획형 / Spontaneous 즉흥형
- `F/H`: Famous 명소형 / Hidden 로컬형
- 각 축의 판단 기준
- CAPF부터 NRSH까지 16유형 전체 이름과 설명
- 현재 결과에는 `나의 유형` 강조 표시

## 화면 상태

- `NOT_ANALYZED`: 분석 안내와 시작 버튼
- `PENDING`, `RUNNING`: 분석 중 표시, 중복 요청 방지
- `COMPLETED`: 전체 결과 표시
- `INSUFFICIENT_DATA`: 검색·방문·저장 코스·리뷰 기록이 더 필요하다는 안내
- `FAILED`: BE의 `errorMessage` 표시 및 재시도 허용

## API

- `GET /api/v1/users/me/travel-profile`
- `POST /api/v1/users/me/travel-profile/analysis-jobs`
- `GET /api/v1/users/me/travel-profile/analysis-jobs/{jobId}`

Job 생성 후 1초 간격으로 최대 60회 조회한다. `COMPLETED`이면 반환된 프로필로 즉시 화면을 갱신한다. `FAILED` Job은 재사용하지 않는다.

FE는 유형을 다시 계산하지 않고 BE 결과를 표시한다.

## 캐시 정책

실제 발생한 문제:

1. 최초 진입 시 `NOT_ANALYZED` 조회
2. 자동 분석 결과는 Job 응답으로 정상 표시
3. 뒤로 갔다가 재진입하면 최초 미분석 화면이 다시 표시

DB에는 `COMPLETED / CAPF / travel-type-16-v1`이 정상 저장되어 있었다. 구버전 BE 조회 필터와 GET 캐시 가능성을 함께 제거했다.

FE 처리:

```ts
fetch('/api/v1/users/me/travel-profile', {
  cache: 'no-store',
});
```

BE도 `Cache-Control: no-store`를 반환한다.

## 트러블슈팅

### 분석 직후 결과가 나오지만 재진입하면 사라짐

1. Network 탭에서 `GET /travel-profile` 응답 확인
2. 응답이 `NOT_ANALYZED`면 BE 이미지와 분석 버전 확인
3. 응답이 `COMPLETED`인데 화면이 비어 있으면 FE 캐시·상태 반영 확인
4. 최신 FE·BE 재실행 후 웹에서 `Ctrl + Shift + R`

### 자동 분석이 `FAILED`

- `AI_SERVICE_UNAVAILABLE`: BE와 AI 주소·포트 확인
- `INTERNAL_SERVER_ERROR`: BE 로그와 DB 제약조건 확인
- 오류 해결 후 새 Job 생성

### 기록 부족

유효 활동 신호가 3건 미만이면 정상적으로 `INSUFFICIENT_DATA`가 표시된다. 검색, 방문, 코스 저장 또는 리뷰를 추가한 뒤 다시 분석한다.

## 실행 및 검증

```powershell
npm run typecheck
npm run start
```

웹에서 확인할 항목:

1. 마이페이지 요약 카드
2. 상세 화면 자동 분석
3. 뒤로 이동 후 재진입 시 결과 유지
4. 네 축 설명
5. 16유형 전체 목록과 `나의 유형` 강조
6. 다시 분석하기
