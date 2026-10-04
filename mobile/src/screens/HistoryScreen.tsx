import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Image,
  useWindowDimensions,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, AssessmentData } from '../types';
import { COLORS, SPACING, RADIUS, SHADOWS, RESPONSIVE } from '../utils/theme';
import { Header } from '../components/Header';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingState } from '../components/LoadingState';
import { ErrorState } from '../components/ErrorState';
import { EmptyState } from '../components/EmptyState';
import { fetchAssessmentHistory } from '../api/client';
import { useAssessment } from '../context/AssessmentContext';
import { useLanguage } from '../context/LanguageContext';

type HistoryNavProp = NativeStackNavigationProp<RootStackParamList, 'AssessmentHistory'>;

interface Props {
  navigation: HistoryNavProp;
}

export const HistoryScreen: React.FC<Props> = ({ navigation }) => {
  const { history: cachedHistory } = useAssessment();
  const { t, language } = useLanguage();
  const [assessments, setAssessments] = useState<AssessmentData[]>(cachedHistory);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { width } = useWindowDimensions();
  const isLargeScreen = width >= RESPONSIVE.tabletBreakpoint;

  const loadHistory = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const items = await fetchAssessmentHistory();
      setAssessments(items);
    } catch (err: any) {
      if (cachedHistory.length > 0) {
        setAssessments(cachedHistory);
      } else {
        const cleanMsg = typeof err?.message === 'string' && !err.message.includes('[object Object]')
          ? err.message
          : t.errors.networkFailureMsg;
        setErrorMessage(cleanMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const filteredItems = assessments.filter((item) => {
    const query = searchQuery.toLowerCase();
    const batchMatch = item.batch_id?.toLowerCase().includes(query);
    const gradeMatch = item.grading?.overall_grade?.toLowerCase().includes(query);
    const idMatch = item.assessment_id?.toLowerCase().includes(query);
    return batchMatch || gradeMatch || idMatch || !searchQuery;
  });

  const renderItem = ({ item }: { item: AssessmentData }) => {
    const totalOnions = item.total_onions ?? item.total_count ?? 0;
    const gradeAPct = item.grade_a ?? item.grading?.grade_a_percentage ?? 0;
    const ursPct = item.urs ?? item.grading?.urs_percentage ?? 0;

    return (
      <TouchableOpacity
        style={[styles.historyCard, SHADOWS.subtle]}
        onPress={() => navigation.navigate('AssessmentDetails', { assessmentId: item.assessment_id })}
        activeOpacity={0.8}
      >
        <View style={styles.cardTopRow}>
          {item.annotated_image_url ? (
            <Image source={{ uri: item.annotated_image_url }} style={styles.thumbnail} />
          ) : (
            <View style={styles.placeholderThumbnail}>
              <Text style={styles.placeholderIcon}>🧅</Text>
            </View>
          )}

          <View style={styles.cardHeaderInfo}>
            <View style={styles.idAndBadgeRow}>
              <Text style={styles.batchId} numberOfLines={1}>
                {item.batch_id || `#${item.assessment_id.slice(0, 8)}`}
              </Text>
              <StatusBadge grade={item.grading?.overall_grade || (gradeAPct >= 70 ? 'Grade A' : 'URS')} size="small" />
            </View>

            <Text style={styles.assessmentIdText} numberOfLines={1}>
              ID: {item.assessment_id}
            </Text>
            <Text style={styles.dateText}>
              {new Date(item.timestamp).toLocaleString(language === 'ta' ? 'ta-IN' : 'en-US')}
            </Text>
          </View>
        </View>

        <View style={styles.cardBottomMetrics}>
          <View style={styles.metricItem}>
            <Text style={styles.metricValue}>{totalOnions}</Text>
            <Text style={styles.metricLabel}>{t.dashboard.onionsCount}</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={[styles.metricValue, { color: COLORS.categories.healthy }]}>
              {gradeAPct.toFixed(1)}%
            </Text>
            <Text style={styles.metricLabel}>{t.grades.gradeAShort}</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={[styles.metricValue, { color: COLORS.categories.rotten }]}>
              {ursPct.toFixed(1)}%
            </Text>
            <Text style={styles.metricLabel}>{t.grades.ursShort}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title={t.history.title}
        subtitle={t.history.subtitle}
        onBack={() => navigation.goBack()}
        showLangToggle
      />

      <View style={[styles.mainWrapper, isLargeScreen && styles.mainWrapperLarge]}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder={t.history.searchPlaceholder}
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {isLoading && !assessments.length ? (
          <LoadingState message={t.history.loading} />
        ) : errorMessage && !assessments.length ? (
          <ErrorState message={errorMessage} onRetry={loadHistory} />
        ) : (
          <FlatList
            data={filteredItems}
            keyExtractor={(item) => item.assessment_id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={isLoading} onRefresh={loadHistory} />}
            ListEmptyComponent={
              <EmptyState
                title={t.history.emptyTitle}
                message={
                  searchQuery
                    ? `"${searchQuery}" ${t.history.emptyQueryMsg}`
                    : t.history.emptyAllMsg
                }
              />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  mainWrapper: {
    flex: 1,
    width: '100%',
  },
  mainWrapperLarge: {
    maxWidth: 820,
    alignSelf: 'center',
    paddingHorizontal: SPACING.md,
  },
  searchContainer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xs,
  },
  searchInput: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  historyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.md,
    backgroundColor: '#F0FDF4',
    marginRight: SPACING.md,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  placeholderThumbnail: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.md,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  placeholderIcon: {
    fontSize: 24,
  },
  cardHeaderInfo: {
    flex: 1,
  },
  idAndBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  batchId: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primaryDark,
    flex: 1,
    marginRight: SPACING.xs,
  },
  assessmentIdText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontFamily: 'monospace',
  },
  dateText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  cardBottomMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceSubtle,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  metricLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 1,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.border,
  },
});
