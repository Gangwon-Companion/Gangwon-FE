import React, { useRef, useState } from 'react';
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
  final_response?: {
    response_status?: string;
    answer?: string;
    summary?: string;
    title?: string;
    days?: RecommendationDay[];
  } | null;
};

type RecommendationVisit = {
  time: string;
  place_id: string;
  name: string;
  category: 'DESTINATION' | 'RESTAURANT' | 'LODGING' | string;
  address?: string | null;
  recommendation_reason?: string;
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
};

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

  const findRecommendations = async (
    query: string,
    followUpFields: CourseRequestContext = {},
  ) => {
    setLastRecommendationRequest({ query, fields: followUpFields });
    setRecommendationRetryAvailable(false);
    setLoading(true);
    setError(null);

    try {
      const apiBaseUrl = await getApiBaseUrl();
      const response = await fetch(`${apiBaseUrl}/api/v1/courses/recommendations`, {
        method: 'POST',
        headers: {
          ...(await buildRequestHeaders()),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: query,
          ...requestContext,
          ...followUpFields,
        }),
      });

      if (!response.ok) {
        let detail = '';
        try {
          const body = await response.json() as { message?: string };
          detail = body.message ? `: ${body.message}` : '';
        } catch {
          // 응답 본문이 JSON이 아니면 상태 코드만 표시합니다.
        }
        throw new Error(`AI 추천 요청 실패 (${response.status})${detail}`);
      }

      const data = await response.json() as CourseRecommendationResponse;
      setRequestContext(data.request ?? requestContext);
      setMissingFields(data.missing_fields ?? []);
      const finalResponse = data.final_response;
      const recommendationReady = finalResponse?.response_status === 'READY' && !!finalResponse.days?.length;
      if (recommendationReady && finalResponse?.days) {
        setReadyRecommendation({
          title: finalResponse.title ?? '추천 여행 일정',
          summary: '',
          days: finalResponse.days,
        });
        setCourseSaved(false);
      }
      setRecommendations([]);
      setRecommendationTheme(null);
      if (!recommendationReady) {
        const answer = data.final_response?.answer
          || data.clarification_questions?.join('\n')
          || data.messages?.join('\n')
          || data.final_response?.summary
          || '추천 결과를 만들지 못했습니다. 조건을 조금 더 구체적으로 알려주세요.';
        setMessages((current) => [
          ...current,
          { id: Date.now() + 1, from: 'ai', text: answer },
        ]);
      }
    } catch (recommendationError) {
      setRecommendations([]);
      setRecommendationRetryAvailable(true);
      setError(recommendationError instanceof Error ? recommendationError.message : '추천 여행지를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const saveRecommendation = async () => {
    if (!readyRecommendation || savingCourse) return;
    setSavingCourse(true);
    setError(null);
    try {
      const places = readyRecommendation.days.flatMap((day) => day.visits.map((visit) => ({ day: day.day, visit }))).map(({ day, visit }) => {
        const matched = visit.place_id.match(/(\d+)$/);
        const placeType = visit.category === 'DESTINATION' ? 'ATTRACTION' : visit.category;
        return matched && ['ATTRACTION', 'RESTAURANT', 'LODGING'].includes(placeType)
          ? {
            placeType,
            placeId: Number(matched[1]),
            day,
            name: visit.name,
            visitTime: visit.time.includes('미확인') ? null : visit.time,
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
    if (!trimmed || loading) return;

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
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="sparkles" size={21} color={COLORS.white} />
          </View>
          <View style={styles.headerCopy}>
            <Text style={styles.title}>AI 여행 추천</Text>
            <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>지금 바로 추천받기</Text>
            </View>
          </View>
          <Pressable style={styles.moreButton} hitSlop={10}>
            <Ionicons name="ellipsis-horizontal" size={22} color={COLORS.subText} />
          </Pressable>
        </View>

        <ScrollView
          ref={scrollRef}
          style={styles.chat}
          contentContainerStyle={styles.chatContent}
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
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickList}>
                {QUICK_QUESTIONS.map((question) => (
                  <Pressable key={question} style={styles.quickChip} onPress={() => sendMessage(question)}>
                    <Text style={styles.quickText}>{question}</Text>
                    <Ionicons name="arrow-up" size={14} color={COLORS.primary} />
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {loading && (
            <View style={styles.loadingRow}>
              <View style={styles.botAvatar}><Ionicons name="sparkles" size={15} color={COLORS.primary} /></View>
              <View style={styles.loadingBubble}><Text style={styles.loadingText}>여행지를 찾고 있어요...</Text></View>
            </View>
          )}

          {error && (
            <View style={styles.errorBox}>
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
                    <View key={`${day.day}-${visit.place_id}-${index}`} style={styles.visitRow}>
                      <View style={styles.visitDot} />
                      <View style={styles.visitCopy}>
                        {!visit.time.includes('미확인') && <Text style={styles.visitTime}>{visit.time}</Text>}
                        <Text style={styles.visitName}>{visit.name}</Text>
                        {!!visit.address && <Text style={styles.visitAddress}>{visit.address}</Text>}
                      </View>
                    </View>
                  ))}
                </View>
              ))}
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
            />
            <Pressable
              style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]}
              onPress={() => sendMessage()}
              disabled={!input.trim() || loading}
              hitSlop={6}
            >
              <Ionicons name="arrow-up" size={19} color={COLORS.white} />
            </Pressable>
          </View>
          <Text style={styles.helperText}>AI 추천은 참고용으로 제공됩니다.</Text>
        </View>}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1 },
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
  chat: { flex: 1 },
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
  quickList: { paddingLeft: 36, paddingRight: 10, gap: 8 },
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
  daySection: { marginTop: 14, paddingTop: 13, borderTopWidth: 1, borderTopColor: '#EEF0F2' },
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
