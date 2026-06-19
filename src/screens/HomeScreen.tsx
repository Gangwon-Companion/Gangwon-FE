import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Plane } from 'lucide-react-native';
import { colors } from '../constants/colors';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  return (
    <View style={styles.pageWrap}>
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.logoCircle}>
            <Plane size={28} color={colors.white} />
          </View>
          <Text style={styles.title}>Gangwon Companion</Text>
          <Text style={styles.description}>로그인/회원가입 화면 연결이 완료된 임시 홈 화면입니다.</Text>
          <Pressable style={styles.button} onPress={() => navigation.replace('Onboarding')}>
            <Text style={styles.buttonText}>처음 화면으로</Text>
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
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  description: {
    color: colors.gray500,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    width: '100%',
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
