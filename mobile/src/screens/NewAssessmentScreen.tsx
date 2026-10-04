import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  useWindowDimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { COLORS, SPACING, RADIUS, SHADOWS, RESPONSIVE } from '../utils/theme';
import { Header } from '../components/Header';
import { useLanguage } from '../context/LanguageContext';

type NewAssessmentNavProp = NativeStackNavigationProp<RootStackParamList, 'NewAssessment'>;

interface Props {
  navigation: NewAssessmentNavProp;
}

export const NewAssessmentScreen: React.FC<Props> = ({ navigation }) => {
  const { t, language } = useLanguage();
  const defaultBatchId = `${language === 'ta' ? 'தொகுதி' : 'LOT'}-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
  const [batchId, setBatchId] = useState(defaultBatchId);
  const [variety, setVariety] = useState(t.newAssessment.varieties.red);
  const [notes, setNotes] = useState('');

  const { width } = useWindowDimensions();
  const isLargeScreen = width >= RESPONSIVE.tabletBreakpoint;

  const varieties = [
    t.newAssessment.varieties.red,
    t.newAssessment.varieties.white,
    t.newAssessment.varieties.yellow,
    t.newAssessment.varieties.shallot,
  ];

  // Navigate to Live Camera
  const proceedToCamera = () => {
    navigation.navigate('ImageCapture', {
      batchId,
      variety,
      notes,
    });
  };

  // Upload from Gallery / Device System (Properly passing URI string and asset)
  const proceedFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t.newAssessment.permissionTitle,
          t.newAssessment.permissionMsg
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        // Pass both string URI and asset to ensure React Native & Web extract cleanly
        navigation.navigate('AIProcessing', {
          imageUri: selectedAsset.uri,
          imageAsset: selectedAsset,
          batchId,
          variety,
          notes,
        });
      }
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
        title={t.newAssessment.title}
        subtitle={t.newAssessment.subtitle}
        onBack={() => navigation.goBack()}
        showLangToggle
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.mainWrapper, isLargeScreen && styles.mainWrapperLarge]}>
          {/* Input Details Card */}
          <View style={[styles.card, SHADOWS.card]}>
            <Text style={styles.cardHeading}>{t.newAssessment.batchDetails}</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.newAssessment.batchIdLabel}</Text>
              <TextInput
                style={styles.input}
                value={batchId}
                onChangeText={setBatchId}
                placeholder={t.newAssessment.batchIdPlaceholder}
                placeholderTextColor={COLORS.textMuted}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.newAssessment.varietyLabel}</Text>
              <View style={styles.varietyChips}>
                {varieties.map((v) => (
                  <TouchableOpacity
                    key={v}
                    style={[styles.chip, variety === v && styles.chipSelected]}
                    onPress={() => setVariety(v)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.chipText, variety === v && styles.chipTextSelected]}>
                      {v}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.newAssessment.notesLabel}</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder={t.newAssessment.notesPlaceholder}
                placeholderTextColor={COLORS.textMuted}
                multiline
                numberOfLines={3}
              />
            </View>
          </View>

          {/* Action Buttons: Live Camera & Gallery Upload */}
          <View style={styles.actionsContainer}>
            {/* Primary: Live Camera */}
            <TouchableOpacity
              style={[styles.cameraButton, SHADOWS.card]}
              onPress={proceedToCamera}
              activeOpacity={0.88}
            >
              <Text style={styles.buttonIcon}>📷</Text>
              <View style={styles.buttonTextWrapper}>
                <Text style={styles.cameraButtonText}>{t.newAssessment.cameraButtonText}</Text>
                <Text style={styles.cameraButtonSubText}>{t.newAssessment.cameraButtonSubText}</Text>
              </View>
            </TouchableOpacity>

            {/* Upload from Gallery / Device Storage */}
            <TouchableOpacity
              style={[styles.galleryButton, SHADOWS.subtle]}
              onPress={proceedFromGallery}
              activeOpacity={0.88}
            >
              <Text style={styles.buttonIcon}>🖼️</Text>
              <View style={styles.buttonTextWrapper}>
                <Text style={styles.galleryButtonText}>{t.newAssessment.galleryButtonText}</Text>
                <Text style={styles.galleryButtonSubText}>{t.newAssessment.galleryButtonSubText}</Text>
              </View>
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
    maxWidth: 620,
    alignSelf: 'center',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.lg,
  },
  cardHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primaryDark,
    marginBottom: SPACING.md,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  varietyChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  chip: {
    backgroundColor: COLORS.surfaceSubtle,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.sm + 4,
    paddingVertical: SPACING.xs + 3,
    borderRadius: RADIUS.full,
  },
  chipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  chipTextSelected: {
    color: COLORS.textInverse,
    fontWeight: '700',
  },
  actionsContainer: {
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  cameraButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#059669',
  },
  galleryButton: {
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.primaryLight,
  },
  buttonIcon: {
    fontSize: 26,
    marginRight: SPACING.md,
  },
  buttonTextWrapper: {
    flex: 1,
  },
  cameraButtonText: {
    color: COLORS.textInverse,
    fontSize: 15,
    fontWeight: '800',
  },
  cameraButtonSubText: {
    color: '#D1FAE5',
    fontSize: 11,
    marginTop: 2,
  },
  galleryButtonText: {
    color: COLORS.primaryDark,
    fontSize: 15,
    fontWeight: '800',
  },
  galleryButtonSubText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
});
