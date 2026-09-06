export class RecommendationError extends Error {
  constructor(message: string, public retryable: boolean) { super(message); }
}

export async function recommendationResponseError(response: Response) {
  let code: string | undefined;
  try {
    const body = await response.json();
    if (typeof body?.code === 'string') code = body.code;
  } catch { /* Gateways may return HTML rather than JSON. */ }

  if (code === 'AI_SERVICE_UNAVAILABLE') {
    return new RecommendationError('여행 추천 서비스에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.', true);
  }
  if (response.status === 503) {
    return new RecommendationError('지금은 여행 추천 서비스를 이용할 수 없습니다. 잠시 후 다시 시도해 주세요.', true);
  }
  if (response.status === 504 || code === 'AI_SERVICE_TIMEOUT') {
    return new RecommendationError('추천을 만드는 데 시간이 오래 걸리고 있습니다. 같은 조건으로 다시 시도할 수 있어요.', true);
  }
  if (response.status === 401) return new RecommendationError('로그인이 만료되었습니다. 다시 로그인해 주세요.', false);
  if (response.status === 403) return new RecommendationError('이 계정으로 추천을 요청할 수 없습니다. 로그인 상태를 확인해 주세요.', false);
  if (response.status === 429) return new RecommendationError('요청이 많아 잠시 쉬어가고 있어요. 잠시 후 다시 시도해 주세요.', true);
  if (response.status >= 500) return new RecommendationError('여행 추천을 처리하지 못했습니다. 같은 조건으로 다시 시도해 주세요.', true);
  return new RecommendationError('여행 조건을 처리하지 못했습니다. 지역과 기간을 확인하고 다시 입력해 주세요.', false);
}
