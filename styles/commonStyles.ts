
import { StyleSheet } from 'react-native';

// Zen Minimal Color Scheme
export const colors = {
  // Light mode
  light: {
    background: '#FAFAFA',
    text: '#1A1A1A',
    textSecondary: '#6B7280',
    primary: '#4F46E5',
    secondary: '#8B5CF6',
    accent: '#EC4899',
    card: '#FFFFFF',
    highlight: '#F3F4F6',
    border: '#E5E7EB',
    success: '#10B981',
    error: '#EF4444',
  },
  // Dark mode
  dark: {
    background: '#0F172A',
    text: '#F1F5F9',
    textSecondary: '#94A3B8',
    primary: '#6366F1',
    secondary: '#A78BFA',
    accent: '#F472B6',
    card: '#1E293B',
    highlight: '#334155',
    border: '#334155',
    success: '#34D399',
    error: '#F87171',
  },
};

export const habitColors = [
  '#4F46E5', // Indigo
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#EF4444', // Red
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#06B6D4', // Cyan
  '#3B82F6', // Blue
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
    padding: 24,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    elevation: 2,
  },
  shadow: {
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    elevation: 2,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  body: {
    fontSize: 17,
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    lineHeight: 20,
  },
  button: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
  },
});
