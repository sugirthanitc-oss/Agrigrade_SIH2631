import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, RADIUS, SPACING } from '../utils/theme';
import { QualityGrade } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface StatusBadgeProps {
  grade: QualityGrade;
  size?: 'small' | 'medium' | 'large';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ grade, size = 'medium' }) => {
  const { t } = useLanguage();

  const getStyle = () => {
    switch (grade) {
      case 'Grade A':
        return COLORS.grades.gradeA;
      case 'Grade B':
        return COLORS.grades.gradeB;
      case 'URS':
      default:
        return COLORS.grades.urs;
    }
  };

  const getLabel = () => {
    if (size === 'small') {
      if (grade === 'Grade A') return t.grades.gradeAShort;
      if (grade === 'Grade B') return t.grades.gradeBShort;
      return t.grades.ursShort;
    }
    if (grade === 'Grade A') return t.grades.gradeA;
    if (grade === 'Grade B') return t.grades.gradeB;
    return t.grades.urs;
  };

  const styleConfig = getStyle();
  const isLarge = size === 'large';
  const isSmall = size === 'small';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: styleConfig.bg,
          borderColor: styleConfig.border,
          paddingHorizontal: isSmall ? SPACING.xs + 4 : isLarge ? SPACING.md : SPACING.sm + 4,
          paddingVertical: isSmall ? 3 : isLarge ? SPACING.xs + 2 : 4,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: styleConfig.text,
            fontSize: isSmall ? 10 : isLarge ? 15 : 12,
            fontWeight: isLarge ? '800' : '700',
          },
        ]}
      >
        {getLabel()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: RADIUS.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    letterSpacing: 0.2,
  },
});
