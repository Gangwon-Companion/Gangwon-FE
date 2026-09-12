import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useDesktopLayout } from '../../hooks/useContentWidth';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Plane } from 'lucide-react-native';
import { colors } from '../../constants/colors';
import { RootStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const backgroundImage = {
  uri: 'https://images.unsplash.com/photo-1541417904950-b855846fe074?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
};

export default function OnboardingScreen({ navigation }: Props) {
  const desktop = useDesktopLayout();
  return (
    <View style={styles.root}>
      <ScrollView style={{ flex: 1, width: '100%' }} contentContainerStyle={{ flexGrow: 1 }}>
      <ImageBackground source={backgroundImage} resizeMode="cover" style={[styles.background, desktop && styles.desktopBackground]}>
        <View style={styles.overlay} />

        <View style={[styles.content, desktop && styles.desktopContent]}>
          <View style={[styles.header, desktop && styles.desktopHeader]}>
            <View style={styles.brandRow}>
              <View style={styles.logoCircle}>
                <Plane size={24} color={colors.primary} />
              </View>
              <Text style={styles.brandText}>강원동행</Text>
            </View>
            {desktop && <View style={styles.heroCopy}>
              <Text style={styles.heroTitle}>강원에서 만나는{`\n`}나만의 여행</Text>
              <Text style={styles.heroDescription}>바다부터 숲까지, 취향에 맞는 여행지를 찾고{`\n`}AI와 함께 나만의 일정을 만들어 보세요.</Text>
            </View>}
          </View>

          <View style={[styles.bottomSheet, desktop && styles.desktopSheet]}>
            <Text style={styles.title}>당신의 여행,{`\n`}새로운 강원도로</Text>
            <Text style={styles.description}>특별한 여행지를 발견하고 잊지 못할 추억을 만드세요</Text>

            <Pressable style={styles.primaryButton} onPress={() => navigation.navigate('SignUp')}>
              <Text style={styles.primaryButtonText}>여행 시작하기</Text>
              <Plane size={20} color={colors.white} />
            </Pressable>

            <Pressable accessibilityRole="link" onPress={() => navigation.navigate('Main')} style={{ alignItems: 'center', padding: 14 }}>
              <Text style={styles.linkText}>여행지 먼저 둘러보기</Text>
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  desktopBackground: { maxWidth: undefined, minHeight: 620 },
  desktopContent: { flexDirection: 'row', alignItems: 'center', padding: 40, gap: 40 },
  desktopHeader: { flex: 1, paddingTop: 0, paddingHorizontal: 0, flexDirection: 'column', alignItems: 'flex-start', gap: 40 },
  desktopSheet: { width: 420, borderRadius: 24, padding: 32, paddingBottom: 32 },
  heroCopy: { gap: 24 },
  heroTitle: { color: '#fff', fontSize: 42, lineHeight: 56, fontWeight: '800' },
  heroDescription: { color: '#fff', fontSize: 16, lineHeight: 27 },
  root: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  background: {
    flex: 1,
    width: '100%',
    minHeight: 600,
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
