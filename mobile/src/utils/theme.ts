import { Platform } from 'react-native';

export const COLORS = {
  // Fresh, Modern Agricultural Green & Minimal Light Palette
  primary: '#064E3B',        // Deep forest emerald green (Main brand)
  primaryLight: '#059669',   // Vibrant emerald green
  primaryDark: '#022C22',    // Deep organic dark green
  accent: '#10B981',         // Fresh mint green accent
  accentGlow: 'rgba(16, 185, 129, 0.15)',
  accentLaser: '#059669',
  steelBlue: '#4B5563',      // Neutral cool gray
  
  // Background & Surface
  background: '#F0FDF4',     // Ultra-fresh crisp mint-tinted light background
  backgroundDark: '#064E3B',
  surface: '#FFFFFF',        // Pure clean white card surface
  surfaceSubtle: '#F8FAFC',  // Subtle light card
  surfaceGlass: 'rgba(255, 255, 255, 0.95)',
  border: '#D1FAE5',         // Soft pastel green border
  borderSubtle: '#E2E8F0',   // Light slate border
  borderFocus: '#10B981',

  // Typography
  textPrimary: '#0F172A',    // Slate 900
  textSecondary: '#475569',  // Slate 600
  textMuted: '#94A3B8',      // Slate 400
  textInverse: '#FFFFFF',
  textCyan: '#059669',

  // 5 Quality Inspection Categories
  categories: {
    healthy: '#10B981',      // Fresh Leaf Green (ஆரோக்கியமானது)
    damaged: '#F59E0B',      // Warm Amber (சேதமடைந்தது)
    rotten: '#EF4444',       // Alert Crimson (அழுகியது)
    sprouted: '#8B5CF6',     // Violet Shoot (முளைவிட்டது)
    undersized: '#0284C7',   // Slate Blue (சிறிய அளவு)
  },

  // Category Background Pills
  categoryBg: {
    healthy: '#ECFDF5',
    damaged: '#FFFBEB',
    rotten: '#FEF2F2',
    sprouted: '#EDE9FE',
    undersized: '#F0F9FF',
  },

  // Grade Badges
  grades: {
    gradeA: {
      bg: '#DCFCE7',
      text: '#166534',
      border: '#86EFAC',
    },
    gradeB: {
      bg: '#FEF3C7',
      text: '#92400E',
      border: '#FDE047',
    },
    urs: {
      bg: '#FEE2E2',
      text: '#991B1B',
      border: '#FCA5A5',
    },
  },

  // Status
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#0284C7',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const SHADOWS = {
  subtle: {
    shadowColor: '#064E3B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  card: {
    shadowColor: '#064E3B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  hover: {
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.20,
    shadowRadius: 16,
    elevation: 6,
  },
};

// Responsive Design Constraints
export const RESPONSIVE = {
  maxContentWidth: 1060,
  tabletBreakpoint: 768,
  desktopBreakpoint: 1024,
};

export const isWeb = Platform.OS === 'web';
