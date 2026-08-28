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
import { DestinationListItem, fetchThemeDestinations, fetchThemes, Theme } from '../home/api';

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

const QUICK_QUESTIONS = ['바다 보러 가고 싶어요', '아이와 함께 여행', '조용한 힐링 여행'];

export default function AIRecommendScreen() {
  const navigation = useNavigation<any>();
  const [input, setInput] = useState('');
  const [recommendations, setRecommendations] = useState<DestinationListItem[]>([]);
  const [recommendationTheme, setRecommendationTheme] = useState<Theme | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      from: 'ai',
      text: '안녕하세요! 강원 여행을 함께 찾아볼까요?\n원하는 여행 스타일이나 기간을 알려주세요 😊',
    },
  ]);
  const scrollRef = useRef<ScrollView>(null);

  const findRecommendations = async (query: string) => {
    setLoading(true);
    setError(null);

    try {
      const themes = await fetchThemes();
      if (!themes.length) throw new Error('추천할 여행 테마가 없습니다.');

      const keywords = query.toLowerCase().split(/\s+/).filter(Boolean);
      const matchedTheme = [...themes].sort((a, b) => {
        const aScore = keywords.filter((word) => `${a.name} ${a.code}`.toLowerCase().includes(word)).length;
        const bScore = keywords.filter((word) => `${b.name} ${b.code}`.toLowerCase().includes(word)).length;
        return bScore - aScore;
      })[0];

      const response = await fetchThemeDestinations(matchedTheme.id);
      setRecommendationTheme(matchedTheme);
      setRecommendations(response.destinationList.slice(0, 3));
    } catch (recommendationError) {
      setRecommendations([]);
      setError(recommendationError instanceof Error ? recommendationError.message : '추천 여행지를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = (text = input) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setInput('');
    setMessages((current) => [
      ...current,
      { id: Date.now(), from: 'user', text: trimmed },
    ]);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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
              <Text style={styles.errorText}>{error}</Text>
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

        <View style={styles.composerWrap}>
          <View style={styles.composer}>
            <TextInput
              value={input}
              onChangeText={setInput}
              onSubmitEditing={() => sendMessage()}
              placeholder="여행 스타일을 입력해 주세요"
              placeholderTextColor={COLORS.muted}
              style={styles.input}
              returnKeyType="send"
              multiline
              maxLength={120}
            />
            <Pressable
              style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]}
              onPress={() => sendMessage()}
              disabled={!input.trim()}
              hitSlop={6}
            >
              <Ionicons name="arrow-up" size={19} color={COLORS.white} />
            </Pressable>
          </View>
          <Text style={styles.helperText}>AI 추천은 참고용으로 제공됩니다.</Text>
        </View>
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
  errorText: { flex: 1, color: '#92400E', fontSize: 12, lineHeight: 18 },
  composerWrap: { backgroundColor: COLORS.white, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 8, borderTopWidth: 1, borderTopColor: COLORS.border },
  composer: { flexDirection: 'row', alignItems: 'center', minHeight: 48, maxHeight: 90, borderWidth: 1, borderColor: COLORS.border, borderRadius: 16, paddingLeft: 15, paddingRight: 8, backgroundColor: COLORS.background },
  input: { flex: 1, color: COLORS.text, fontSize: 14, paddingTop: 8, paddingBottom: 8, maxHeight: 72 },
  sendButton: { width: 34, height: 34, borderRadius: 12, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  sendButtonDisabled: { backgroundColor: '#C9D4D6' },
  helperText: { textAlign: 'center', color: COLORS.muted, fontSize: 10, marginTop: 7 },
});
