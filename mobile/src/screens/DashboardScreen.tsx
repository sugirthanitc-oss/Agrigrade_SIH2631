import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Alert,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { COLORS, SPACING, RADIUS, SHADOWS, RESPONSIVE } from '../utils/theme';
import { MetricCard } from '../components/MetricCard';
import { StatusBadge } from '../components/StatusBadge';
import { useAssessment } from '../context/AssessmentContext';
import { useLanguage } from '../context/LanguageContext';
import { fetchAssessmentHistory } from '../api/client';

type DashboardNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;

interface Props {
  navigation: DashboardNavigationProp;
}

export const DashboardScreen: React.FC<Props> = ({ navigation }) => {
  const { user, setUser, dashboardStats, refreshDashboard, isLoadingStats } = useAssessment();
  const { t, language, toggleLanguage } = useLanguage();
  const [refreshing, setRefreshing] = useState(false);
  const [recentAssessments, setRecentAssessments] = useState<any[]>([]);

  const { width } = useWindowDimensions();
  const isLargeScreen = width >= RESPONSIVE.tabletBreakpoint;
  const isDesktop = width >= RESPONSIVE.desktopBreakpoint;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    refreshDashboard();
    try {
      const history = await fetchAssessmentHistory();
      if (Array.isArray(history)) {
        setRecentAssessments(history.slice(0, 5));
      }
    } catch {
      // Non-blocking
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleLogout = () => {
    const doLogout = () => {
      setUser(null);
      navigation.replace('Login');
    };

    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.confirm) {
      if (
        window.confirm(
          language === 'ta'
            ? 'நிச்சயமாக உங்கள் கணக்கிலிருந்து வெளியேற விரும்புகிறீர்களா?'
            : 'Are you sure you want to log out of your session?'
        )
      ) {
        doLogout();
      }
    } else {
      Alert.alert(
        (t as any).logoutConfirmTitle || (language === 'ta' ? 'வெளியேறவா?' : 'Log Out?'),
        (t as any).logoutConfirmMsg ||
          (language === 'ta'
            ? 'நிச்சயமாக உங்கள் கணக்கிலிருந்து வெளியேற விரும்புகிறீர்களா?'
            : 'Are you sure you want to log out of your session?'),
        [
          { text: (t as any).cancel || (language === 'ta' ? 'ரத்து' : 'Cancel'), style: 'cancel' },
          {
            text: (t as any).logout || (language === 'ta' ? 'வெளியேறு' : 'Logout'),
            style: 'destructive',
            onPress: doLogout,
          },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Top Nav / App Bar with Language Switcher & Logout */}
      <View style={styles.topBar}>
        <View style={[styles.topBarInner, isLargeScreen && styles.innerLarge]}>
          <View style={styles.brandRow}>
            <View>
              <Text style={styles.appName}>{t.appName}</Text>
              <Text style={styles.operatorSubtitle}>
                {t.dashboard.inspectorRole}: {user?.name || (language === 'ta' ? 'மதிப்பீட்டாளர்' : 'Inspector')}
              </Text>
            </View>
          </View>

          {/* Top Actions: Language Switcher & Logout */}
          <View style={styles.topRightActions}>
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

            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={handleLogout}
              activeOpacity={0.8}
              accessibilityLabel="Log Out"
            >
              <Text style={styles.logoutBtnText}>
                🚪 {(t as any).logout || (language === 'ta' ? 'வெளியேறு' : 'Logout')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing || isLoadingStats} onRefresh={onRefresh} />}
      >
        <View style={[styles.contentContainer, isLargeScreen && styles.innerLarge]}>
          {/* Primary Action Button: Start New Assessment */}
          <TouchableOpacity
            style={[styles.primaryActionCard, SHADOWS.card]}
            onPress={() => navigation.navigate('NewAssessment')}
            activeOpacity={0.88}
          >
            <View style={styles.actionLeft}>
              <View style={styles.cameraIconBox}>
                <Text style={styles.cameraIconText}>📸</Text>
              </View>
              <View style={styles.actionTextBox}>
                <Text style={styles.actionTitle}>{t.dashboard.startAssessmentTitle}</Text>
                <Text style={styles.actionSubtitle}>{t.dashboard.startAssessmentSub}</Text>
              </View>
            </View>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>

          {/* Aggregate Telemetry Metrics */}
          <Text style={styles.sectionHeader}>{t.dashboard.summaryTitle}</Text>
          <View style={[styles.metricsContainer, isDesktop && styles.metricsDesktopRow]}>
            <View style={styles.metricPair}>
              <MetricCard
                title={t.dashboard.totalAssessments}
                value={dashboardStats.total_assessments}
                subtitle={t.dashboard.totalAssessmentsSub}
                accentColor={COLORS.primaryLight}
                iconText="📦"
              />
              <MetricCard
                title={t.dashboard.analyzedOnions}
                value={dashboardStats.total_onions_analyzed.toLocaleString()}
                subtitle={t.dashboard.analyzedOnionsSub}
                accentColor={COLORS.accent}
                iconText="🔍"
              />
            </View>

            <View style={styles.metricPair}>
              <MetricCard
                title={t.dashboard.avgGradeA}
                value={`${dashboardStats.average_grade_a}%`}
                subtitle={t.dashboard.avgGradeASub}
                accentColor={COLORS.categories.healthy}
                iconText="★"
              />
              <MetricCard
                title={t.dashboard.avgUrs}
                value={`${dashboardStats.average_urs}%`}
                subtitle={t.dashboard.avgUrsSub}
                accentColor={COLORS.categories.rotten}
                iconText="⚠"
              />
            </View>
          </View>

          {/* Recent Assessments Section */}
          <View style={styles.recentSection}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionHeader}>{t.dashboard.recentTitle}</Text>
              <TouchableOpacity onPress={() => navigation.navigate('AssessmentHistory')}>
                <Text style={styles.viewAllText}>{t.dashboard.viewAllHistory}</Text>
              </TouchableOpacity>
            </View>

            {recentAssessments.length === 0 ? (
              <View style={styles.emptyRecentCard}>
                <Text style={styles.emptyRecentText}>{t.dashboard.noRecent}</Text>
                <Text style={styles.emptyRecentSub}>{t.dashboard.noRecentSub}</Text>
              </View>
            ) : (
              recentAssessments.map((item, idx) => (
                <TouchableOpacity
                  key={item.assessment_id || idx}
                  style={[styles.recentItemCard, SHADOWS.subtle]}
                  onPress={() => navigation.navigate('AssessmentDetails', { assessmentId: item.assessment_id })}
                  activeOpacity={0.8}
                >
                  <View style={styles.recentLeft}>
                    <Text style={styles.batchIdText}>
                      {item.batch_id || `#${item.assessment_id?.slice(0, 8)}`}
                    </Text>
                    <Text style={styles.recentDate}>
                      {item.date
                        ? new Date(item.date).toLocaleDateString(language === 'ta' ? 'ta-IN' : 'en-US')
                        : 'Today'}{' '}
                      • {item.total_onions} {t.dashboard.onionsCount}
                    </Text>
                  </View>
                  <View style={styles.recentRight}>
                    <StatusBadge grade={item.overall_grade || (item.grade_a >= 70 ? 'Grade A' : 'URS')} size="small" />
                    <Text style={styles.gradeShareText}>
                      {t.grades.gradeAShort}: {item.grade_a}%
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* Quality Benchmark Reference Guidelines */}
          <View style={[styles.guideCard, SHADOWS.subtle]}>
            <Text style={styles.guideTitle}>{t.dashboard.guideTitle}</Text>
            <View style={styles.guideGrid}>
              <View style={styles.guideItem}>
                <View style={[styles.guideDot, { backgroundColor: COLORS.categories.healthy }]} />
                <Text style={styles.guideItemText}>
                  <Text style={styles.boldText}>{t.categories.healthy}:</Text> {t.dashboard.healthyDesc}
                </Text>
              </View>
              <View style={styles.guideItem}>
                <View style={[styles.guideDot, { backgroundColor: COLORS.categories.damaged }]} />
                <Text style={styles.guideItemText}>
                  <Text style={styles.boldText}>{t.categories.damaged}:</Text> {t.dashboard.damagedDesc}
                </Text>
              </View>
              <View style={styles.guideItem}>
                <View style={[styles.guideDot, { backgroundColor: COLORS.categories.rotten }]} />
                <Text style={styles.guideItemText}>
                  <Text style={styles.boldText}>{t.categories.rotten}:</Text> {t.dashboard.rottenDesc}
                </Text>
              </View>
              <View style={styles.guideItem}>
                <View style={[styles.guideDot, { backgroundColor: COLORS.categories.sprouted }]} />
                <Text style={styles.guideItemText}>
                  <Text style={styles.boldText}>{t.categories.sprouted}:</Text> {t.dashboard.sproutedDesc}
                </Text>
              </View>
              <View style={styles.guideItem}>
                <View style={[styles.guideDot, { backgroundColor: COLORS.categories.undersized }]} />
                <Text style={styles.guideItemText}>
                  <Text style={styles.boldText}>{t.categories.undersized}:</Text> {t.dashboard.undersizedDesc}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  topBar: {
    backgroundColor: COLORS.primary,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  topBarInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    width: '100%',
  },
  innerLarge: {
    maxWidth: RESPONSIVE.maxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: SPACING.lg,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  appName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textInverse,
    letterSpacing: -0.2,
  },
  operatorSubtitle: {
    fontSize: 12,
    color: '#A7F3D0',
    marginTop: 2,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  langToggleBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  langToggleText: {
    color: COLORS.textInverse,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  logoutBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.55)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutBtnText: {
    color: '#FEE2E2',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  scrollContent: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
  },
  contentContainer: {
    width: '100%',
  },
  primaryActionCard: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: '#059669',
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cameraIconBox: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  cameraIconText: {
    fontSize: 26,
  },
  actionTextBox: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textInverse,
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#D1FAE5',
    marginTop: 3,
    lineHeight: 16,
  },
  actionArrow: {
    fontSize: 24,
    color: COLORS.textInverse,
    fontWeight: 'bold',
    marginLeft: SPACING.sm,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    letterSpacing: 0.2,
  },
  metricsContainer: {
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  metricsDesktopRow: {
    flexDirection: 'row',
  },
  metricPair: {
    flexDirection: 'row',
    gap: SPACING.sm,
    flex: 1,
  },
  recentSection: {
    marginBottom: SPACING.lg,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primaryLight,
  },
  emptyRecentCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyRecentText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  emptyRecentSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  recentItemCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  recentLeft: {
    flex: 1,
  },
  batchIdText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  recentDate: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 3,
  },
  recentRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  gradeShareText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  guideCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  guideTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  guideGrid: {
    gap: 8,
  },
  guideItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  guideDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING.sm,
  },
  guideItemText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  boldText: {
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
});
