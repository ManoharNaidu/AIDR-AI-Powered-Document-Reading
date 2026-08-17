export interface Theme {
  bgApp: string;
  headerBg: string;
  leftPanelBg: string;
  centerSurroundBg: string;
  pageBg: string;
  rightPanelBg: string;
  borderColor: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  inputBg: string;
  bubbleAssistantBg: string;
  shadowColor: string;
  accent: string;
  accentSoft: string;
  accentContrast: string;
}

const BASE_ACCENT = '#0F766E';

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

function lighten(hex: string, percent: number): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  let r = (n >> 16) & 255;
  let g = (n >> 8) & 255;
  let b = n & 255;
  r = Math.round(r + (255 - r) * percent);
  g = Math.round(g + (255 - g) * percent);
  b = Math.round(b + (255 - b) * percent);
  return `rgb(${r},${g},${b})`;
}

export function buildTheme(darkMode: boolean): Theme {
  const accent = darkMode ? lighten(BASE_ACCENT, 0.55) : BASE_ACCENT;
  const accentSoft = darkMode ? hexToRgba(accent, 0.16) : hexToRgba(BASE_ACCENT, 0.12);
  const accentContrast = darkMode ? '#12251A' : '#FFFFFF';

  if (darkMode) {
    return {
      bgApp: '#191814', headerBg: '#201F1A', leftPanelBg: '#1E1D18', centerSurroundBg: '#141310',
      pageBg: '#242219', rightPanelBg: '#201F1A', borderColor: 'rgba(255,255,255,0.08)',
      textPrimary: '#EDEAE0', textSecondary: '#AFA99B', textMuted: '#7D7869',
      inputBg: '#242219', bubbleAssistantBg: '#242219', shadowColor: 'rgba(0,0,0,0.55)',
      accent, accentSoft, accentContrast,
    };
  }
  return {
    bgApp: '#FAFAF9', headerBg: '#FFFFFF', leftPanelBg: '#F4F2EC', centerSurroundBg: '#ECE9E1',
    pageBg: '#FFFEFB', rightPanelBg: '#F7F6F2', borderColor: 'rgba(33,31,27,0.10)',
    textPrimary: '#211F1B', textSecondary: '#5B564C', textMuted: '#8A8478',
    inputBg: '#FFFFFF', bubbleAssistantBg: '#FFFFFF', shadowColor: 'rgba(33,31,27,0.18)',
    accent, accentSoft, accentContrast,
  };
}

export const HIGHLIGHT_COLORS = ['#FDE68A', '#BBF7D0', '#BFDBFE', '#FBCFE8'];

/** Exposes every theme token as a CSS custom property for Tailwind arbitrary-value usage, e.g. bg-[var(--page-bg)]. */
export function themeToCssVars(theme: Theme): Record<string, string> {
  return {
    '--bg-app': theme.bgApp,
    '--header-bg': theme.headerBg,
    '--left-panel-bg': theme.leftPanelBg,
    '--center-surround-bg': theme.centerSurroundBg,
    '--page-bg': theme.pageBg,
    '--right-panel-bg': theme.rightPanelBg,
    '--border-color': theme.borderColor,
    '--text-primary': theme.textPrimary,
    '--text-secondary': theme.textSecondary,
    '--text-muted': theme.textMuted,
    '--input-bg': theme.inputBg,
    '--bubble-assistant-bg': theme.bubbleAssistantBg,
    '--shadow-color': theme.shadowColor,
    '--accent': theme.accent,
    '--accent-soft': theme.accentSoft,
    '--accent-contrast': theme.accentContrast,
  };
}
