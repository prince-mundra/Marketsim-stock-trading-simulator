export default {
  content: ['./index.html', './client/src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0c100d',
        panel: '#121814',
        panelSoft: '#171f19',
        line: '#28332b',
        lime: '#c9f36a',
        positive: '#9be37a',
        negative: '#fa8173',
        muted: '#8a978c',
        paper: '#f1f4ed',
      },
      fontFamily: {
        sans: ['Geist', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'monospace'],
      },
      boxShadow: { glow: '0 0 36px rgba(201, 243, 106, 0.12)' },
    },
  },
  plugins: [],
};
