import React, { useEffect, useState } from 'react';
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
import { RootStackParamList, AssessmentData } from '../types';
import { COLORS, SPACING, RADIUS, SHADOWS, RESPONSIVE } from '../utils/theme';
import { Header } from '../components/Header';
import { StatusBadge } from '../components/StatusBadge';
import { QualityBar } from '../components/QualityBar';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { fetchAssessmentById } from '../api/client';
import { useAssessment } from '../context/AssessmentContext';
import { useLanguage } from '../context/LanguageContext';

type DetailsNavProp = NativeStackNavigationProp<RootStackParamList, 'AssessmentDetails'>;
type DetailsRouteProp = RouteProp<RootStackParamList, 'AssessmentDetails'>;

interface Props {
  navigation: DetailsNavProp;
  route: DetailsRouteProp;
}

export const AssessmentDetailsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { assessmentId } = route.params;
  const { history } = useAssessment();
  const { t, language } = useLanguage();

  const [assessment, setAssessment] = useState<AssessmentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { width } = useWindowDimensions();
  const isLargeScreen = width >= RESPONSIVE.tabletBreakpoint;

  const loadDetails = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    const cached = history.find((a) => a.assessment_id === assessmentId);
    if (cached) {
      setAssessment(cached);
      setIsLoading(false);
      return;
    }

    try {
      const data = await fetchAssessmentById(assessmentId);
      setAssessment(data);
    } catch (err: any) {
      const cleanMsg = typeof err?.message === 'string' && !err.message.includes('[object Object]')
        ? err.message
        : t.errors.networkFailureMsg;
      setErrorMessage(cleanMsg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [assessmentId]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title={t.history.detailsTitle} onBack={() => navigation.goBack()} showLangToggle />
        <LoadingState message={t.history.loadingDetails} />
      </SafeAreaView>
    );
  }

  if (errorMessage || !assessment) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Header title={t.history.detailsTitle} onBack={() => navigation.goBack()} showLangToggle />
        <ErrorState
          title={t.history.errorLoadDetails}
          message={errorMessage || t.errors.unknownMsg}
          onRetry={loadDetails}
        />
      </SafeAreaView>
    );
  }

  const {
    batch_id,
    timestamp,
    total_count,
    total_onions,
    counts,
    percentages,
    grading,
    annotated_image_url,
    variety,
    notes,
  } = assessment;

  const countVal = total_onions ?? total_count ?? 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title={batch_id || t.history.detailsTitle}
        subtitle={`ID: #${assessment.assessment_id.slice(0, 8)}`}
        onBack={() => navigation.goBack()}
        showLangToggle
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.mainWrapper, isLargeScreen && styles.mainWrapperLarge]}>
          {/* Banner with Grade */}
          <View style={[styles.card, SHADOWS.card]}>
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.dateText}>
                  {new Date(timestamp).toLocaleString(language === 'ta' ? 'ta-IN' : 'en-US')}
                </Text>
                <Text style={styles.varietyText}>
                  {t.history.varietyLabel} {variety || t.newAssessment.varieties.red}
                </Text>
              </View>
              <StatusBadge grade={grading.overall_grade} size="large" />
            </View>

            <View style={styles.metricsRow}>
              <View style={styles.metricCol}>
                <Text style={styles.metricVal}>{countVal}</Text>
                <Text style={styles.metricSub}>{t.history.totalCount}</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricCol}>
                <Text style={[styles.metricVal, { color: COLORS.categories.healthy }]}>
                  {grading.grade_a_percentage.toFixed(1)}%
                </Text>
                <Text style={styles.metricSub}>{t.grades.gradeAShort}</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricCol}>
                <Text style={[styles.metricVal, { color: COLORS.categories.rotten }]}>
                  {grading.urs_percentage.toFixed(1)}%
                </Text>
                <Text style={styles.metricSub}>{t.grades.urs}</Text>
              </View>
            </View>
          </View>

          {/* Annotated Visual */}
          {annotated_image_url && (
            <View style={[styles.card, SHADOWS.subtle]}>
              <Text style={styles.sectionHeader}>{t.history.detectionMapTitle}</Text>
              <Image
                source={{ uri: annotated_image_url }}
                style={styles.image}
                resizeMode="contain"
              />
            </View>
          )}

          {/* Distribution Breakdown */}
          <View style={[styles.card, SHADOWS.subtle]}>
            <Text style={styles.sectionHeader}>{t.history.defectDistTitle}</Text>
            <QualityBar percentages={percentages} counts={counts} total={countVal} />
          </View>

          {/* Notes */}
          {notes && (
            <View style={[styles.card, SHADOWS.subtle]}>
              <Text style={styles.sectionHeader}>{t.history.inspectorNotesTitle}</Text>
              <Text style={styles.notesText}>{notes}</Text>
            </View>
          )}

          {/* Action: Open Digital Report */}
          <TouchableOpacity
            style={styles.reportActionBtn}
            onPress={() => navigation.navigate('DigitalReport', { assessment })}
            activeOpacity={0.85}
          >
            <Text style={styles.reportActionBtnText}>{t.history.viewCertBtn}</Text>
          </TouchableOpacity>
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
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  varietyText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceSubtle,
  },
  metricCol: {
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  metricSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 32,
    backgroundColor: COLORS.border,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primaryDark,
    marginBottom: SPACING.sm,
  },
  image: {
    width: '100%',
    height: 260,
    borderRadius: RADIUS.md,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  notesText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  reportActionBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  reportActionBtnText: {
    color: COLORS.textInverse,
    fontSize: 15,
    fontWeight: '700',
  },
});
