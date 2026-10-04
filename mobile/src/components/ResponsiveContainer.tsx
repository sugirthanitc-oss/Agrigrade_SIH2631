import React from 'react';
import { View, StyleSheet, useWindowDimensions, StyleProp, ViewStyle, ScrollView } from 'react-native';
import { RESPONSIVE, SPACING, COLORS } from '../utils/theme';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  scrollable?: boolean;
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  style,
  contentContainerStyle,
  scrollable = false,
}) => {
  const { width } = useWindowDimensions();
  const isLargeScreen = width >= RESPONSIVE.tabletBreakpoint;

  if (scrollable) {
    return (
      <View style={[styles.outerWrapper, style]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            isLargeScreen && styles.largeScreenContent,
            contentContainerStyle,
          ]}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.outerWrapper, style]}>
      <View
        style={[
          styles.container,
          isLargeScreen && styles.largeScreenContent,
          contentContainerStyle,
        ]}
      >
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerWrapper: {
    flex: 1,
    backgroundColor: COLORS.background,
    width: '100%',
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    width: '100%',
    paddingBottom: SPACING.xxl,
  },
  container: {
    flex: 1,
    width: '100%',
  },
  largeScreenContent: {
    maxWidth: RESPONSIVE.maxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: SPACING.lg,
  },
});
