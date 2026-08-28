import { CommonActions } from '@react-navigation/native';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ArrowLeft, Mail, Plane } from 'lucide-react-native';
import { colors } from '../../constants/colors';
import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const goToHome = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Main' }],
      }),
    );
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
            accessibilityLabel="온보딩으로 돌아가기"
            style={styles.backButton}
            onPress={() => navigation.navigate('Onboarding')}
          >
            <ArrowLeft size={24} color={colors.gray500} />
          </Pressable>

          <View style={styles.brandRow}>
            <View style={styles.logoCircle}>
              <Plane size={28} color={colors.white} />
            </View>
            <Text style={styles.brandText}>Travelin</Text>
          </View>

          <Text style={styles.title}>다시 만나서 반가워요</Text>

          <View style={styles.loginOptions}>
            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [styles.kakaoButton, pressed && styles.buttonPressed]}
              onPress={goToHome}
            >
              <View style={styles.kakaoSymbol}>
                <Text style={styles.kakaoSymbolText}>K</Text>
              </View>
              <Text style={styles.kakaoButtonText}>카카오로 로그인</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [styles.googleButton, pressed && styles.buttonPressed]}
              onPress={goToHome}
            >
              <View style={styles.googleSymbol}>
                <Text style={styles.googleSymbolText}>G</Text>
              </View>
              <Text style={styles.googleButtonText}>Google로 로그인</Text>
            </Pressable>

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>또는</Text>
              <View style={styles.divider} />
            </View>

            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [styles.emailButton, pressed && styles.buttonPressed]}
              onPress={() => navigation.navigate('EmailLogin')}
            >
              <View style={styles.buttonContent}>
                <View style={styles.emailIcon}>
                  <Mail size={19} color={colors.primary} />
                </View>
                <Text style={styles.emailButtonText}>아이디로 로그인</Text>
              </View>
            </Pressable>
          </View>

          <View style={styles.signupRow}>
            <Text style={styles.signupText}>아직 계정이 없으신가요? </Text>
            <Pressable onPress={() => navigation.navigate('SignUp')}>
              <Text style={styles.signupLink}>회원가입</Text>
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
    marginBottom: 24,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 36,
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
    fontSize: 26,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 28,
  },
  loginOptions: {
    gap: 12,
  },
  emailButton: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.gray200,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  emailIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emailButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonPressed: {
    opacity: 0.82,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 4,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.gray200,
  },
  dividerText: {
    color: colors.gray400,
    fontSize: 13,
  },
  kakaoButton: {
    height: 56,
    borderRadius: 16,
    backgroundColor: '#FEE500',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kakaoSymbol: {
    position: 'absolute',
    left: 18,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3C1E1E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kakaoSymbolText: {
    color: '#FEE500',
    fontWeight: '800',
  },
  kakaoButtonText: {
    color: '#191919',
    fontSize: 16,
    fontWeight: '600',
  },
  googleButton: {
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.gray300,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleSymbol: {
    position: 'absolute',
    left: 18,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.gray200,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleSymbolText: {
    color: '#4285F4',
    fontSize: 17,
    fontWeight: '800',
  },
  googleButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
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
