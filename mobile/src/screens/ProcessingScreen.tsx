import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  useWindowDimensions,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList, AssessmentData } from '../types';
import { COLORS, SPACING, RADIUS, SHADOWS, RESPONSIVE } from '../utils/theme';
import { analyzeImageOnBackend, ApiError, ErrorType } from '../api/client';
import { useAssessment } from '../context/AssessmentContext';
import { useLanguage } from '../context/LanguageContext';

type ProcessingNavProp = NativeStackNavigationProp<RootStackParamList, 'AIProcessing'>;
type ProcessingRouteProp = RouteProp<RootStackParamList, 'AIProcessing'>;

interface Props {
  navigation: ProcessingNavProp;
  route: ProcessingRouteProp;
}

export const ProcessingScreen: React.FC<Props> = ({ navigation, route }) => {
  const { imageUri, batchId, variety, notes } = route.params;
  const { addAssessmentToCache } = useAssessment();
  const { t } = useLanguage();

  const [phaseIndex, setPhaseIndex] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<ErrorType | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(true);

  const { width } = useWindowDimensions();
  const isLargeScreen = width >= RESPONSIVE.tabletBreakpoint;

  const startAnalysis = async () => {
    setIsProcessing(true);
    setErrorMessage(null);
    setErrorType(null);
    setPhaseIndex(0); // Preparation phase

    try {
      setTimeout(() => {
        setPhaseIndex(1); // Analysis phase
      }, 700);

      const result: AssessmentData = await analyzeImageOnBackend({
        imageUri,
        batchId,
        variety,
        notes,
      });

      setPhaseIndex(2); // Done phase

      if (result.total_onions === 0 && (!result.detections || result.detections.length === 0)) {
        setIsProcessing(false);
        setErrorType('EMPTY_RESULT');
        setErrorMessage(t.errors.emptyResultMsg);
        return;
      }

      addAssessmentToCache(result);

      setTimeout(() => {
        setIsProcessing(false);
        navigation.replace('QualityResults', { assessment: result });
      }, 600);
    } catch (err: any) {
      setIsProcessing(false);
      if (err instanceof ApiError) {
        setErrorType(err.type);
        switch (err.type) {
          case 'NETWORK_FAILURE':
            setErrorMessage(t.errors.networkFailureMsg);
            break;
          case 'TIMEOUT':
            setErrorMessage(t.errors.timeoutMsg);
            break;
          case 'INVALID_IMAGE':
            setErrorMessage(t.errors.invalidImageMsg);
            break;
          case 'EMPTY_RESULT':
            setErrorMessage(t.errors.emptyResultMsg);
            break;
          case 'SERVER_ERROR':
            setErrorMessage(t.errors.serverErrorMsg);
            break;
          default:
            setErrorMessage(t.errors.unknownMsg);
        }
      } else {
        setErrorType('UNKNOWN');
        const cleanMsg = typeof err?.message === 'string' && !err.message.includes('[object Object]')
          ? err.message
          : t.errors.unknownMsg;
        setErrorMessage(cleanMsg);
      }
    }
  };

  useEffect(() => {
    startAnalysis();
  }, []);

  const getErrorHeader = () => {
    switch (errorType) {
      case 'NETWORK_FAILURE':
        return t.errors.networkFailureTitle;
      case 'TIMEOUT':
        return t.errors.timeoutTitle;
      case 'INVALID_IMAGE':
        return t.errors.invalidImageTitle;
      case 'EMPTY_RESULT':
        return t.errors.emptyResultTitle;
      case 'SERVER_ERROR':
        return t.errors.serverErrorTitle;
      default:
        return t.errors.unknownTitle;
    }
  };

  const getPhaseText = () => {
    if (phaseIndex === 0) return { title: t.processing.phasePrep, sub: t.processing.subPhasePrep };
    if (phaseIndex === 1) return { title: t.processing.phaseAnalyze, sub: t.processing.subPhaseAnalyze };
    return { title: t.processing.phaseDone, sub: t.processing.subPhaseDone };
  };

  const currentPhase = getPhaseText();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.mainWrapper, isLargeScreen && styles.mainWrapperLarge]}>
        {isProcessing ? (
          <View style={[styles.card, SHADOWS.card]}>
            <View style={styles.previewBox}>
              {imageUri && typeof imageUri === 'string' && !imageUri.startsWith('/dataset') ? (
                <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
              ) : (
                <View style={styles.placeholderBox}>
                  <Text style={styles.placeholderIcon}>🧅</Text>
                </View>
              )}
            </View>

            <Text style={styles.primaryPhaseText}>{currentPhase.title}</Text>
            <Text style={styles.subPhaseText}>{currentPhase.sub}</Text>

            <ActivityIndicator size="large" color={COLORS.primaryLight} style={styles.spinner} />

            <View style={styles.pipelineBox}>
              <View style={styles.pipelineStep}>
                <Text style={styles.stepDotActive}>●</Text>
                <Text style={styles.stepName}>{t.processing.step1}</Text>
              </View>
              <View style={styles.pipelineStep}>
                <Text style={styles.stepDotActive}>●</Text>
                <Text style={styles.stepName}>{t.processing.step2}</Text>
              </View>
              <View style={styles.pipelineStep}>
                <Text style={styles.stepDotActive}>●</Text>
                <Text style={styles.stepName}>{t.processing.step3}</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={[styles.card, styles.errorCard, SHADOWS.card]}>
            <View style={styles.errorIconBox}>
              <Text style={styles.errorIconText}>⚠</Text>
            </View>

            <Text style={styles.errorHeader}>{getErrorHeader()}</Text>
            <Text style={styles.errorMessage}>{errorMessage || t.errors.unknownMsg}</Text>

            <View style={styles.errorActionRow}>
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={startAnalysis}
                activeOpacity={0.85}
              >
                <Text style={styles.retryBtnText}>{t.processing.retry}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backCameraBtn}
                onPress={() => navigation.navigate('ImageCapture', { batchId, variety, notes })}
                activeOpacity={0.85}
              >
                <Text style={styles.backCameraBtnText}>{t.processing.backToCamera}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    padding: SPACING.md,
  },
  mainWrapper: {
    width: '100%',
  },
  mainWrapperLarge: {
    maxWidth: 580,
    alignSelf: 'center',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  previewBox: {
    width: 220,
    height: 160,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    backgroundColor: '#022C22',
    position: 'relative',
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: '#059669',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    opacity: 0.85,
  },
  placeholderBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderIcon: {
    fontSize: 40,
  },
  primaryPhaseText: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primaryDark,
    textAlign: 'center',
  },
  subPhaseText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  spinner: {
    marginVertical: SPACING.lg,
  },
  pipelineBox: {
    width: '100%',
    backgroundColor: '#F0FDF4',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#D1FAE5',
    gap: 8,
  },
  pipelineStep: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDotActive: {
    color: COLORS.accent,
    fontSize: 12,
    marginRight: 8,
  },
  stepName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primaryDark,
  },
  errorCard: {
    borderColor: '#FECACA',
    backgroundColor: '#FFF',
  },
  errorIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  errorIconText: {
    fontSize: 28,
    color: COLORS.danger,
  },
  errorHeader: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.lg,
    maxWidth: 360,
  },
  errorActionRow: {
    width: '100%',
    gap: SPACING.sm,
  },
  retryBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  retryBtnText: {
    color: COLORS.textInverse,
    fontSize: 14,
    fontWeight: '700',
  },
  backCameraBtn: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  backCameraBtnText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
});
