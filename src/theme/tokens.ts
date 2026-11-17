/** Single source of truth for design tokens, consumed by both the Joy and Material themes. */
export const tokens = {
  brand: {
    50: '#eef2ff',
    100: '#e0e7ff',
    200: '#c7d2fe',
    300: '#a5b4fc',
    400: '#818cf8',
    500: '#6366f1',
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
  },
  fontFamily: '"Inter", "Segoe UI", system-ui, -apple-system, sans-serif',
  radius: { sm: 6, md: 10, lg: 14 },
  sidebar: { width: 232, collapsedWidth: 68 },
  breakpoints: { sm: 600, md: 900, lg: 1200 },
} as const;
