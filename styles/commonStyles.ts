
import { StyleSheet } from 'react-native';

// Modern Neutral Color Scheme - Sleek & Professional
export const colors = {
  // Light mode - Clean whites and grays
  light: {
    background: '#FFFFFF',
    backgroundSecondary: '#F8F9FA',
    text: '#1A1A1A',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    primary: '#3B82F6', // Calm blue accent
    primaryLight: '#DBEAFE',
    card: '#FFFFFF',
    cardBorder: '#E5E7EB',
    highlight: '#F3F4F6',
    border: '#E5E7EB',
    success: '#10B981',
    error: '#EF4444',
    shadow: 'rgba(0, 0, 0, 0.08)',
  },
  // Dark mode - Tuned contrast
  dark: {
    background: '#0A0A0A',
    backgroundSecondary: '#1A1A1A',
    text: '#FFFFFF',
    textSecondary: '#A1A1AA',
    textTertiary: '#71717A',
    primary: '#60A5FA', // Lighter blue for dark mode
    primaryLight: '#1E3A8A',
    card: '#1A1A1A',
    cardBorder: '#27272A',
    highlight: '#27272A',
    border: '#27272A',
    success: '#34D399',
    error: '#F87171',
    shadow: 'rgba(0, 0, 0, 0.4)',
  },
};

export const habitColors = [
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#EF4444', // Red
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#06B6D4', // Cyan
  '#6366F1', // Indigo
];

export const habitIcons = [
  '💪', '📚', '🧘', '💧', '✍️', '🏃', '🎯', '🌟',
  '🎨', '🎵', '🍎', '😴', '🧠', '❤️', '🌱', '☀️',
];

export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    borderRadius: 16,
    padding: 20,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  shadow: {
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  // Typography hierarchy - larger headers, readable body
  title: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  heading: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  body: {
    fontSize: 17,
    lineHeight: 24,
  },
  bodyBold: {
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 24,
  },
  caption: {
    fontSize: 15,
    lineHeight: 20,
  },
  small: {
    fontSize: 13,
    lineHeight: 18,
  },
  // Button styles - consistent across app
  buttonPrimary: {
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  buttonSecondary: {
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    borderWidth: 1.5,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
  },
});
