import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { COLORS, SPACING, RADIUS, SHADOWS, RESPONSIVE } from '../utils/theme';
import { useAssessment } from '../context/AssessmentContext';
import { useLanguage } from '../context/LanguageContext';

type LoginNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

interface Props {
  navigation: LoginNavigationProp;
}

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { setUser, serverUrl, updateServerUrl } = useAssessment();
  const { t, language, toggleLanguage } = useLanguage();

  const [email, setEmail] = useState('inspector@onion-quality.local');
  const [password, setPassword] = useState('••••••••');
  const [customServerUrl, setCustomServerUrl] = useState(serverUrl);
  const [showServerConfig, setShowServerConfig] = useState(false);

  const { width } = useWindowDimensions();
  const isLargeScreen = width >= RESPONSIVE.tabletBreakpoint;

  const handleLogin = () => {
    if (!email.trim()) {
      Alert.alert(t.login.validationErrorTitle, t.login.validationErrorMsg);
      return;
    }
    if (customServerUrl.trim()) {
      updateServerUrl(customServerUrl);
    }
    setUser({
      name: email.split('@')[0].replace('.', ' ').toUpperCase(),
      email: email.trim(),
      role: language === 'ta' ? 'வெங்காய தரப் பரிசோதகர்' : 'Quality Inspector',
    });
    navigation.replace('Dashboard');
  };

  const handleDemoSignIn = () => {
    setUser({
      name: language === 'ta' ? 'மதிப்பீட்டாளர்' : 'Demo Inspector',
      email: 'inspector@onion-quality.local',
      role: language === 'ta' ? 'முதன்மை தர ஆய்வாளர்' : 'Chief Quality Officer',
    });
    navigation.replace('Dashboard');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={[styles.mainWrapper, isLargeScreen && styles.mainWrapperLarge]}>
            {/* Top Language Toggle */}
            <View style={styles.topLangRow}>
              <TouchableOpacity
                style={styles.langPill}
                onPress={toggleLanguage}
                activeOpacity={0.8}
              >
                <Text style={styles.langPillText}>
                  {language === 'ta' ? '🌐 EN / தமிழ்' : '🌐 தமிழ் / EN'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Clean Agricultural Header Branding */}
            <View style={styles.header}>
              <View style={styles.logoCircle}>
                <Text style={styles.logoIcon}>🧅</Text>
              </View>
              <Text style={styles.appName}>{t.appName}</Text>
              <Text style={styles.subTitle}>{t.appSubtitle}</Text>
            </View>

            {/* Form Card */}
            <View style={[styles.card, SHADOWS.card]}>
              <View style={styles.cardHeader}>
                <Text style={styles.formTitle}>{t.login.title}</Text>
                <View style={styles.systemStatusPill}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusText}>{t.login.statusReady}</Text>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t.login.emailLabel}</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder={t.login.emailPlaceholder}
                  placeholderTextColor={COLORS.textMuted}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t.login.passwordLabel}</Text>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder={t.login.passwordPlaceholder}
                  placeholderTextColor={COLORS.textMuted}
                  secureTextEntry
                />
              </View>

              {/* Toggle Backend URL Setup */}
              <TouchableOpacity
                onPress={() => setShowServerConfig(!showServerConfig)}
                style={styles.serverToggle}
                activeOpacity={0.7}
              >
                <Text style={styles.serverToggleText}>
                  ⚙ {t.login.serverToggleText}{' '}
                  <Text style={styles.serverHostHighlight}>{customServerUrl}</Text>{' '}
                  {showServerConfig ? '▲' : '▼'}
                </Text>
              </TouchableOpacity>

              {showServerConfig && (
                <View style={styles.serverConfigBox}>
                  <Text style={styles.serverConfigHint}>
                    {t.login.serverConfigHint}
                  </Text>
                  <TextInput
                    style={[styles.input, styles.serverInput]}
                    value={customServerUrl}
                    onChangeText={setCustomServerUrl}
                    placeholder="http://localhost:8000"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              )}

              {/* Login Button */}
              <TouchableOpacity style={styles.loginButton} onPress={handleLogin} activeOpacity={0.85}>
                <Text style={styles.loginButtonText}>{t.login.signInBtn}</Text>
              </TouchableOpacity>

              {/* Quick Sign-in */}
              <TouchableOpacity
                style={styles.demoButton}
                onPress={handleDemoSignIn}
                activeOpacity={0.85}
              >
                <Text style={styles.demoButtonText}>{t.login.demoBtn}</Text>
              </TouchableOpacity>
            </View>

            {/* Footer information */}
            <View style={styles.complianceFooter}>
              <Text style={styles.complianceText}>
                {t.login.footerNote}
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    justifyContent: 'center',
    minHeight: '100%',
  },
  mainWrapper: {
    width: '100%',
  },
  mainWrapperLarge: {
    maxWidth: 500,
    alignSelf: 'center',
  },
  topLangRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: SPACING.sm,
  },
  langPill: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  langPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logoCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    ...SHADOWS.card,
  },
  logoIcon: {
    fontSize: 34,
  },
  appName: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  subTitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  systemStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.categories.healthy,
    marginRight: 5,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 0.2,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    letterSpacing: 0.2,
  },
  input: {
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  serverToggle: {
    paddingVertical: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  serverToggleText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  serverHostHighlight: {
    color: COLORS.primaryLight,
    fontWeight: '700',
  },
  serverConfigBox: {
    backgroundColor: '#F0FDF4',
    padding: SPACING.sm,
    borderRadius: RADIUS.sm,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  serverConfigHint: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  serverInput: {
    fontSize: 12,
    paddingVertical: SPACING.xs + 2,
    backgroundColor: COLORS.surface,
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  loginButtonText: {
    color: COLORS.textInverse,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  demoButton: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#86EFAC',
    paddingVertical: SPACING.sm + 4,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  demoButtonText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  complianceFooter: {
    marginTop: SPACING.xl,
    alignItems: 'center',
  },
  complianceText: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
});
