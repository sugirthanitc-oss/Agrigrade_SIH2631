import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { COLORS, SPACING, RADIUS, RESPONSIVE } from '../utils/theme';
import { useLanguage } from '../context/LanguageContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  showLangToggle?: boolean;
  showLogout?: boolean;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onBack,
  rightAction,
  showLangToggle = false,
  showLogout = false,
  onLogout,
}) => {
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= RESPONSIVE.tabletBreakpoint;
  const { language, toggleLanguage } = useLanguage();

  return (
    <View style={styles.outerContainer}>
      <View style={[styles.innerContainer, isLargeScreen && styles.innerLarge]}>
        <View style={styles.leftRow}>
          {onBack && (
            <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
              <Text style={styles.backArrow}>←</Text>
            </TouchableOpacity>
          )}
          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={1}>{title}</Text>
            {subtitle && <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>}
          </View>
        </View>

        {rightAction ? (
          <View style={styles.rightContainer}>{rightAction}</View>
        ) : (showLangToggle || showLogout) ? (
          <View style={styles.rightActionsRow}>
            {showLangToggle && (
              <TouchableOpacity
                style={styles.langToggleBtn}
                onPress={toggleLanguage}
                activeOpacity={0.8}
                accessibilityLabel="Switch Language"
              >
                <Text style={styles.langToggleText}>
                  {language === 'ta' ? '🌐 EN / தமிழ்' : '🌐 தமிழ் / EN'}
                </Text>
              </TouchableOpacity>
            )}
            {showLogout && onLogout && (
              <TouchableOpacity
                style={styles.logoutBtn}
                onPress={onLogout}
                activeOpacity={0.8}
                accessibilityLabel="Logout"
              >
                <Text style={styles.logoutBtnText}>
                  🚪 {language === 'ta' ? 'வெளியேறு' : 'Logout'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    backgroundColor: COLORS.primary,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.12)',
    width: '100%',
  },
  innerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    width: '100%',
  },
  innerLarge: {
    maxWidth: RESPONSIVE.maxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: SPACING.lg,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  backArrow: {
    fontSize: 20,
    color: COLORS.textInverse,
    fontWeight: 'bold',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textInverse,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    color: '#A7F3D0',
    marginTop: 1,
  },
  rightContainer: {
    marginLeft: SPACING.sm,
  },
  rightActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: SPACING.sm,
  },
  langToggleBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  langToggleText: {
    color: COLORS.textInverse,
    fontSize: 11,
    fontWeight: '700',
  },
  logoutBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.55)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  logoutBtnText: {
    color: '#FEE2E2',
    fontSize: 11,
    fontWeight: '700',
  },
});
