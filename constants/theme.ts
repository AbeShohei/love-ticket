/**
 * App Theme - Unified color palette
 */

export const colors = {
  // Primary colors
  primary: '#fd297b',
  primaryLight: '#FF8F8F',
  primaryDark: '#FF4B4B',

  // Secondary colors (blue)
  secondary: '#54a0ff',
  secondaryLight: '#00d2d3',

  // Accent colors (purple)
  accent: '#8854d0',
  accentLight: '#a29bfe',

  // Text colors
  text: {
    primary: '#333',
    secondary: '#666',
    muted: '#999',
    light: '#fff',
  },

  // Background colors
  background: {
    primary: '#fff',
    secondary: '#f8f9fa',
    tertiary: '#f0f0f0',
    card: '#f5f6fa',
  },

  // Status colors
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#FF3B30',
  info: '#54a0ff',

  // Border colors
  border: {
    light: '#eee',
    medium: '#ddd',
    dark: '#ccc',
  },

  // Ring colors (for progress rings)
  ring: {
    sent: '#FF4B4B',
    sentLight: '#FF8F8F',
    received: '#54a0ff',
    receivedLight: '#00d2d3',
    achievement: '#8854d0',
    achievementLight: '#a29bfe',
  },
};

export const gradients = {
  sent: ['#FF4B4B', '#FF8F8F'],
  received: ['#54a0ff', '#00d2d3'],
  achievement: ['#8854d0', '#a29bfe'],
};

export default { colors, gradients };
