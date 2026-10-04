import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Share,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { COLORS, SPACING, RADIUS, SHADOWS, RESPONSIVE } from '../utils/theme';
import { Header } from '../components/Header';
import { StatusBadge } from '../components/StatusBadge';
import { useAssessment } from '../context/AssessmentContext';
import { useLanguage } from '../context/LanguageContext';

type ReportNavProp = NativeStackNavigationProp<RootStackParamList, 'DigitalReport'>;
type ReportRouteProp = RouteProp<RootStackParamList, 'DigitalReport'>;

interface Props {
  navigation: ReportNavProp;
  route: ReportRouteProp;
}

export const ReportScreen: React.FC<Props> = ({ navigation, route }) => {
  const { assessment } = route.params;
  const { user } = useAssessment();
  const { t, language } = useLanguage();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const { width } = useWindowDimensions();
  const isLargeScreen = width >= RESPONSIVE.tabletBreakpoint;

  const assessmentId = assessment.assessment_id;
  const dateTimeFormatted = new Date(assessment.timestamp).toLocaleString(
    language === 'ta' ? 'ta-IN' : 'en-US'
  );
  const totalOnions = assessment.total_onions ?? assessment.total_count ?? 0;
  const gradeAPct = (assessment.grade_a ?? assessment.grading?.grade_a_percentage ?? 0).toFixed(1);
  const ursPct = (assessment.urs ?? assessment.grading?.urs_percentage ?? 0).toFixed(1);

  const healthyPct = assessment.percentages.healthy.toFixed(1);
  const damagedPct = assessment.percentages.damaged.toFixed(1);
  const rottenPct = assessment.percentages.rotten.toFixed(1);
  const sproutedPct = assessment.percentages.sprouted.toFixed(1);
  const undersizedPct = assessment.percentages.undersized.toFixed(1);

  const aiAnalysisStatus = assessment.grading?.is_acceptable
    ? t.report.statusAccepted
    : t.report.statusUrs;

  const overallGrade = assessment.grading?.overall_grade || (Number(gradeAPct) >= 70 ? 'Grade A' : 'URS');

  // Printable HTML for PDF report with dynamic language & green theme
  const createReportHtml = (): string => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${t.report.mainTitle}</title>
          <style>
            body {
              font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
              color: #0F172A;
              padding: 40px;
              line-height: 1.5;
            }
            .header-banner {
              text-align: center;
              border-bottom: 3px solid #064E3B;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .title {
              font-size: 24px;
              font-weight: 800;
              color: #064E3B;
              letter-spacing: 0.5px;
              margin: 0;
            }
            .subtitle {
              font-size: 13px;
              color: #059669;
              margin-top: 6px;
              font-weight: 700;
            }
            .meta-box {
              background: #F0FDF4;
              border: 1px solid #D1FAE5;
              border-radius: 8px;
              padding: 16px;
              margin-bottom: 24px;
            }
            .meta-row {
              display: flex;
              justify-content: space-between;
              padding: 6px 0;
              border-bottom: 1px solid #E2E8F0;
            }
            .meta-row:last-child {
              border-bottom: none;
            }
            .meta-label {
              font-weight: 700;
              color: #065F46;
              font-size: 13px;
            }
            .meta-val {
              font-size: 14px;
              color: #0F172A;
              font-weight: 600;
            }
            .summary-cards {
              display: flex;
              gap: 16px;
              margin-bottom: 30px;
            }
            .summary-card {
              flex: 1;
              background: #F8FAFC;
              border: 1px solid #E2E8F0;
              border-radius: 8px;
              padding: 16px;
              text-align: center;
            }
            .summary-card.grade-a {
              background: #ECFDF5;
              border-color: #A7F3D0;
            }
            .summary-card.urs {
              background: #FEF2F2;
              border-color: #FECACA;
            }
            .summary-card-val {
              font-size: 28px;
              font-weight: 800;
              color: #064E3B;
            }
            .summary-card-lbl {
              font-size: 11px;
              color: #475569;
              font-weight: 700;
              margin-top: 4px;
            }
            .summary-card.urs .summary-card-val {
              color: #DC2626;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 24px;
            }
            th, td {
              padding: 12px 16px;
              text-align: left;
              border-bottom: 1px solid #E2E8F0;
              font-size: 14px;
            }
            th {
              background: #064E3B;
              color: #FFFFFF;
              font-size: 12px;
              font-weight: 700;
            }
            .status-badge {
              display: inline-block;
              background: #DCFCE7;
              color: #166534;
              font-weight: 800;
              padding: 8px 16px;
              border-radius: 20px;
              border: 1px solid #86EFAC;
              font-size: 14px;
            }
            .footer-notes {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #E2E8F0;
              font-size: 12px;
              color: #64748B;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="header-banner">
            <h1 class="title">${t.report.mainTitle}</h1>
            <div class="subtitle">${t.report.certSubtitle}</div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <div>
              <span style="font-size: 12px; color: #64748B; font-weight: 700;">${t.report.finalGradeLabel}</span>
              <div style="font-size: 22px; font-weight: 800; color: #064E3B; margin-top: 2px;">${overallGrade}</div>
            </div>
            <div class="status-badge">${aiAnalysisStatus}</div>
          </div>

          <div class="meta-box">
            <div class="meta-row">
              <span class="meta-label">${t.report.assessmentId}</span>
              <span class="meta-val">${assessmentId}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">${t.report.dateTime}</span>
              <span class="meta-val">${dateTimeFormatted}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">${t.report.batchId}</span>
              <span class="meta-val">${assessment.batch_id || 'LOT-SAMPLE'}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">${t.report.variety}</span>
              <span class="meta-val">${assessment.variety || t.newAssessment.varieties.red}</span>
            </div>
            <div class="meta-row">
              <span class="meta-label">${t.report.inspector}</span>
              <span class="meta-val">${user?.name || (language === 'ta' ? 'அங்கீகரிக்கப்பட்ட ஆய்வாளர்' : 'Certified Inspector')}</span>
            </div>
          </div>

          <div class="summary-cards">
            <div class="summary-card">
              <div class="summary-card-val">${totalOnions}</div>
              <div class="summary-card-lbl">${t.report.totalOnions}</div>
            </div>
            <div class="summary-card grade-a">
              <div class="summary-card-val">${gradeAPct}%</div>
              <div class="summary-card-lbl">${t.report.gradeAPct}</div>
            </div>
            <div class="summary-card urs">
              <div class="summary-card-val">${ursPct}%</div>
              <div class="summary-card-lbl">${t.report.ursPct}</div>
            </div>
          </div>

          <h3>${t.report.breakdownTitle}</h3>
          <table>
            <thead>
              <tr>
                <th>${t.report.colCategory}</th>
                <th style="text-align: center;">${t.report.colCount}</th>
                <th style="text-align: right;">${t.report.colPct}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>${t.categories.healthy}</strong></td>
                <td style="text-align: center;">${assessment.counts.healthy}</td>
                <td style="text-align: right; font-weight: bold; color: #059669;">${healthyPct}%</td>
              </tr>
              <tr>
                <td><strong>${t.categories.damaged}</strong></td>
                <td style="text-align: center;">${assessment.counts.damaged}</td>
                <td style="text-align: right; color: #D97706;">${damagedPct}%</td>
              </tr>
              <tr>
                <td><strong>${t.categories.rotten}</strong></td>
                <td style="text-align: center;">${assessment.counts.rotten}</td>
                <td style="text-align: right; color: #DC2626; font-weight: bold;">${rottenPct}%</td>
              </tr>
              <tr>
                <td><strong>${t.categories.sprouted}</strong></td>
                <td style="text-align: center;">${assessment.counts.sprouted}</td>
                <td style="text-align: right; color: #7C3AED;">${sproutedPct}%</td>
              </tr>
              <tr>
                <td><strong>${t.categories.undersized}</strong></td>
                <td style="text-align: center;">${assessment.counts.undersized}</td>
                <td style="text-align: right; color: #0284C7;">${undersizedPct}%</td>
              </tr>
            </tbody>
          </table>

          <div class="footer-notes">
            ${t.report.footerNotes}
          </div>
        </body>
      </html>
    `;
  };

  const handlePrintPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      const html = createReportHtml();
      const { uri } = await Print.printToFileAsync({ html });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: `${t.report.title} - ${assessment.batch_id || assessmentId.slice(0, 8)}`,
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert(t.report.pdfBtn, `PDF URI: ${uri}`);
      }
    } catch (err: any) {
      const cleanErr = typeof err?.message === 'string' && !err.message.includes('[object Object]')
        ? err.message
        : t.errors.unknownMsg;
      Alert.alert(t.errorOccurred, cleanErr);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleShareReport = async () => {
    try {
      const summaryText = `====================================
${t.report.mainTitle}
====================================
${t.report.assessmentId} ${assessmentId}
${t.report.dateTime} ${dateTimeFormatted}
${t.report.batchId} ${assessment.batch_id || 'LOT-SAMPLE'}

${t.report.totalOnions}: ${totalOnions}

${t.report.gradeAPct}: ${gradeAPct}%
${t.report.ursPct}: ${ursPct}%

${t.categories.healthy}: ${healthyPct}% (${assessment.counts.healthy})
${t.categories.damaged}: ${damagedPct}% (${assessment.counts.damaged})
${t.categories.rotten}: ${rottenPct}% (${assessment.counts.rotten})
${t.categories.sprouted}: ${sproutedPct}% (${assessment.counts.sprouted})
${t.categories.undersized}: ${undersizedPct}% (${assessment.counts.undersized})

${t.report.finalGradeLabel}: ${overallGrade} (${aiAnalysisStatus})
====================================`;

      await Share.share({
        title: `${t.report.title} - ${assessment.batch_id || assessmentId.slice(0, 8)}`,
        message: summaryText,
      });
    } catch (err: any) {
      const cleanErr = typeof err?.message === 'string' && !err.message.includes('[object Object]')
        ? err.message
        : t.errors.unknownMsg;
      Alert.alert(t.errorOccurred, cleanErr);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Header
        title={t.report.title}
        subtitle={t.report.subtitle}
        onBack={() => navigation.goBack()}
        showLangToggle
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.mainWrapper, isLargeScreen && styles.mainWrapperLarge]}>
          {/* Certificate Card */}
          <View style={[styles.certCard, SHADOWS.card]}>
            <View style={styles.certHeader}>
              <Text style={styles.badgeEmoji}>🧅</Text>
              <Text style={styles.mainTitle}>{t.report.mainTitle}</Text>
              <Text style={styles.subHeading}>{t.report.certSubtitle}</Text>
            </View>

            <View style={styles.divider} />

            {/* Meta Section */}
            <View style={styles.metaRowSection}>
              <View style={styles.metaField}>
                <Text style={styles.metaLabel}>{t.report.assessmentId}</Text>
                <Text style={styles.metaValue} selectable numberOfLines={1}>
                  {assessmentId}
                </Text>
              </View>

              <View style={styles.metaField}>
                <Text style={styles.metaLabel}>{t.report.dateTime}</Text>
                <Text style={styles.metaValue}>{dateTimeFormatted}</Text>
              </View>

              <View style={styles.metaField}>
                <Text style={styles.metaLabel}>{t.report.batchId}</Text>
                <Text style={styles.metaValue}>{assessment.batch_id || 'LOT-SAMPLE'}</Text>
              </View>

              <View style={styles.metaField}>
                <Text style={styles.metaLabel}>{t.report.variety}</Text>
                <Text style={styles.metaValue}>{assessment.variety || t.newAssessment.varieties.red}</Text>
              </View>
            </View>

            {/* KPI Row */}
            <View style={styles.kpiRow}>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiValue}>{totalOnions}</Text>
                <Text style={styles.kpiLabel}>{t.report.totalOnions}</Text>
              </View>

              <View style={[styles.kpiCard, styles.kpiCardGradeA]}>
                <Text style={[styles.kpiValue, { color: COLORS.categories.healthy }]}>{gradeAPct}%</Text>
                <Text style={styles.kpiLabel}>{t.report.gradeAPct}</Text>
              </View>

              <View style={[styles.kpiCard, styles.kpiCardUrs]}>
                <Text style={[styles.kpiValue, { color: COLORS.categories.rotten }]}>{ursPct}%</Text>
                <Text style={styles.kpiLabel}>{t.report.ursPct}</Text>
              </View>
            </View>

            {/* Category Table */}
            <Text style={styles.tableHeading}>{t.report.breakdownTitle}</Text>
            <View style={styles.tableBox}>
              <View style={styles.tableRowHeader}>
                <Text style={[styles.tableCol, styles.colName, styles.headerText]}>{t.report.colCategory}</Text>
                <Text style={[styles.tableCol, styles.colCount, styles.headerText]}>{t.report.colCount}</Text>
                <Text style={[styles.tableCol, styles.colPct, styles.headerText]}>{t.report.colPct}</Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={[styles.tableCol, styles.colName]}>{t.categories.healthy}</Text>
                <Text style={[styles.tableCol, styles.colCount]}>{assessment.counts.healthy}</Text>
                <Text style={[styles.tableCol, styles.colPct, { color: COLORS.categories.healthy, fontWeight: '700' }]}>
                  {healthyPct}%
                </Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={[styles.tableCol, styles.colName]}>{t.categories.damaged}</Text>
                <Text style={[styles.tableCol, styles.colCount]}>{assessment.counts.damaged}</Text>
                <Text style={[styles.tableCol, styles.colPct, { color: COLORS.categories.damaged, fontWeight: '700' }]}>
                  {damagedPct}%
                </Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={[styles.tableCol, styles.colName]}>{t.categories.rotten}</Text>
                <Text style={[styles.tableCol, styles.colCount]}>{assessment.counts.rotten}</Text>
                <Text style={[styles.tableCol, styles.colPct, { color: COLORS.categories.rotten, fontWeight: '700' }]}>
                  {rottenPct}%
                </Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={[styles.tableCol, styles.colName]}>{t.categories.sprouted}</Text>
                <Text style={[styles.tableCol, styles.colCount]}>{assessment.counts.sprouted}</Text>
                <Text style={[styles.tableCol, styles.colPct, { color: COLORS.categories.sprouted, fontWeight: '700' }]}>
                  {sproutedPct}%
                </Text>
              </View>

              <View style={[styles.tableRow, styles.lastTableRow]}>
                <Text style={[styles.tableCol, styles.colName]}>{t.categories.undersized}</Text>
                <Text style={[styles.tableCol, styles.colCount]}>{assessment.counts.undersized}</Text>
                <Text style={[styles.tableCol, styles.colPct, { color: COLORS.categories.undersized, fontWeight: '700' }]}>
                  {undersizedPct}%
                </Text>
              </View>
            </View>

            {/* AI Status */}
            <View style={styles.statusBox}>
              <Text style={styles.statusBoxLabel}>{t.report.statusLabel}</Text>
              <Text style={styles.statusBoxValue}>{aiAnalysisStatus}</Text>
            </View>

            {/* Overall Grade */}
            <View style={styles.gradeTierBox}>
              <Text style={styles.gradeTierLabel}>{t.report.assignedGradeLabel}</Text>
              <StatusBadge grade={overallGrade} size="medium" />
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.pdfButton, SHADOWS.card]}
              onPress={handlePrintPdf}
              disabled={isGeneratingPdf}
              activeOpacity={0.85}
            >
              {isGeneratingPdf ? (
                <ActivityIndicator color={COLORS.textInverse} size="small" />
              ) : (
                <Text style={styles.pdfButtonText}>{t.report.pdfBtn}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.shareButton} onPress={handleShareReport} activeOpacity={0.85}>
              <Text style={styles.shareButtonText}>{t.report.shareBtn}</Text>
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
    maxWidth: 780,
    alignSelf: 'center',
  },
  certCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  certHeader: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  badgeEmoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  mainTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.primaryDark,
    textAlign: 'center',
  },
  subHeading: {
    fontSize: 12,
    color: COLORS.primaryLight,
    marginTop: 2,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md,
  },
  metaRowSection: {
    backgroundColor: '#F0FDF4',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#D1FAE5',
    marginBottom: SPACING.md,
    gap: SPACING.xs + 2,
  },
  metaField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  metaValue: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  kpiRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  kpiCardGradeA: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  kpiCardUrs: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  tableHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primaryDark,
    marginBottom: SPACING.xs,
  },
  tableBox: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  tableRowHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  headerText: {
    color: COLORS.textInverse,
    fontWeight: '700',
    fontSize: 12,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
    alignItems: 'center',
    backgroundColor: COLORS.surface,
  },
  lastTableRow: {
    borderBottomWidth: 0,
  },
  tableCol: {
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  colName: {
    flex: 2,
    fontWeight: '600',
  },
  colCount: {
    flex: 1,
    textAlign: 'center',
  },
  colPct: {
    flex: 1.5,
    textAlign: 'right',
  },
  statusBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#D1FAE5',
    marginBottom: SPACING.md,
  },
  statusBoxLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primaryLight,
  },
  statusBoxValue: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primaryDark,
    marginTop: 2,
  },
  gradeTierBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderSubtle,
  },
  gradeTierLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  actionButtons: {
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  pdfButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  pdfButtonText: {
    color: COLORS.textInverse,
    fontSize: 15,
    fontWeight: '800',
  },
  shareButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.primaryLight,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  shareButtonText: {
    color: COLORS.primaryDark,
    fontSize: 14,
    fontWeight: '700',
  },
});
