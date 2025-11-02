// Theme Configuration for Elevated Movements AI Mobile App

export const colors = {
  // Primary Brand Colors
  primary: '#6C63FF',
  primaryLight: '#9D97FF',
  primaryDark: '#4338CA',

  // Secondary Colors
  secondary: '#FF6584',
  secondaryLight: '#FFB3C1',
  secondaryDark: '#C9184A',

  // Neutral Colors
  background: '#F5F7FA',
  backgroundDark: '#1a1a2e',
  surface: '#FFFFFF',
  surfaceDark: '#2D2D44',

  // Text Colors
  text: '#1F2937',
  textSecondary: '#6B7280',
  textLight: '#9CA3AF',
  textDark: '#FFFFFF',

  // Status Colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Accent Colors
  accent1: '#8B5CF6',
  accent2: '#EC4899',
  accent3: '#14B8A6',

  // Chart Colors
  chart1: '#6366F1',
  chart2: '#8B5CF6',
  chart3: '#EC4899',
  chart4: '#F59E0B',
  chart5: '#10B981',

  // UI Elements
  border: '#E5E7EB',
  borderDark: '#374151',
  shadow: 'rgba(0, 0, 0, 0.1)',
  overlay: 'rgba(0, 0, 0, 0.5)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 9999,
};

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const fontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
};

export const theme = {
  colors,
  spacing,
  borderRadius,
  fontSize,
  fontWeight,
  shadows,
};

export type Theme = typeof theme;
