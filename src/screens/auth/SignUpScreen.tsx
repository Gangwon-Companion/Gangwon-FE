import { useState } from 'react';
import { CommonActions } from '@react-navigation/native';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ArrowLeft, Eye, EyeOff, Image } from 'lucide-react-native';
import { colors } from '../../constants/colors';
import { RootStackParamList } from '../../navigation/types';
import { ApiError, parseApiError, saveAccessToken } from '../../api/auth';
import { getApiBaseUrl, requestHeaders } from '../home/api';

type Props = NativeStackScreenProps<RootStackParamList, 'SignUp'>;
const REQUEST_TIMEOUT_MS = 8000;
type CheckStatus = 'idle' | 'checking' | 'available' | 'taken';

function describeSignUpError(error: unknown) {
  if (error instanceof ApiError && error.errors.length > 0) {
    return error.errors.map((item) => item.message).join('\n');
  }
  return error instanceof Error ? error.message : '회원가입 중 오류가 발생했습니다.';
}

export default function SignUpScreen({ navigation }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<CheckStatus>('idle');

  const checkUsernameAvailability = async () => {
    const trimmed = username.trim();
    if (!trimmed) {
      Alert.alert('입력 확인', '아이디를 입력해 주세요.');
      return;
    }

    setUsernameStatus('checking');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const apiBaseUrl = await getApiBaseUrl(undefined, { skipProbe: true });
      const response = await fetch(
        `${apiBaseUrl}/api/v1/auth/check/username/${encodeURIComponent(trimmed)}`,
        { headers: { ...requestHeaders, Accept: 'application/json' }, signal: controller.signal },
      );

      if (!response.ok) throw await parseApiError(response);
      const data: { available?: unknown } = await response.json();
      setUsernameStatus(data.available ? 'available' : 'taken');
    } catch (error) {
      setUsernameStatus('idle');
      Alert.alert('중복 확인 실패', error instanceof Error ? error.message : '중복 확인 중 오류가 발생했습니다.');
    } finally {
      clearTimeout(timeout);
    }
  };

  const submitSignUp = async () => {
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim();
    const trimmedNickname = nickname.trim();

    if (!trimmedUsername || !password || !trimmedEmail || !trimmedNickname) {
      Alert.alert('입력 확인', '모든 항목을 입력해 주세요.');
      return;
    }
    if (usernameStatus !== 'available') {
      Alert.alert('입력 확인', '아이디 중복확인을 먼저 완료해 주세요.');
      return;
    }

    setSubmitting(true);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const apiBaseUrl = await getApiBaseUrl(undefined, { skipProbe: true });
      const signUpResponse = await fetch(`${apiBaseUrl}/api/v1/auth/signup`, {
        method: 'POST',
        headers: { ...requestHeaders, Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: trimmedUsername,
          password,
          email: trimmedEmail,
          nickname: trimmedNickname,
        }),
        signal: controller.signal,
      });
      if (!signUpResponse.ok) throw await parseApiError(signUpResponse);

      const loginResponse = await fetch(`${apiBaseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { ...requestHeaders, Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: trimmedUsername, password }),
        signal: controller.signal,
      });
      if (!loginResponse.ok) throw await parseApiError(loginResponse);

      const loginData: { token?: unknown } = await loginResponse.json();
      if (typeof loginData.token !== 'string' || !loginData.token) {
        throw new Error('로그인 응답에 토큰이 없습니다.');
      }

      await saveAccessToken(loginData.token);
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        }),
      );
    } catch (error) {
      Alert.alert('회원가입 실패', describeSignUpError(error));
    } finally {
      clearTimeout(timeout);
      setSubmitting(false);
    }
  };

  const usernameButtonLabel =
    usernameStatus === 'checking' ? '확인 중' :
    usernameStatus === 'available' ? '사용 가능' :
    usernameStatus === 'taken' ? '중복됨' : '중복확인';

  return (
    <View style={styles.pageWrap}>
      <View style={styles.container}>
        <Pressable style={styles.backButton} onPress={() => navigation.navigate('Login')}>
          <ArrowLeft size={24} color={colors.gray500} />
        </Pressable>

        <Text style={styles.title}>회원가입</Text>
        <Text style={styles.subtitle}>Travelin과 함께 여행을 시작하세요</Text>

        <View style={styles.form}>
          <View>
            <Text style={styles.label}>아이디</Text>
            <View style={styles.inlineRow}>
              <TextInput
                style={[styles.input, styles.flexInput]}
                placeholder="아이디를 입력하세요"
                placeholderTextColor={colors.gray400}
                autoCapitalize="none"
                autoCorrect={false}
                value={username}
                onChangeText={(value) => {
                  setUsername(value);
                  setUsernameStatus('idle');
                }}
                editable={!submitting}
              />
              <Pressable
                style={styles.subButton}
                onPress={() => void checkUsernameAvailability()}
                disabled={submitting || usernameStatus === 'checking'}
              >
                {usernameStatus === 'checking'
                  ? <ActivityIndicator color={colors.primary} size="small" />
                  : <Text style={styles.subButtonText}>{usernameButtonLabel}</Text>}
              </Pressable>
            </View>
          </View>

          <View>
            <Text style={styles.label}>비밀번호</Text>
            <View style={styles.passwordBox}>
              <TextInput
                style={styles.passwordInput}
                placeholder="비밀번호를 입력하세요"
                placeholderTextColor={colors.gray400}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                editable={!submitting}
              />
              <Pressable onPress={() => setShowPassword((prev) => !prev)}>
                {showPassword ? (
                  <EyeOff size={20} color={colors.gray400} />
                ) : (
                  <Eye size={20} color={colors.gray400} />
                )}
              </Pressable>
            </View>
            <Text style={styles.helpText}>8자 이상, 영문과 숫자를 포함해주세요</Text>
          </View>

          <View>
            <Text style={styles.label}>이메일</Text>
            <TextInput
              style={styles.input}
              placeholder="your@email.com"
              placeholderTextColor={colors.gray400}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              editable={!submitting}
            />
          </View>

          <View>
            <Text style={styles.label}>닉네임</Text>
            <TextInput
              style={styles.input}
              placeholder="닉네임을 입력하세요"
              placeholderTextColor={colors.gray400}
              value={nickname}
              onChangeText={setNickname}
              editable={!submitting}
            />
          </View>
        </View>

        <View style={styles.permissionCard}>
          <View style={styles.permissionIconBox}>
            <Image size={20} color={colors.primary} />
          </View>
          <View style={styles.permissionTextBox}>
            <Text style={styles.permissionTitle}>갤러리 접근 권한</Text>
            <Text style={styles.permissionDescription}>프로필 사진 업로드를 위한 권한이 필요합니다</Text>
          </View>
          <Pressable>
            <Text style={styles.permissionAction}>허용</Text>
          </Pressable>
        </View>

        <Pressable
          style={({ pressed }) => [styles.primaryButton, (pressed || submitting) && styles.buttonPressed]}
          onPress={() => void submitSignUp()}
          disabled={submitting}
        >
          {submitting
            ? <ActivityIndicator color={colors.white} />
            : <Text style={styles.primaryButtonText}>회원가입</Text>}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pageWrap: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 390,
    paddingHorizontal: 24,
    paddingTop: 48,
    backgroundColor: colors.background,
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
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    color: colors.gray500,
    fontSize: 15,
    marginBottom: 32,
  },
  form: {
    gap: 16,
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    color: colors.gray500,
    marginBottom: 8,
  },
  inlineRow: {
    flexDirection: 'row',
    gap: 8,
  },
  flexInput: {
    flex: 1,
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
  helpText: {
    marginTop: 8,
    color: colors.gray400,
    fontSize: 12,
  },
  subButton: {
    height: 52,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subButtonText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  permissionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.gray200,
    padding: 16,
    marginBottom: 24,
  },
  permissionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionTextBox: {
    flex: 1,
  },
  permissionTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  permissionDescription: {
    color: colors.gray500,
    fontSize: 12,
    lineHeight: 17,
  },
  permissionAction: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  primaryButton: {
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
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
