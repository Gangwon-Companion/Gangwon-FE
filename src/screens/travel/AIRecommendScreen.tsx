import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useDesktopLayout } from '../../hooks/useContentWidth';
import { RecommendationError, recommendationResponseError } from './recommendationError';
import {
  buildRequestHeaders,
  DestinationListItem,
  getApiBaseUrl,
  Theme,
} from '../home/api';

const COLORS = {
  primary: '#008A9A',
  primaryDark: '#006F7C',
  mint: '#E6F6F4',
  background: '#F7F8FA',
  text: '#1F2933',
  subText: '#6B7280',
  muted: '#9CA3AF',
  border: '#E5E7EB',
  white: '#FFFFFF',
};

type Message = {
  id: number;
  text: string;
  from: 'ai' | 'user';
};

type CourseRecommendationResponse = {
  status?: string;
  request?: CourseRequestContext;
  missing_fields?: string[];
  clarification_questions?: string[];
  messages?: string[];
  search_relaxations?: SearchRelaxation[];
  search_diagnostics?: unknown;
  lodging_candidates?: unknown[];
  missing_slots?: unknown[];
  retry_actions?: unknown[];
  final_response?: {
    response_status?: string;
    answer?: string;
    notices?: string[];
    summary?: string;
    title?: string;
    days?: RecommendationDay[];
    accommodations?: RecommendationVisit[];
  } | null;
};

type CourseRecommendationJobResponse = {
  jobId: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  result?: CourseRecommendationResponse | null;
  errorCode?: string | null;
  message?: string | null;
};

type RecommendationVisit = {
  id?: number | string;
  placeId?: number | string;
  lodgingId?: number | string;
  time?: string;
  slot?: string;
  place_id?: string;
  name: string;
  category: 'DESTINATION' | 'RESTAURANT' | 'LODGING' | string;
  address?: string | null;
  operating_hours?: string | null;
  accessibility?: Record<string, unknown>;
  recommendation_reason?: string;
};

type SearchRelaxation = {
  agent?: string;
  domain?: string;
  slot?: string;
  reason?: string;
};

type RecommendationDay = {
  day: number;
  summary: string;
  visits: RecommendationVisit[];
};

type ReadyRecommendation = {
  title: string;
  summary: string;
  days: RecommendationDay[];
  accommodations: RecommendationVisit[];
  notices: string[];
  relaxationReasons: string[];
};

function uniqueTexts(values: Array<string | null | undefined>) {
  return [...new Set(values.map((value) => value?.trim()).filter((value): value is string => !!value))];
}

function extractAccommodations(response: CourseRecommendationResponse['final_response']) {
  return response?.accommodations ?? [];
}

function extractRelaxationReasons(data: CourseRecommendationResponse) {
  return uniqueTexts((data.search_relaxations ?? []).map((item) => item.reason));
}

function summarizeUserNotices(notices: string[] = [], context: CourseRequestContext = {}) {
  if (notices.length === 0) return [];

  const messages = ['일부 장소의 운영시간이나 이용 가능 여부는 달라질 수 있어요. 방문 전에 한 번 더 확인해 주세요.'];
  const hasAccessibilityRequest = context.pet_allowed === true || context.wheelchair_accessible === true
    || notices.some((notice) => /pet_|반려동물|wheelchair|무장애|휠체어|이동 편의/.test(notice));

  if (hasAccessibilityRequest) {
    messages.push('식당과 숙소는 반려동물 동반이나 이동 편의 정보를 확인하기 어려울 수 있어요. 예약이나 방문 전에 확인해 주세요.');
  }

  return messages.slice(0, 2);
}

function getVisitKey(visit: RecommendationVisit, fallback: string) {
  return visit.place_id ?? visit.slot ?? `${visit.name}-${fallback}`;
}

function getAccommodationNightLabel(visit: RecommendationVisit, index: number) {
  const matched = visit.slot?.match(/D(\d+)_LODGING/i);
  const night = matched ? Number(matched[1]) : index + 1;
  return `${night}박차`;
}

function getAccommodationDay(visit: RecommendationVisit, index: number) {
  const matched = visit.slot?.match(/D(\d+)_LODGING/i);
  return matched ? Number(matched[1]) : index + 1;
}

function shouldShowAccommodationNight(accommodations: RecommendationVisit[]) {
  return accommodations.length > 1;
}

