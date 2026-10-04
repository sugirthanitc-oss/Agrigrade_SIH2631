import React, { useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar, ActivityIndicator, TouchableOpacity } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { COLORS, SPACING, RADIUS } from '../utils/theme';
import { useLanguage } from '../context/LanguageContext';

type SplashScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Splash'>;

interface Props {
  navigation: SplashScreenNavigationProp;
}

export const SplashScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useLanguage();

  useEffect(() => {
    // Ultra-fast startup: navigate within 600ms
    const timer = setTimeout(() => {
      navigation.replace('Login');
    }, 600);
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Fresh Agricultural Branding Icon */}
      <View style={styles.logoBadge}>
        <Text style={styles.logoIcon}>🧅</Text>
      </View>

      {/* Main Brand */}
      <Text style={styles.title}>{t.splash.title}</Text>
      <Text style={styles.tagline}>{t.splash.tagline}</Text>

      {/* Feature chips */}
      <View style={styles.chipRow}>
        <View style={styles.chip}><Text style={styles.chipText}>{t.splash.chipRealtime}</Text></View>
        <View style={styles.chip}><Text style={styles.chipText}>{t.splash.chipYolo}</Text></View>
        <View style={styles.chip}><Text style={styles.chipText}>{t.splash.chipGrading}</Text></View>
      </View>

      {/* Minimal Footer */}
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#A7F3D0" />
        <Text style={styles.loadingText}>{t.splash.loading}</Text>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => navigation.replace('Login')}
          activeOpacity={0.8}
        >
          <Text style={styles.skipButtonText}>{t.splash.skip}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  logoBadge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  logoIcon: {
    fontSize: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textInverse,
    letterSpacing: -0.3,
    textAlign: 'center',
    maxWidth: 340,
  },
  tagline: {
    fontSize: 14,
    color: '#A7F3D0',
    marginTop: SPACING.xs,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 20,
  },
  chipRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    marginTop: SPACING.lg,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  chip: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  chipText: {
    color: '#F0FDF4',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  footer: {
    position: 'absolute',
    bottom: SPACING.xl,
    alignItems: 'center',
  },
  loadingText: {
    color: '#D1FAE5',
    fontSize: 12,
    marginTop: SPACING.xs,
  },
  skipButton: {
    marginTop: SPACING.sm,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
  },
  skipButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
