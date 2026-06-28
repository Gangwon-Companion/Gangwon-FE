import { ImageBackground, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Globe, Plane } from 'lucide-react-native';
import { colors } from '../../constants/colors';
import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const backgroundImage = {
  uri: 'https://images.unsplash.com/photo-1541417904950-b855846fe074?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
};

export default function OnboardingScreen({ navigation }: Props) {
  return (
    <View style={styles.root}>
      <ImageBackground source={backgroundImage} resizeMode="cover" style={styles.background}>
        <View style={styles.overlay} />

        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.brandRow}>
              <View style={styles.logoCircle}>
                <Plane size={24} color={colors.primary} />
              </View>
              <Text style={styles.brandText}>Travelin</Text>
            </View>

            <Pressable style={styles.languageButton}>
              <Globe size={16} color={colors.white} />
              <Text style={styles.languageText}>한국어</Text>
            </Pressable>
          </View>

          <View style={styles.bottomSheet}>
            <Text style={styles.title}>당신의 여행,{`\n`}새로운 세계로</Text>
            <Text style={styles.description}>특별한 여행지를 발견하고 잊지 못할 추억을 만드세요</Text>

            <Pressable style={styles.primaryButton} onPress={() => navigation.navigate('Login')}>
              <Text style={styles.primaryButtonText}>여행 시작하기</Text>
              <Plane size={20} color={colors.white} />
            </Pressable>

            <View style={styles.loginRow}>
              <Text style={styles.mutedText}>이미 계정이 있으신가요? </Text>
              <Pressable onPress={() => navigation.navigate('Login')}>
                <Text style={styles.linkText}>로그인</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  background: {
    flex: 1,
    width: '100%',
    maxWidth: 390,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    paddingTop: 48,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '600',
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  languageText: {
    color: colors.white,
    fontSize: 14,
  },
  bottomSheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 32,
    paddingBottom: 48,
  },
  title: {
    fontSize: 28,
    lineHeight: 36,
    color: colors.text,
    fontWeight: '700',
    marginBottom: 12,
  },
  description: {
    color: colors.gray500,
    fontSize: 14,
    marginBottom: 32,
  },
  primaryButton: {
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  loginRow: {
    marginTop: 24,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  mutedText: {
    color: colors.gray400,
    fontSize: 14,
  },
  linkText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
});
