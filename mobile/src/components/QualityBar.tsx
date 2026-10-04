import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, RADIUS } from '../utils/theme';
import { CategoryPercentages, CategoryCounts } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface QualityBarProps {
  percentages: CategoryPercentages;
  counts?: CategoryCounts;
  total?: number;
}

export const QualityBar: React.FC<QualityBarProps> = ({ percentages, counts, total }) => {
  const { t } = useLanguage();

  const items = [
    { key: 'healthy', label: t.categories.healthy, color: COLORS.categories.healthy, pct: percentages.healthy, count: counts?.healthy },
    { key: 'damaged', label: t.categories.damaged, color: COLORS.categories.damaged, pct: percentages.damaged, count: counts?.damaged },
    { key: 'rotten', label: t.categories.rotten, color: COLORS.categories.rotten, pct: percentages.rotten, count: counts?.rotten },
    { key: 'sprouted', label: t.categories.sprouted, color: COLORS.categories.sprouted, pct: percentages.sprouted, count: counts?.sprouted },
    { key: 'undersized', label: t.categories.undersized, color: COLORS.categories.undersized, pct: percentages.undersized, count: counts?.undersized },
  ];

  return (
    <View style={styles.container}>
      {/* Segmented bar */}
      <View style={styles.barTrack}>
        {items.map((item) => {
          if (item.pct <= 0) return null;
          return (
            <View
              key={item.key}
              style={[
                styles.barSegment,
                {
                  backgroundColor: item.color,
                  flex: item.pct,
                },
              ]}
            />
          );
        })}
      </View>

      {/* Grid Legend */}
      <View style={styles.legendGrid}>
        {items.map((item) => (
          <View key={item.key} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: item.color }]} />
            <Text style={styles.legendLabel}>{item.label}:</Text>
            <Text style={styles.legendValue}>
              {item.pct.toFixed(1)}% {item.count !== undefined && `(${item.count})`}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.sm,
  },
  barTrack: {
    height: 14,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.border,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  barSegment: {
    height: '100%',
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: RADIUS.full,
    marginRight: 6,
  },
  legendLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginRight: 4,
  },
  legendValue: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
});
