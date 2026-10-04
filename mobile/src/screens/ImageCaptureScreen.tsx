import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { RootStackParamList } from '../types';
import { COLORS, SPACING, RADIUS, SHADOWS, RESPONSIVE } from '../utils/theme';
import { Header } from '../components/Header';
import { useLanguage } from '../context/LanguageContext';

type ImageCaptureNavProp = NativeStackNavigationProp<RootStackParamList, 'ImageCapture'>;
type ImageCaptureRouteProp = RouteProp<RootStackParamList, 'ImageCapture'>;

interface Props {
  navigation: ImageCaptureNavProp;
  route: ImageCaptureRouteProp;
}

export const ImageCaptureScreen: React.FC<Props> = ({ navigation, route }) => {
  const { batchId, variety, notes } = (route.params as any) || {};
  const { t, language } = useLanguage();

  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [isProcessingFrame, setIsProcessingFrame] = useState<boolean>(false);
  const [readinessStatus, setReadinessStatus] = useState<string>(t.imageCapture.cameraInitializing);

  const videoRef = useRef<any>(null);
  const streamRef = useRef<any>(null);

  const { width } = useWindowDimensions();
  const isLargeScreen = width >= RESPONSIVE.tabletBreakpoint;

  useEffect(() => {
    let isMounted = true;
    initCamera(isMounted);

    return () => {
      isMounted = false;
      stopCameraResources();
    };
  }, []);

  const stopCameraResources = () => {
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach((track: any) => track.stop());
      } catch {}
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const initCamera = async (isMounted: boolean) => {
    if (Platform.OS === 'web') {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          if (isMounted) {
            setCameraPermission(false);
            setReadinessStatus(t.imageCapture.browserNotSupported);
          }
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (isMounted) {
          streamRef.current = stream;
          setCameraPermission(true);
          setCameraActive(true);
          setReadinessStatus(t.imageCapture.cameraReady);

          setTimeout(() => {
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              videoRef.current.play().catch(() => {});
            }
          }, 150);
        }
      } catch {
        if (isMounted) {
          setCameraPermission(false);
          setReadinessStatus(t.imageCapture.cameraPermissionDenied);
        }
      }
    } else {
      const { status } = await ImagePicker.getCameraPermissionsAsync();
      if (status === 'granted') {
        if (isMounted) {
          setCameraPermission(true);
          setCameraActive(true);
          setReadinessStatus(t.imageCapture.cameraSensorReady);
        }
      } else {
        const req = await ImagePicker.requestCameraPermissionsAsync();
        if (isMounted) {
          setCameraPermission(req.status === 'granted');
          setCameraActive(req.status === 'granted');
          setReadinessStatus(
            req.status === 'granted' ? t.imageCapture.cameraSensorReady : t.imageCapture.cameraPermissionDenied
          );
        }
      }
    }
  };

  // Capture photo from live camera
  const handleCaptureFromCamera = async () => {
    setIsProcessingFrame(true);

    if (Platform.OS === 'web') {
      if (!videoRef.current) {
        Alert.alert(t.imageCapture.errorTitle, t.imageCapture.notReadyAlert);
        setIsProcessingFrame(false);
        return;
      }

      try {
        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Failed to create canvas context');

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

        stopCameraResources();

        navigation.navigate('AIProcessing', {
          imageUri: dataUrl,
          batchId,
          variety,
          notes,
        });
      } catch (err: any) {
        Alert.alert(t.imageCapture.errorTitle, err.message || t.errors.unknownMsg);
      } finally {
        setIsProcessingFrame(false);
      }
    } else {
      try {
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
          quality: 0.85,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const selectedAsset = result.assets[0];
          stopCameraResources();

          navigation.navigate('AIProcessing', {
            imageUri: selectedAsset.uri,
            imageAsset: selectedAsset,
            batchId,
            variety,
            notes,
          });
        }
      } catch (err: any) {
        Alert.alert(t.imageCapture.errorTitle, err.message || t.errors.unknownMsg);
      } finally {
        setIsProcessingFrame(false);
      }
    }
  };

  // Pick from Gallery right from the camera screen
  const handlePickFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        stopCameraResources();

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
        title={t.imageCapture.title}
        subtitle={batchId || t.imageCapture.subtitle}
        onBack={() => {
          stopCameraResources();
          navigation.goBack();
        }}
        showLangToggle
      />

      <View style={[styles.mainContainer, isLargeScreen && styles.containerLarge]}>
        <View style={styles.cameraFrameWrapper}>
          {/* Live Camera Viewport */}
          <View style={styles.viewport}>
            {Platform.OS === 'web' ? (
              cameraPermission ? (
                <video
                  ref={videoRef}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    backgroundColor: '#022C22',
                  }}
                  autoPlay
                  playsInline
                  muted
                />
              ) : (
                <View style={styles.permissionBlockedBox}>
                  <Text style={styles.permissionIcon}>📷</Text>
                  <Text style={styles.permissionTitle}>{t.imageCapture.cameraPermissionDenied}</Text>
                  <Text style={styles.permissionSubtitle}>{t.imageCapture.permissionDesc}</Text>
                  <TouchableOpacity
                    style={styles.permissionRetryBtn}
                    onPress={() => initCamera(true)}
                  >
                    <Text style={styles.permissionRetryText}>{t.imageCapture.retryCamera}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.galleryFallbackBtn}
                    onPress={handlePickFromGallery}
                  >
                    <Text style={styles.galleryFallbackText}>{t.imageCapture.galleryFallback}</Text>
                  </TouchableOpacity>
                </View>
              )
            ) : (
              <View style={styles.nativeCameraPrompt}>
                <Text style={styles.nativeCameraIcon}>📹</Text>
                <Text style={styles.nativeCameraTitle}>{t.imageCapture.nativePromptTitle}</Text>
                <Text style={styles.nativeCameraSub}>{t.imageCapture.nativePromptSub}</Text>
              </View>
            )}

            {/* Center Inspection Reticle */}
            <View style={styles.reticleOverlay} pointerEvents="none">
              <View style={styles.centerTargetFrame}>
                <View style={[styles.cornerBracket, styles.bracketTL]} />
                <View style={[styles.cornerBracket, styles.bracketTR]} />
                <View style={[styles.cornerBracket, styles.bracketBL]} />
                <View style={[styles.cornerBracket, styles.bracketBR]} />

                <View style={styles.reticleLabelBox}>
                  <Text style={styles.reticleLabelText}>{t.imageCapture.frameTitle}</Text>
                  <Text style={styles.reticleSubLabel}>{t.imageCapture.frameSub}</Text>
                </View>
              </View>
            </View>

            {/* Status Ribbon Overlay */}
            <View style={styles.statusOverlay}>
              <View style={styles.sensorStatusPill}>
                <View style={[styles.pulseDot, { backgroundColor: cameraActive ? '#10B981' : '#EF4444' }]} />
                <Text style={styles.sensorStatusText}>{readinessStatus}</Text>
              </View>
            </View>
          </View>

          {/* Instruction Banner */}
          <View style={styles.instructionBanner}>
            <Text style={styles.instructionIcon}>💡</Text>
            <Text style={styles.instructionText}>{t.imageCapture.spreadInstruction}</Text>
          </View>

          {/* Action Buttons: Capture & Gallery */}
          <View style={styles.actionBar}>
            <TouchableOpacity
              style={styles.galleryBtn}
              onPress={handlePickFromGallery}
              activeOpacity={0.85}
            >
              <Text style={styles.galleryBtnText}>{t.imageCapture.galleryBtn}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.captureBtn,
                isProcessingFrame && styles.captureBtnDisabled,
                SHADOWS.hover,
              ]}
              onPress={handleCaptureFromCamera}
              disabled={isProcessingFrame}
              activeOpacity={0.88}
            >
              {isProcessingFrame ? (
                <ActivityIndicator color={COLORS.textInverse} size="small" />
              ) : (
                <>
                  <Text style={styles.captureBtnIcon}>📸</Text>
                  <Text style={styles.captureBtnText}>{t.imageCapture.captureBtn}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  mainContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: COLORS.background,
  },
  containerLarge: {
    maxWidth: 900,
    alignSelf: 'center',
    paddingVertical: SPACING.md,
  },
  cameraFrameWrapper: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: SPACING.md,
  },
  viewport: {
    flex: 1,
    minHeight: 380,
    backgroundColor: '#022C22',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#059669',
  },
  reticleOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerTargetFrame: {
    width: '80%',
    height: '70%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cornerBracket: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderColor: '#10B981',
  },
  bracketTL: {
    top: -2,
    left: -2,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  bracketTR: {
    top: -2,
    right: -2,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bracketBL: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bracketBR: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  reticleLabelBox: {
    backgroundColor: 'rgba(6, 78, 59, 0.85)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
  },
  reticleLabelText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ECFDF5',
  },
  reticleSubLabel: {
    fontSize: 10,
    color: '#A7F3D0',
    marginTop: 2,
  },
  statusOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sensorStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(6, 78, 59, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  sensorStatusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ECFDF5',
  },
  permissionBlockedBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  permissionIcon: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textInverse,
    textAlign: 'center',
  },
  permissionSubtitle: {
    fontSize: 13,
    color: '#A7F3D0',
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 320,
    lineHeight: 18,
  },
  permissionRetryBtn: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.md,
  },
  permissionRetryText: {
    color: COLORS.textInverse,
    fontSize: 13,
    fontWeight: '700',
  },
  galleryFallbackBtn: {
    marginTop: SPACING.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.md,
  },
  galleryFallbackText: {
    color: COLORS.textInverse,
    fontSize: 13,
    fontWeight: '700',
  },
  nativeCameraPrompt: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  nativeCameraIcon: {
    fontSize: 44,
    marginBottom: SPACING.sm,
  },
  nativeCameraTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textInverse,
  },
  nativeCameraSub: {
    fontSize: 12,
    color: '#A7F3D0',
    marginTop: 4,
    textAlign: 'center',
    maxWidth: 280,
  },
  instructionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    marginVertical: SPACING.md,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  instructionIcon: {
    fontSize: 16,
    marginRight: SPACING.sm,
  },
  instructionText: {
    fontSize: 12,
    color: COLORS.primaryDark,
    flex: 1,
    lineHeight: 16,
    fontWeight: '600',
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.sm,
  },
  galleryBtn: {
    backgroundColor: COLORS.surface,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.primaryLight,
    alignItems: 'center',
  },
  galleryBtnText: {
    color: COLORS.primaryDark,
    fontSize: 14,
    fontWeight: '700',
  },
  captureBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureBtnDisabled: {
    opacity: 0.6,
  },
  captureBtnIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  captureBtnText: {
    color: COLORS.textInverse,
    fontSize: 15,
    fontWeight: '800',
  },
});
