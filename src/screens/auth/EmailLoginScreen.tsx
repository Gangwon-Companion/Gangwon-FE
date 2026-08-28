import { useState } from 'react';
import { CommonActions } from '@react-navigation/native';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react-native';
import { colors } from '../../constants/colors';
import { RootStackParamList } from '../../navigation/types';
import { parseApiError, saveAccessToken } from '../../api/auth';
import { getApiBaseUrl, requestHeaders } from '../home/api';

type Props = NativeStackScreenProps<RootStackParamList, 'EmailLogin'>;
const LOGIN_TIMEOUT_MS = 8000;

export default function EmailLoginScreen({ navigation }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submitLogin = async () => {
    const trimmedUsername = username.trim();
    if (!trimmedUsername || !password) {
      Alert.alert('입력 확인', '아이디와 비밀번호를 입력해 주세요.');
      return;
    }

    setSubmitting(true);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), LOGIN_TIMEOUT_MS);

    try {
      const apiBaseUrl = await getApiBaseUrl(undefined, { skipProbe: true });
      const response = await fetch(`${apiBaseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          ...requestHeaders,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: trimmedUsername, password }),
        signal: controller.signal,
      });

      if (!response.ok) throw await parseApiError(response);
      const data: { token?: unknown } = await response.json();
      if (typeof data.token !== 'string' || !data.token) {
        throw new Error('로그인 응답에 토큰이 없습니다.');
      }

      await saveAccessToken(data.token);
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        }),
      );
    } catch (error) {
      Alert.alert(
        '로그인 실패',
        error instanceof Error ? error.message : '로그인 중 오류가 발생했습니다.',
      );
    } finally {
      clearTimeout(timeout);
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.pageWrap}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="뒤로 가기"
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={24} color={colors.gray500} />
          </Pressable>

          <Text style={styles.title}>아이디로 로그인</Text>

          <View style={styles.form}>
            <View>
              <Text style={styles.label}>아이디</Text>
              <TextInput
                accessibilityLabel="아이디"
                style={styles.input}
                placeholder="아이디를 입력하세요"
                placeholderTextColor={colors.gray400}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="username"
                editable={!submitting}
              />
            </View>

            <View>
              <Text style={styles.label}>비밀번호</Text>
              <View style={styles.passwordBox}>
                <TextInput
                  accessibilityLabel="비밀번호"
                  style={styles.passwordInput}
                  placeholder="비밀번호를 입력하세요"
                  placeholderTextColor={colors.gray400}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  textContentType="password"
                  editable={!submitting}
                  onSubmitEditing={() => void submitLogin()}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                  hitSlop={10}
                  onPress={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? (
                    <EyeOff size={20} color={colors.gray400} />
                  ) : (
                    <Eye size={20} color={colors.gray400} />
                  )}
                </Pressable>
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [styles.primaryButton, (pressed || submitting) && styles.buttonPressed]}
              onPress={() => void submitLogin()}
              disabled={submitting}
            >
              {submitting
                ? <ActivityIndicator color={colors.white} />
                : <Text style={styles.primaryButtonText}>로그인</Text>}
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  pageWrap: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
  },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 390,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 32,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
    marginBottom: 32,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 32,
  },
  form: {
    gap: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray500,
    marginBottom: 8,
  },
  input: {
    height: 52,
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.gray200,
    paddingHorizontal: 16,
    color: colors.text,
    fontSize: 15,
  },
  passwordBox: {
    height: 52,
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.gray200,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
  },
  primaryButton: {
    height: 54,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.82,
  },
});
