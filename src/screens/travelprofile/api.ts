import { ApiError, clearAccessToken, getAccessToken, parseApiError } from '../../api/auth';
import { getApiBaseUrl, requestHeaders } from '../home/api';

export type TravelerType =
  | 'CAPF' | 'CAPH' | 'CASF' | 'CASH' | 'CRPF' | 'CRPH' | 'CRSF' | 'CRSH'
  | 'NAPF' | 'NAPH' | 'NASF' | 'NASH' | 'NRPF' | 'NRPH' | 'NRSF' | 'NRSH';

export type AxisScores = {
  space: { C: number; N: number };
  activity: { A: number; R: number };
  schedule: { P: number; S: number };
  place: { F: number; H: number };
};

export type TravelProfile = {
  status: 'NOT_ANALYZED' | 'COMPLETED' | 'INSUFFICIENT_DATA';
  travelerType: TravelerType | null;
  title: string | null;
  description: string | null;
  tags: string[];
  evidences: string[];
  confidence: number | null;
  axisScores: AxisScores | null;
  analyzedAt: string | null;
};

type AnalysisJob = {
  jobId: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  profile?: TravelProfile | null;
  errorCode?: string | null;
  errorMessage?: string | null;
};

async function authenticatedFetch(path: string, init: RequestInit = {}) {
  const token = await getAccessToken();
  if (!token) throw new ApiError('로그인이 필요합니다.', 401, 'UNAUTHORIZED');
  const baseUrl = await getApiBaseUrl(init.signal ?? undefined);
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: { ...requestHeaders, 'Content-Type': 'application/json', ...init.headers, Authorization: `Bearer ${token}` },
  });
  if (response.status === 401) await clearAccessToken();
  if (!response.ok) throw await parseApiError(response);
  return response;
}

export async function getTravelProfile(signal?: AbortSignal): Promise<TravelProfile> {
  return (await authenticatedFetch('/api/v1/users/me/travel-profile', { signal, cache: 'no-store' })).json();
}

export async function startTravelProfileAnalysis(): Promise<AnalysisJob> {
  return (await authenticatedFetch('/api/v1/users/me/travel-profile/analysis-jobs', { method: 'POST' })).json();
}

export async function getTravelProfileAnalysisJob(jobId: string, signal?: AbortSignal): Promise<AnalysisJob> {
  return (await authenticatedFetch(`/api/v1/users/me/travel-profile/analysis-jobs/${jobId}`, { signal })).json();
}
