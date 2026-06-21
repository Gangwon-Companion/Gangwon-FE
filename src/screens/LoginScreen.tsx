import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ArrowLeft, Check, Eye, EyeOff, Plane } from 'lucide-react-native';
import { colors } from '../constants/colors';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [autoLogin, setAutoLogin] = useState(false);

  return (
    <View style={styles.pageWrap}>
      <View style={styles.container}>
        <Pressable style={styles.backButton} onPress={() => navigation.navigate('Onboarding')}>
          <ArrowLeft size={24} color={colors.gray500} />
        </Pressable>

        <View style={styles.brandRow}>
          <View style={styles.logoCircle}>
            <Plane size={28} color={colors.white} />
          </View>
          <Text style={styles.brandText}>Travelin</Text>
        </View>

        <Text style={styles.title}>환영합니다</Text>
        <Text style={styles.subtitle}>로그인하고 여행을 계속하세요</Text>

        <View style={styles.form}>
          <View>
            <Text style={styles.label}>아이디</Text>
            <TextInput
              style={styles.input}
              placeholder="아이디를 입력하세요"
              placeholderTextColor={colors.gray400}
              autoCapitalize="none"
            />
          </View>

          <View>
            <Text style={styles.label}>비밀번호</Text>
            <View style={styles.passwordBox}>
              <TextInput
                style={styles.passwordInput}
                placeholder="비밀번호를 입력하세요"
                placeholderTextColor={colors.gray400}
                secureTextEntry={!showPassword}
              />
              <Pressable onPress={() => setShowPassword((prev) => !prev)}>
                {showPassword ? (
                  <EyeOff size={20} color={colors.gray400} />
                ) : (
                  <Eye size={20} color={colors.gray400} />
                )}
              </Pressable>
            </View>
          </View>
        </View>

        <Pressable style={styles.checkboxRow} onPress={() => setAutoLogin((prev) => !prev)}>
          <View style={[styles.checkbox, autoLogin && styles.checkboxChecked]}>
            {autoLogin && <Check size={14} color={colors.white} strokeWidth={3} />}
          </View>
          <Text style={styles.checkboxText}>자동 로그인</Text>
        </Pressable>

        <Pressable style={styles.primaryButton} onPress={() => navigation.replace('Home')}>
          <Text style={styles.primaryButtonText}>로그인</Text>
        </Pressable>

        <View style={styles.signupRow}>
          <Text style={styles.signupText}>계정이 없으신가요? </Text>
          <Pressable onPress={() => navigation.navigate('SignUp')}>
            <Text style={styles.signupLink}>회원가입</Text>
          </Pressable>
        </View>
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
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 48,
  },
  logoCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.text,
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
    gap: 8,
    marginBottom: 32,
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
  primaryButton: {
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  signupText: {
    color: colors.gray500,
    fontSize: 14,
  },
  signupLink: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
});
