import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { COLORS, SPACING, RADIUS, SHADOWS, RESPONSIVE } from '../utils/theme';
import { Header } from '../components/Header';
import { StatusBadge } from '../components/StatusBadge';
import { QualityBar } from '../components/QualityBar';
import { useLanguage } from '../context/LanguageContext';

type ResultsNavProp = NativeStackNavigationProp<RootStackParamList, 'QualityResults'>;
type ResultsRouteProp = RouteProp<RootStackParamList, 'QualityResults'>;

interface Props {
  navigation: ResultsNavProp;
  route: ResultsRouteProp;
}

export const ResultsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { assessment } = route.params;
  const { t, language } = useLanguage();

  const { width } = useWindowDimensions();
  const isLargeScreen = width >= RESPONSIVE.tabletBreakpoint;

  const {
    assessment_id,
    batch_id,
    timestamp,
    counts,
    percentages,
    grading,
    annotated_image_url,
    raw_image_url,
    detections = [],
  } = assessment;

  const totalOnions = assessment.total_onions ?? assessment.total_count ?? 0;
  const gradeAPct = assessment.grade_a ?? grading?.grade_a_percentage ?? 0;
  const ursPct = assessment.urs ?? grading?.urs_percentage ?? 0;

  const categoryItems = [
    { key: 'healthy', label: t.categories.healthy, color: COLORS.categories.healthy, count: counts.healthy, pct: percentages.healthy, icon: '✓' },
    { key: 'damaged', label: t.categories.damaged, color: COLORS.categories.damaged, count: counts.damaged, pct: percentages.damaged, icon: '⚡' },
    { key: 'rotten', label: t.categories.rotten, color: COLORS.categories.rotten, count: counts.rotten, pct: percentages.rotten, icon: '✕' },
    { key: 'sprouted', label: t.categories.sprouted, color: COLORS.categories.sprouted, count: counts.sprouted, pct: percentages.sprouted, icon: '🌱' },
    { key: 'undersized', label: t.categories.undersized, color: COLORS.categories.undersized, count: counts.undersized, pct: percentages.undersized, icon: '▼' },
  ];

  const getTranslatedClassName = (rawClass: string) => {
    switch (rawClass.toLowerCase()) {
      case 'healthy': return t.categories.healthy;
      case 'damaged': return t.categories.damaged;
      case 'rotten': return t.categories.rotten;
      case 'sprouted': return t.categories.sprouted;
      case 'undersized': return t.categories.undersized;
      default: return rawClass;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title={t.results.title}
        subtitle={`${t.results.subtitle}: ${batch_id || assessment_id.slice(0, 8)}`}
        onBack={() => navigation.navigate('Dashboard')}
        showLangToggle
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.mainWrapper, isLargeScreen && styles.mainWrapperLarge]}>
          {/* Top Grade Summary Banner */}
          <View style={[styles.gradeBanner, SHADOWS.card]}>
            <View style={styles.bannerHeader}>
              <View>
                <Text style={styles.batchLabel}>{batch_id || t.results.sampleLot}</Text>
                <Text style={styles.timestamp}>
                  {new Date(timestamp).toLocaleString(language === 'ta' ? 'ta-IN' : 'en-US')}
                </Text>
              </View>
              <StatusBadge grade={grading?.overall_grade || (gradeAPct >= 70 ? 'Grade A' : 'URS')} size="large" />
            </View>

            <View style={styles.primaryMetricsRow}>
              <View style={styles.primaryMetricCol}>
                <Text style={styles.primaryValue}>{totalOnions}</Text>
                <Text style={styles.primaryLabel}>{t.results.total}</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.primaryMetricCol}>
                <Text style={[styles.primaryValue, { color: COLORS.categories.healthy }]}>
                  {gradeAPct.toFixed(1)}%
                </Text>
                <Text style={styles.primaryLabel}>{t.results.gradeA}</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.primaryMetricCol}>
                <Text style={[styles.primaryValue, { color: COLORS.categories.rotten }]}>
                  {ursPct.toFixed(1)}%
                </Text>
                <Text style={styles.primaryLabel}>{t.results.urs}</Text>
              </View>
            </View>
          </View>

          {/* Visual Annotated Bounding Box Image */}
          {(annotated_image_url || raw_image_url) && (
            <View style={[styles.imageCard, SHADOWS.card]}>
              <View style={styles.imageHeaderRow}>
                <Text style={styles.cardTitle}>{t.results.detectionMapTitle}</Text>
                <View style={styles.boxCountPill}>
                  <Text style={styles.boxCountText}>{totalOnions} {t.results.onionsBadge}</Text>
                </View>
              </View>
              <View style={styles.imageWrapper}>
                <Image
                  source={{ uri: annotated_image_url || raw_image_url }}
                  style={styles.annotatedImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.imageCaption}>{t.results.detectionMapCaption}</Text>
            </View>
          )}

          {/* Individual Bounding Box Detections Log */}
          {detections && detections.length > 0 && (
            <View style={[styles.detectionsCard, SHADOWS.subtle]}>
              <Text style={styles.cardTitle}>{t.results.individualTitle}</Text>
              <Text style={styles.detectionsSub}>{t.results.individualSub}</Text>
              <View style={styles.detectionsGrid}>
                {detections.map((det, idx) => {
                  const cName = det.class_name || (det as any).class || 'healthy';
                  const translatedName = getTranslatedClassName(cName);
                  const conf = det.confidence ? Math.round(det.confidence * 100) : 90;
                  const color = (COLORS.categories as any)[cName] || COLORS.primary;

                  return (
                    <View
                      key={det.id || idx}
                      style={[styles.detectionBadge, { borderColor: color }]}
                    >
                      <View style={[styles.detDot, { backgroundColor: color }]} />
                      <Text style={[styles.detClassText, { color }]}>
                        [{translatedName} {conf}%]
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* 5 Category Breakdown Matrix */}
          <View style={[styles.card, SHADOWS.card]}>
            <Text style={styles.cardTitle}>{t.results.breakdownTitle}</Text>
            <QualityBar percentages={percentages} counts={counts} total={totalOnions} />

            <View style={styles.categoryGrid}>
              {categoryItems.map((item) => (
                <View key={item.key} style={styles.categoryCard}>
                  <View style={styles.catCardTop}>
                    <View style={[styles.catIconBox, { backgroundColor: `${item.color}18` }]}>
                      <Text style={[styles.catIcon, { color: item.color }]}>{item.icon}</Text>
                    </View>
                    <Text style={styles.catLabel}>{item.label}</Text>
                  </View>
                  <View style={styles.catCardBottom}>
                    <Text style={styles.catCount}>{item.count} {t.results.countSuffix}</Text>
                    <Text style={[styles.catPct, { color: item.color }]}>
                      {item.pct.toFixed(1)}%
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Automated Verdict */}
          {grading?.verdict_notes && grading.verdict_notes.length > 0 && (
            <View style={[styles.verdictCard, SHADOWS.subtle]}>
              <Text style={styles.verdictTitle}>{t.results.verdictTitle}</Text>
              {grading.verdict_notes.map((note, index) => (
                <Text key={index} style={styles.verdictBullet}>
                  • {note}
                </Text>
              ))}
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtonGroup}>
            <TouchableOpacity
              style={[styles.primaryReportBtn, SHADOWS.hover]}
              onPress={() => navigation.navigate('DigitalReport', { assessment })}
              activeOpacity={0.88}
            >
              <Text style={styles.reportBtnText}>{t.results.viewReportBtn}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryHomeBtn}
              onPress={() => navigation.navigate('NewAssessment')}
              activeOpacity={0.85}
            >
              <Text style={styles.homeBtnText}>{t.results.nextAssessmentBtn}</Text>
            </TouchableOpacity>
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
  scrollContent: {
    padding: SPACING.md,
  },
  mainWrapper: {
    width: '100%',
  },
  mainWrapperLarge: {
    maxWidth: 820,
    alignSelf: 'center',
  },
  gradeBanner: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  bannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  batchLabel: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  timestamp: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  primaryMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceSubtle,
  },
  primaryMetricCol: {
    alignItems: 'center',
  },
  metricDivider: {
    width: 1,
    height: 38,
    backgroundColor: COLORS.border,
  },
  primaryValue: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  primaryLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 3,
    fontWeight: '700',
  },
  imageCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  imageHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  boxCountPill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  boxCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primaryLight,
  },
  imageWrapper: {
    width: '100%',
    height: 280,
    backgroundColor: '#022C22',
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  annotatedImage: {
    width: '100%',
    height: '100%',
  },
  imageCaption: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: SPACING.xs + 2,
    lineHeight: 16,
  },
  detectionsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  detectionsSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    marginBottom: SPACING.sm,
  },
  detectionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  detectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  detDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  detClassText: {
    fontSize: 12,
    fontWeight: '700',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: SPACING.md,
  },
  categoryCard: {
    backgroundColor: COLORS.surfaceSubtle,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
    flex: 1,
    minWidth: 120,
  },
  catCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  catIconBox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  catIcon: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  catLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  catCardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  catCount: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  catPct: {
    fontSize: 13,
    fontWeight: '800',
  },
  verdictCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  verdictTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  verdictBullet: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginTop: 2,
  },
  actionButtonGroup: {
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  primaryReportBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  reportBtnText: {
    color: COLORS.textInverse,
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryHomeBtn: {
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.primaryLight,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  homeBtnText: {
    color: COLORS.primaryDark,
    fontSize: 14,
    fontWeight: '700',
  },
});