function extractPlaceId(visit: RecommendationVisit) {
  const directId = visit.placeId ?? visit.lodgingId ?? visit.id;
  const numericDirectId = Number(directId);
  if (Number.isFinite(numericDirectId) && numericDirectId > 0) return numericDirectId;
  const matched = visit.place_id?.match(/(\d+)$/);
  return matched ? Number(matched[1]) : null;
}

const INITIAL_MESSAGE: Message = {
  id: 1,
  from: 'ai',
  text: '안녕하세요! 강원 여행을 함께 찾아볼까요?\n원하는 여행 지역과 기간을 알려주세요.',
};

type CourseRequestContext = {
  region?: string | null;
  travel_days?: number | null;
  nights?: number | null;
  pet_allowed?: boolean | null;
  pet_size?: 'SMALL' | 'MEDIUM' | 'LARGE' | null;
  wheelchair_accessible?: boolean | null;
  indoor_pet?: boolean | null;
  max_price?: number | null;
  preferences?: string[];
};

function inferFollowUpFields(answer: string, missingFields: string[]): CourseRequestContext {
  if (!missingFields.includes('pet_allowed')) return {};

  const normalized = answer.replace(/\s+/g, ' ').trim().toLowerCase();
  const negative = /(같이|함께|동반)?.{0,4}(안|않)|아니|없(?:이|어|어요)?|미동반|혼자/.test(normalized);
  if (negative) return { pet_allowed: false };

  const affirmative = /같이|함께|동반|응|네|예|맞아|그래|좋아/.test(normalized);
  return affirmative ? { pet_allowed: true } : {};
}

const QUICK_QUESTIONS = ['바다 보러 가고 싶어요', '아이와 함께 여행', '조용한 힐링 여행'];

