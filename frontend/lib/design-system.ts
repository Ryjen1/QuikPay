/**
 * QuikPay Design System
 * TypeScript exports for design tokens
 */

export const colors = {
  primary: {
    900: '#0A1628',
    800: '#132340',
    700: '#1E3A5F',
    600: '#2B5278',
  },
  accent: {
    blue: '#4A90E2',
    blueDark: '#3A7BC8',
    blueLight: '#5BA3F5',
    teal: '#2DD4BF',
    tealDark: '#1DB8A5',
    tealLight: '#4DE0CC',
    amber: '#F59E0B',
    amberDark: '#D97706',
    amberLight: '#FBBF24',
    rose: '#FB7185',
    roseDark: '#F43F5E',
    roseLight: '#FDA4AF',
    violet: '#8B5CF6',
    violetDark: '#7C3AED',
    violetLight: '#A78BFA',
  },
  neutral: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  },
} as const;

export const spacing = {
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
} as const;

export const fontSize = {
  xs: '0.75rem',      // 12px
  sm: '0.875rem',     // 14px
  base: '1rem',       // 16px
  lg: '1.125rem',     // 18px
  xl: '1.25rem',      // 20px
  '2xl': '1.5rem',    // 24px
  '3xl': '1.875rem',  // 30px
  '4xl': '2.25rem',   // 36px
  '5xl': '3rem',      // 48px
  '6xl': '3.75rem',   // 60px
} as const;

export const fontWeight = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
} as const;

export const borderRadius = {
  sm: '0.25rem',   // 4px
  base: '0.5rem',  // 8px
  md: '0.75rem',   // 12px
  lg: '1rem',      // 16px
  xl: '1.5rem',    // 24px
  full: '9999px',
} as const;

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  md: '0 4px 12px rgba(0, 0, 0, 0.12)',
  lg: '0 8px 24px rgba(0, 0, 0, 0.16)',
  xl: '0 12px 32px rgba(0, 0, 0, 0.2)',
  '2xl': '0 24px 48px rgba(0, 0, 0, 0.3)',
  blue: '0 4px 12px rgba(74, 144, 226, 0.3)',
  teal: '0 4px 12px rgba(45, 212, 191, 0.3)',
  violet: '0 4px 12px rgba(139, 92, 246, 0.3)',
} as const;

export const transitions = {
  instant: '100ms',
  fast: '150ms',
  base: '250ms',
  slow: '350ms',
  slower: '500ms',
} as const;

export const easing = {
  in: 'cubic-bezier(0.4, 0, 1, 1)',
  out: 'cubic-bezier(0, 0, 0.2, 1)',
  inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
} as const;

export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

export const zIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  modalBackdrop: 40,
  modal: 50,
  popover: 60,
  tooltip: 70,
} as const;

// Semantic tokens
export const semantic = {
  bg: {
    primary: colors.primary[900],
    secondary: colors.primary[800],
    tertiary: colors.primary[700],
    elevated: colors.primary[600],
  },
  text: {
    primary: colors.neutral[50],
    secondary: colors.neutral[300],
    tertiary: colors.neutral[400],
    muted: colors.neutral[500],
    inverse: colors.primary[900],
  },
  border: {
    primary: 'rgba(255, 255, 255, 0.08)',
    secondary: 'rgba(255, 255, 255, 0.05)',
    focus: colors.accent.blue,
  },
  state: {
    success: colors.accent.teal,
    warning: colors.accent.amber,
    error: colors.accent.rose,
    info: colors.accent.blue,
  },
  interactive: {
    primary: colors.accent.blue,
    primaryHover: colors.accent.blueDark,
    primaryActive: colors.accent.blueDark,
  },
} as const;

// Helper function to get CSS variable
export const getCSSVar = (token: string): string => {
  return `var(--${token})`;
};

// Helper function for responsive breakpoints
export const mediaQuery = {
  sm: `@media (min-width: ${breakpoints.sm}px)`,
  md: `@media (min-width: ${breakpoints.md}px)`,
  lg: `@media (min-width: ${breakpoints.lg}px)`,
  xl: `@media (min-width: ${breakpoints.xl}px)`,
  '2xl': `@media (min-width: ${breakpoints['2xl']}px)`,
} as const;
