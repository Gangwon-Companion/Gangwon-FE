import { useState } from 'react';
import { CommonActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import { ArrowLeft, Check, Eye, EyeOff } from 'lucide-react-native';
import { colors } from '../../constants/colors';
import { RootStackParamList } from '../../navigation/types';
import { login } from './api';

type Props = NativeStackScreenProps<RootStackParamList, 'EmailLogin'>;

export default function EmailLoginScreen({ navigation }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [autoLogin, setAutoLogin] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const submitLogin = async () => {
    const trimmedUsername = username.trim();
    setErrorMessage(null);

    if (!trimmedUsername) {
      const message = '아이디를 입력해주세요.';
      setErrorMessage(message);
      Alert.alert('입력 확인', message);
      return;
    }

    if (!password) {
      const message = '비밀번호를 입력해주세요.';
      setErrorMessage(message);
      Alert.alert('입력 확인', message);
      return;
    }

    setSubmitting(true);

    try {
      const token = await login(trimmedUsername, password);
      await AsyncStorage.setItem('accessToken', token);
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        }),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : '로그인 중 문제가 발생했습니다.';
      setErrorMessage(message);
      Alert.alert('로그인 실패', message);
    } finally {
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
            disabled={submitting}
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
                  onSubmitEditing={submitLogin}
                  editable={!submitting}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                  hitSlop={10}
                  onPress={() => setShowPassword((prev) => !prev)}
                  disabled={submitting}
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
              style={styles.checkboxRow}
              onPress={() => setAutoLogin((prev) => !prev)}
              disabled={submitting}
            >
              <View style={[styles.checkbox, autoLogin && styles.checkboxChecked]}>
                {autoLogin && <Check size={14} color={colors.white} strokeWidth={3} />}
              </View>
              <Text style={styles.checkboxText}>자동 로그인</Text>
            </Pressable>

            {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.buttonPressed,
                submitting && styles.buttonDisabled,
              ]}
              onPress={submitLogin}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.primaryButtonText}>로그인</Text>
              )}
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
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: colors.gray300,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxText: {
    fontSize: 14,
    color: colors.gray500,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    lineHeight: 18,
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
  buttonDisabled: {
    opacity: 0.7,
  },
});