export default function AIRecommendScreen() {
  const desktop = useDesktopLayout();
  const navigation = useNavigation<any>();
  const [input, setInput] = useState('');
  const [recommendations, setRecommendations] = useState<DestinationListItem[]>([]);
  const [recommendationTheme, setRecommendationTheme] = useState<Theme | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestContext, setRequestContext] = useState<CourseRequestContext>({});
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [readyRecommendation, setReadyRecommendation] = useState<ReadyRecommendation | null>(null);
  const [savingCourse, setSavingCourse] = useState(false);
  const [courseSaved, setCourseSaved] = useState(false);
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [lastRecommendationRequest, setLastRecommendationRequest] = useState<{
    query: string;
    fields: CourseRequestContext;
  } | null>(null);
  const [recommendationRetryAvailable, setRecommendationRetryAvailable] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const scrollRef = useRef<ScrollView>(null);
  const activeRequest = useRef<AbortController | null>(null);

  useEffect(() => () => {
    activeRequest.current?.abort();
    activeRequest.current = null;
  }, []);

  const findRecommendations = async (
    query: string,
    followUpFields: CourseRequestContext = {},
  ) => {
    if (activeRequest.current) return;
    const controller = new AbortController();
    activeRequest.current = controller;
    const fields = { ...requestContext, ...followUpFields };
    const timeout = setTimeout(() => controller.abort(), 120_000);
    setLastRecommendationRequest({ query, fields });
    setRecommendationRetryAvailable(false);
    setLoading(true);
    setError(null);

    try {
      const apiBaseUrl = await getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/api/v1/courses/recommendations/jobs`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          ...(await buildRequestHeaders()),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: query,
          ...fields,
        }),
      });

      if (!response.ok) throw await recommendationResponseError(response);

      const submitted = await response.json() as { jobId: string };
      let job: CourseRecommendationJobResponse | null = null;
      const deadline = Date.now() + 120_000;
      while (Date.now() < deadline) {
        if (controller.signal.aborted) throw new RecommendationError('추천 요청이 취소되었습니다.', true);
        const statusResponse = await fetch(
          `${apiBaseUrl}/api/v1/courses/recommendations/jobs/${encodeURIComponent(submitted.jobId)}`,
          { signal: controller.signal, headers: await buildRequestHeaders() },
        );
        if (!statusResponse.ok) throw await recommendationResponseError(statusResponse);
        job = await statusResponse.json() as CourseRecommendationJobResponse;
        if (job.status === 'COMPLETED' || job.status === 'FAILED') break;
        await new Promise<void>((resolve, reject) => {
          const timer = setTimeout(resolve, 1500);
          controller.signal.addEventListener('abort', () => {
            clearTimeout(timer);
            reject(new DOMException('Aborted', 'AbortError'));
          }, { once: true });
        });
      }
      if (!job || job.status === 'PENDING' || job.status === 'RUNNING') {
        throw new RecommendationError('추천 결과를 기다리는 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.', true);
      }
      if (job.status === 'FAILED' || !job.result) {
        throw new RecommendationError(job.message || '추천 생성에 실패했습니다. 잠시 후 다시 시도해주세요.', true);
      }

      const data = job.result;
      if (activeRequest.current !== controller) return;
      const nextRequestContext = data.request ?? fields;
      setRequestContext(nextRequestContext);
      setMissingFields(data.missing_fields ?? []);
      const finalResponse = data.final_response;
      const relaxationReasons = extractRelaxationReasons(data);
      const notices = summarizeUserNotices(finalResponse?.notices, nextRequestContext);
      const recommendationReady = finalResponse?.response_status === 'READY' && !!finalResponse.days?.length;
      if (recommendationReady && finalResponse?.days) {
        setReadyRecommendation({
          title: finalResponse.title ?? '추천 여행 일정',
          summary: finalResponse.summary ?? '',
          days: finalResponse.days,
          accommodations: extractAccommodations(finalResponse),
          notices,
          relaxationReasons,
        });
        setCourseSaved(false);
      }
      setRecommendations([]);
      setRecommendationTheme(null);
      if (!recommendationReady) {
        const answer = data.final_response?.answer
          || notices.join('\n')
          || data.clarification_questions?.join('\n')
          || data.final_response?.summary
          || '추천 결과를 만들지 못했습니다. 조건을 조금 더 구체적으로 알려주세요.';
        setMessages((current) => [
          ...current,
          { id: Date.now() + 1, from: 'ai', text: answer },
        ]);
      }
    } catch (recommendationError) {
      if (activeRequest.current !== controller) return;
      setRecommendations([]);
      setRecommendationRetryAvailable(!(recommendationError instanceof RecommendationError) || recommendationError.retryable);
      setError(controller.signal.aborted
        ? '추천 응답을 기다리는 시간이 길어졌어요. 같은 조건으로 다시 시도해 주세요.'
        : recommendationError instanceof RecommendationError ? recommendationError.message
          : '서버 응답을 받지 못했습니다. 연결 상태를 확인한 뒤 다시 시도해 주세요.');
    } finally {
      clearTimeout(timeout);
      if (activeRequest.current === controller) {
        activeRequest.current = null;
        setLoading(false);
      }
    }
  };

  const saveRecommendation = async () => {
    if (!readyRecommendation || savingCourse) return;
    setSavingCourse(true);
    setError(null);
    try {
      const itineraryPlaces = readyRecommendation.days.flatMap((day) => day.visits.map((visit) => ({ day: day.day, visit })));
      const lodgingPlaces = readyRecommendation.accommodations.map((visit, index) => ({ day: getAccommodationDay(visit, index), visit }));
      const places = [...itineraryPlaces, ...lodgingPlaces].map(({ day, visit }) => {
        const placeId = extractPlaceId(visit);
        const placeType = visit.category === 'DESTINATION' ? 'ATTRACTION' : visit.category;
        return placeId && ['ATTRACTION', 'RESTAURANT', 'LODGING'].includes(placeType)
          ? {
            placeType,
            placeId,
            day,
            name: visit.name,
            visitTime: visit.time?.includes('미확인') ? null : visit.time ?? null,
            address: visit.address ?? null,
          }
          : null;
      }).filter((place): place is {
        placeType: string;
        placeId: number;
        day: number;
        name: string;
        visitTime: string | null;
        address: string | null;
      } => place !== null);

      if (!places.length) throw new Error('저장할 수 있는 장소 정보가 없습니다.');
      const apiBaseUrl = await getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/api/v1/courses`, {
        method: 'POST',
        headers: { ...(await buildRequestHeaders()), 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: readyRecommendation.title, places }),
      });
      if (!response.ok) throw new Error(`내 여행 저장 실패 (${response.status})`);
      setCourseSaved(true);
      setMessages((current) => [...current, {
        id: Date.now(), from: 'ai', text: '내 여행에 저장했어요. 하단의 내 여행 탭에서 확인할 수 있습니다.',
      }]);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : '내 여행에 저장하지 못했습니다.');
    } finally {
      setSavingCourse(false);
    }
  };

  const declineSave = () => {
    setCourseSaved(true);
    setMessages((current) => [...current, {
      id: Date.now(), from: 'ai', text: '알겠습니다. 원할 때 새로운 일정을 다시 추천받아 보세요.',
    }]);
  };

  const startNewRecommendation = () => {
    activeRequest.current?.abort();
    activeRequest.current = null;
    setLoading(false);
    setInput('');
    setError(null);
    setRequestContext({});
    setMissingFields([]);
    setReadyRecommendation(null);
    setRecommendations([]);
    setRecommendationTheme(null);
    setCourseSaved(false);
    setEditingDay(null);
    setLastRecommendationRequest(null);
    setRecommendationRetryAvailable(false);
    setMessages([{ ...INITIAL_MESSAGE, id: Date.now() }]);
  };

  const beginEdit = (day: number) => {
    setEditingDay(day);
    setInput('');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  };

  const sendMessage = (text = input) => {
    const trimmed = text.trim();
    if (!trimmed || loading || activeRequest.current) return;

    const itineraryContext = readyRecommendation
      ? readyRecommendation.days.map((day) => (
        `${day.day}일차: ${day.visits.map((visit) => visit.name).join(', ')}`
      )).join(' / ')
      : '';
    const editRequest = readyRecommendation && editingDay !== null
      ? `기존 일정은 ${itineraryContext}입니다. ${editingDay}일차 일정 수정 요청: ${trimmed}`
      : trimmed;
    const conversation = editingDay !== null
      ? editRequest
      : [
        ...messages
          .filter((message) => message.from === 'user')
          .map((message) => message.text),
        trimmed,
      ].join(' ');
    const followUpFields = inferFollowUpFields(trimmed, missingFields);

    setInput('');
    if (editingDay !== null) {
      setEditingDay(null);
    }
    setMessages((current) => [
      ...current,
      { id: Date.now(), from: 'user', text: trimmed },
    ]);
    void findRecommendations(conversation, followUpFields);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={[styles.workspace, desktop && styles.desktopWorkspace]}>
        {desktop && <ScrollView style={styles.sidebar} contentContainerStyle={styles.sidebarContent}>
          <Text style={styles.sidebarEyebrow}>나만의 강원 여행</Text>
          <Text style={styles.sidebarTitle}>어떤 여행을{`\n`}떠나고 싶으세요?</Text>
          <Text style={styles.sidebarDescription}>지역과 기간, 함께하는 사람을 알려주세요. 대화를 나누며 여행 일정을 만들어 보세요.</Text>
          <View style={styles.contextCard}>
            <Text style={styles.contextTitle}>지금까지 정한 조건</Text>
            <Text style={styles.contextValue}>지역 · {requestContext.region || '아직 정하지 않았어요'}</Text>
            <Text style={styles.contextValue}>기간 · {requestContext.travel_days ? `${requestContext.travel_days}일` : '아직 정하지 않았어요'}</Text>
            <Text style={styles.contextValue}>반려동물 · {requestContext.pet_allowed == null ? '선택 전' : requestContext.pet_allowed ? '함께 여행' : '동반하지 않음'}</Text>
          </View>
          <Text style={styles.sidebarDescription}>완성된 일정을 내 여행에 저장하고, 하루씩 수정할 수 있어요.</Text>
          <Pressable accessibilityRole="button" style={styles.sidebarReset} onPress={startNewRecommendation} disabled={savingCourse}>
            <Ionicons name="add-outline" size={18} color={COLORS.primary} />
            <Text style={styles.newTripText}>새 대화 시작</Text>
          </Pressable>
        </ScrollView>}
      <KeyboardAvoidingView
        style={[styles.container, desktop && styles.desktopChat]}
        behavior={Platform.OS === 'web' ? undefined : Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="sparkles" size={21} color={COLORS.white} />
          </View>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>AI 여행 추천</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, error && { backgroundColor: '#D97706' }]} />
              <Text style={styles.statusText}>{loading ? '추천을 만들고 있어요' : error ? '요청을 완료하지 못했어요' : '원하는 조건으로 일정 만들기'}</Text>
            </View>
          </View>
          <Pressable style={styles.moreButton} hitSlop={10} accessibilityRole="button" accessibilityLabel="새 대화 시작" onPress={startNewRecommendation} disabled={savingCourse}>
            <Ionicons name="refresh-outline" size={22} color={COLORS.subText} />
          </Pressable>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.chat}
          contentContainerStyle={[styles.chatContent, desktop && styles.desktopChatContent]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}
        >
          {messages.map((message) => (
            <View key={message.id} style={[styles.messageRow, message.from === 'user' && styles.userRow]}>
              {message.from === 'ai' && (
                <View style={styles.botAvatar}>
                  <Ionicons name="sparkles" size={15} color={COLORS.primary} />
                </View>
              )}
              <View style={[styles.bubble, message.from === 'user' ? styles.userBubble : styles.aiBubble]}>
                <Text style={[styles.messageText, message.from === 'user' && styles.userMessageText]}>
                  {message.text}
                </Text>
              </View>
            </View>
          ))}

          {messages.length === 1 && (
            <View style={styles.quickSection}>
              <Text style={styles.quickLabel}>이렇게 물어보세요</Text>
              <View style={styles.quickList}>
                {QUICK_QUESTIONS.map((question) => (
                  <Pressable key={question} style={styles.quickChip} onPress={() => sendMessage(question)}>
                    <Text style={styles.quickText}>{question}</Text>
                    <Ionicons name="arrow-up" size={14} color={COLORS.primary} />
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {loading && (
            <View style={styles.loadingRow}>
              <View style={styles.botAvatar}><Ionicons name="sparkles" size={15} color={COLORS.primary} /></View>
              <View style={styles.loadingBubble}><Text style={styles.loadingText}>여행지를 찾고 있어요...</Text></View>
            </View>
          )}

          {error && (
            <View style={styles.errorBox} accessibilityRole="alert">
              <Ionicons name="alert-circle-outline" size={18} color="#D97706" />
              <View style={styles.errorContent}>
                <Text style={styles.errorText}>{error}</Text>
                {recommendationRetryAvailable && !!lastRecommendationRequest && (
                  <Pressable
                    style={styles.retryButton}
                    onPress={() => void findRecommendations(
                      lastRecommendationRequest.query,
                      lastRecommendationRequest.fields,
                    )}
                    disabled={loading}
                  >
                    <Ionicons name="refresh" size={14} color={COLORS.white} />
                    <Text style={styles.retryText}>{loading ? '다시 요청 중...' : '다시 시도'}</Text>
                  </Pressable>
                )}
              </View>
            </View>
          )}

          {readyRecommendation && (
            <View style={styles.itineraryCard}>
              <Text style={styles.itineraryTitle}>{readyRecommendation.title}</Text>
              {!!readyRecommendation.summary && <Text style={styles.itinerarySummary}>{readyRecommendation.summary}</Text>}
              {readyRecommendation.notices.length > 0 && (
                <View style={styles.noticeBox}>
                  <Text style={styles.noticeTitle}>방문 전 확인</Text>
                  {readyRecommendation.notices.map((notice, index) => (
                    <Text key={`${notice}-${index}`} style={styles.noticeText}>{notice}</Text>
                  ))}
                </View>
              )}
              {readyRecommendation.relaxationReasons.length > 0 && (
                <View style={styles.processBox}>
                  <Text style={styles.processTitle}>검색 조건 조정 안내</Text>
                  {readyRecommendation.relaxationReasons.map((message, index) => (
                    <Text key={`${message}-${index}`} style={styles.processText}>· {message}</Text>
                  ))}
                </View>
              )}
              {readyRecommendation.days.map((day) => (
                <View key={day.day} style={styles.daySection}>
                  <View style={styles.dayHeader}>
                    <Text style={styles.dayTitle}>{day.day}일차</Text>
                    <Pressable style={styles.editDayButton} onPress={() => beginEdit(day.day)}>
                      <Ionicons name="create-outline" size={14} color={COLORS.primary} />
                      <Text style={styles.editDayText}>수정</Text>
                    </Pressable>
                  </View>
                  {day.visits.map((visit, index) => (
                    <View key={`${day.day}-${getVisitKey(visit, String(index))}`} style={styles.visitRow}>
                      <View style={styles.visitDot} />
                      <View style={styles.visitCopy}>
                        {!!visit.time && !visit.time.includes('미확인') && <Text style={styles.visitTime}>{visit.time}</Text>}
                        <Text style={styles.visitName}>{visit.name}</Text>
                        {!!visit.address && <Text style={styles.visitAddress}>{visit.address}</Text>}
                      </View>
                    </View>
                  ))}
                </View>
              ))}
              {readyRecommendation.accommodations.length > 0 && (
                <View style={styles.lodgingSection}>
                  <Text style={styles.dayTitle}>추천 숙소</Text>
                  {readyRecommendation.accommodations.map((lodging, index) => (
                    <View key={getVisitKey(lodging, String(index))} style={styles.visitRow}>
                      <View style={styles.visitDot} />
                      <View style={styles.visitCopy}>
                        {shouldShowAccommodationNight(readyRecommendation.accommodations) && (
                          <Text style={styles.visitTime}>{getAccommodationNightLabel(lodging, index)}</Text>
                        )}
                        <Text style={styles.visitName}>{lodging.name}</Text>
                        {!!lodging.address && <Text style={styles.visitAddress}>{lodging.address}</Text>}
                        {!!lodging.operating_hours && <Text style={styles.visitAddress}>{lodging.operating_hours}</Text>}
                        {!!lodging.recommendation_reason && <Text style={styles.visitReason}>{lodging.recommendation_reason}</Text>}
                      </View>
                    </View>
                  ))}
                </View>
              )}
              {!courseSaved && (
                <View style={styles.saveBox}>
                  <Text style={styles.saveQuestion}>이 일정을 내 여행에 추가하시겠습니까?</Text>
                  <View style={styles.saveActions}>
                    <Pressable style={styles.declineButton} onPress={declineSave} disabled={savingCourse}>
                      <Text style={styles.declineText}>아니요</Text>
                    </Pressable>
                    <Pressable style={styles.saveButton} onPress={() => void saveRecommendation()} disabled={savingCourse}>
                      <Text style={styles.saveButtonText}>{savingCourse ? '저장 중...' : '추가하기'}</Text>
                    </Pressable>
                  </View>
                </View>
              )}
              <Pressable style={styles.newTripButton} onPress={startNewRecommendation}>
                <Ionicons name="add-circle-outline" size={17} color={COLORS.primary} />
                <Text style={styles.newTripText}>새 일정 만들기</Text>
              </Pressable>
            </View>
          )}

          {editingDay !== null && (
            <View style={styles.editGuide}>
              <Text style={styles.editGuideTitle}>{editingDay}일차를 어떻게 바꿀까요?</Text>
              <Text style={styles.editGuideText}>예: 해수욕장 대신 실내 관광지를 넣어줘</Text>
              <Pressable onPress={() => setEditingDay(null)} hitSlop={8}>
                <Text style={styles.editCancelText}>취소</Text>
              </Pressable>
            </View>
          )}

          {messages.length > 1 && recommendations.length > 0 && (
            <View style={styles.resultSection}>
              <View style={styles.resultHeader}>
                <Text style={styles.resultTitle}>추천 여행지</Text>
                <Text style={styles.resultCount}>{recommendationTheme?.name ?? '여행 테마'}</Text>
              </View>
              {recommendations.map((place) => (
                <Pressable
                  key={place.id}
                  style={styles.placeCard}
                  onPress={() => navigation.navigate('DestinationDetail', { destinationId: place.id, title: place.title, firstImage: place.firstImage })}
                >
                  <View style={styles.placeVisual}><Ionicons name="location" size={25} color={COLORS.primary} /></View>
                  <View style={styles.placeCopy}>
                    <Text style={styles.placeTitle} numberOfLines={1}>{place.title}</Text>
                    <Text style={styles.placeLocation}>{recommendationTheme?.name ?? '강원 여행지'}</Text>
                    <Text style={styles.placeDescription}>상세 정보와 접근성 정보를 확인해 보세요.</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={COLORS.muted} />
                </Pressable>
              ))}
            </View>
          )}

        </ScrollView>

        {(!readyRecommendation || editingDay !== null) && <View style={styles.composerWrap}>
          <View style={styles.composer}>
            <TextInput
              value={input}
              onChangeText={setInput}
              onSubmitEditing={() => sendMessage()}
              placeholder={editingDay !== null ? `${editingDay}일차 수정 내용을 입력해 주세요` : '여행 스타일을 입력해 주세요'}
              placeholderTextColor={COLORS.muted}
              style={styles.input}
              returnKeyType="send"
              multiline
              maxLength={120}
              accessibilityLabel="여행 조건 입력"
            />
            <Pressable
              style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]}
              onPress={() => sendMessage()}
              disabled={!input.trim() || loading}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel="추천 요청 보내기"
            >
              <Ionicons name="arrow-up" size={19} color={COLORS.white} />
            </Pressable>
          </View>
          <Text style={styles.helperText}>AI 추천은 참고용으로 제공됩니다.</Text>
        </View>}
      </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  workspace: { flex: 1, minHeight: 0 },
  desktopWorkspace: { flexDirection: 'row', padding: 28, gap: 28 },
  sidebar: { width: 260, flexGrow: 0, flexShrink: 0 },
  sidebarContent: { paddingTop: 20, gap: 22, paddingBottom: 24 },
  sidebarEyebrow: { fontSize: 13, fontWeight: '800', color: COLORS.primary },
  sidebarTitle: { fontSize: 29, lineHeight: 40, fontWeight: '800', color: COLORS.text },
  sidebarDescription: { fontSize: 14, lineHeight: 23, color: COLORS.subText },
  contextCard: { backgroundColor: COLORS.white, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, gap: 14 },
  contextTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  contextValue: { fontSize: 13, lineHeight: 21, color: COLORS.subText },
  sidebarReset: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 14 },
  container: { flex: 1, minHeight: 0, minWidth: 0 },
  desktopChat: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 20, overflow: 'hidden' },
  desktopChatContent: { padding: 28 },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15,
    backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  headerIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  headerCopy: { flex: 1, marginLeft: 11 },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#24B47E', marginRight: 5 },
  statusText: { fontSize: 12, color: COLORS.subText },
  moreButton: { padding: 4 },
  chat: { flex: 1, minHeight: 0 },
  chatContent: { paddingHorizontal: 20, paddingTop: 22, paddingBottom: 12 },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 16 },
  userRow: { justifyContent: 'flex-end' },
  botAvatar: { width: 28, height: 28, borderRadius: 10, backgroundColor: COLORS.mint, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  bubble: { maxWidth: '82%', paddingHorizontal: 15, paddingVertical: 12, borderRadius: 18 },
  aiBubble: { backgroundColor: COLORS.white, borderTopLeftRadius: 5 },
  userBubble: { backgroundColor: COLORS.primary, borderTopRightRadius: 5 },
  messageText: { fontSize: 14, lineHeight: 21, color: COLORS.text },
  userMessageText: { color: COLORS.white },
  quickSection: { marginTop: 4 },
  quickLabel: { color: COLORS.subText, fontSize: 12, marginLeft: 36, marginBottom: 10 },
  quickList: { paddingLeft: 36, paddingRight: 10, gap: 8, flexDirection: 'row', flexWrap: 'wrap' },
  quickChip: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 10 },
  quickText: { color: COLORS.text, fontSize: 13 },
  resultSection: { marginLeft: 36, marginTop: 2 },
  resultHeader: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 11 },
  resultTitle: { color: COLORS.text, fontSize: 16, fontWeight: '700' },
  resultCount: { color: COLORS.primary, fontSize: 12, marginLeft: 7 },
  placeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 16, padding: 10, marginBottom: 10, borderWidth: 1, borderColor: '#EEF0F2' },
  placeVisual: { width: 54, height: 54, borderRadius: 12, backgroundColor: COLORS.mint, alignItems: 'center', justifyContent: 'center' },
  placeCopy: { flex: 1, marginHorizontal: 11 },
  placeTitle: { color: COLORS.text, fontSize: 14, fontWeight: '700', marginBottom: 3 },
  placeLocation: { color: COLORS.primary, fontSize: 11, marginBottom: 4 },
  placeDescription: { color: COLORS.subText, fontSize: 11 },
  loadingRow: { flexDirection: 'row', alignItems: 'flex-end', marginLeft: 36, marginBottom: 16 },
  loadingBubble: { backgroundColor: COLORS.white, borderRadius: 18, borderTopLeftRadius: 5, paddingHorizontal: 15, paddingVertical: 12 },
  loadingText: { fontSize: 13, color: COLORS.subText },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#FFFBEB', borderRadius: 12, padding: 12, marginLeft: 36, marginBottom: 14 },
  errorContent: { flex: 1, alignItems: 'flex-start' },
  errorText: { color: '#92400E', fontSize: 12, lineHeight: 18 },
  retryButton: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 9, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 9, backgroundColor: COLORS.primary },
  retryText: { color: COLORS.white, fontSize: 11, fontWeight: '800' },
  itineraryCard: { marginLeft: 36, marginBottom: 18, padding: 16, borderRadius: 18, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border },
  itineraryTitle: { color: COLORS.text, fontSize: 18, fontWeight: '800' },
  itinerarySummary: { color: COLORS.subText, fontSize: 13, lineHeight: 19, marginTop: 5, marginBottom: 8 },
  noticeBox: { marginTop: 10, padding: 12, borderRadius: 12, backgroundColor: '#FFFBEB', gap: 5 },
  noticeTitle: { color: '#92400E', fontSize: 13, fontWeight: '800' },
  noticeText: { color: '#92400E', fontSize: 12, lineHeight: 18 },
  processBox: { marginTop: 10, padding: 12, borderRadius: 12, backgroundColor: COLORS.mint, gap: 5 },
  processTitle: { color: COLORS.primaryDark, fontSize: 13, fontWeight: '800' },
  processText: { color: COLORS.subText, fontSize: 12, lineHeight: 18 },
  daySection: { marginTop: 14, paddingTop: 13, borderTopWidth: 1, borderTopColor: '#EEF0F2' },
  lodgingSection: { marginTop: 14, paddingTop: 13, borderTopWidth: 1, borderTopColor: '#EEF0F2' },
  dayHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 },
  dayTitle: { color: COLORS.primaryDark, fontSize: 15, fontWeight: '800' },
  editDayButton: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 9, backgroundColor: COLORS.mint },
  editDayText: { color: COLORS.primary, fontSize: 11, fontWeight: '700' },
  visitRow: { flexDirection: 'row', marginBottom: 12 },
  visitDot: { width: 9, height: 9, borderRadius: 5, marginTop: 6, marginRight: 10, backgroundColor: COLORS.primary },
  visitCopy: { flex: 1 },
  visitTime: { color: COLORS.primary, fontSize: 11, fontWeight: '700' },
  visitName: { color: COLORS.text, fontSize: 14, fontWeight: '700', marginTop: 2 },
  visitAddress: { color: COLORS.subText, fontSize: 11, lineHeight: 16, marginTop: 2 },
  visitReason: { color: COLORS.subText, fontSize: 12, lineHeight: 18, marginTop: 5 },
  saveBox: { marginTop: 8, paddingTop: 15, borderTopWidth: 1, borderTopColor: COLORS.border },
  saveQuestion: { color: COLORS.text, fontSize: 14, fontWeight: '700', textAlign: 'center', marginBottom: 12 },
  saveActions: { flexDirection: 'row', gap: 9 },
  declineButton: { flex: 1, alignItems: 'center', paddingVertical: 11, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  declineText: { color: COLORS.subText, fontSize: 13, fontWeight: '700' },
  saveButton: { flex: 1, alignItems: 'center', paddingVertical: 11, borderRadius: 12, backgroundColor: COLORS.primary },
  saveButtonText: { color: COLORS.white, fontSize: 13, fontWeight: '800' },
  newTripButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 12, paddingVertical: 10 },
  newTripText: { color: COLORS.primary, fontSize: 13, fontWeight: '700' },
  editGuide: { marginLeft: 36, marginBottom: 14, padding: 13, borderRadius: 14, backgroundColor: COLORS.mint },
  editGuideTitle: { color: COLORS.primaryDark, fontSize: 13, fontWeight: '800' },
  editGuideText: { color: COLORS.subText, fontSize: 11, marginTop: 4 },
  editCancelText: { color: COLORS.primary, fontSize: 11, fontWeight: '700', marginTop: 8 },
  composerWrap: { backgroundColor: COLORS.white, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 8, borderTopWidth: 1, borderTopColor: COLORS.border },
  composer: { flexDirection: 'row', alignItems: 'center', minHeight: 48, maxHeight: 90, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, paddingLeft: 15, paddingRight: 8, backgroundColor: COLORS.background },
  input: { flex: 1, color: COLORS.text, fontSize: 14, paddingTop: 8, paddingBottom: 8, maxHeight: 72 },
  sendButton: { width: 34, height: 34, borderRadius: 12, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  sendButtonDisabled: { backgroundColor: '#C9D4D6' },
  helperText: { textAlign: 'center', color: COLORS.muted, fontSize: 10, marginTop: 7 },
});
