import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS, SPACING } from '../utils/theme';

interface LoadingStateProps {
  message?: string;
  submessage?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'தகவல் பெறப்படுகிறது...',
  submessage,
}) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={COLORS.primaryLight} />
      <Text style={styles.message}>{message}</Text>
      {submessage && <Text style={styles.submessage}>{submessage}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  message: {
    marginTop: SPACING.md,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primaryDark,
    textAlign: 'center',
  },
  submessage: {
    marginTop: SPACING.xs,
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});
