import type { Config } from 'tailwindcss';

/**
 * Tailwind is configured to be RTL/LTR safe: we rely on logical properties
 * (margin-inline, inset-inline-*) and CSS custom-property design tokens declared
 * in app/globals.css. Colors/space/radius below are token-backed so designers
 * can extend with semantic classes without hard-coded hexes.
 */
const config: Config = {
  // hover: styles only where a real hover exists. On iPhones a tap that
  // changes :hover styling is swallowed as a hover, so links needed two taps.
  future: { hoverOnlyWhenSupported: true },
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Token-backed semantic aliases (see globals.css for raw ramps).
        brand: {
          DEFAULT: 'rgb(var(--color-brand) / <alpha-value>)',
          // Raw rose ramp for illustration/marketing surfaces; UI should prefer
          // the semantic aliases (brand, brand-strong, brand-hover).
          50: 'rgb(var(--c-brand-50) / <alpha-value>)',
          100: 'rgb(var(--c-brand-100) / <alpha-value>)',
          200: 'rgb(var(--c-brand-200) / <alpha-value>)',
          300: 'rgb(var(--c-brand-300) / <alpha-value>)',
          400: 'rgb(var(--c-brand-400) / <alpha-value>)',
          500: 'rgb(var(--c-brand-500) / <alpha-value>)',
          600: 'rgb(var(--c-brand-600) / <alpha-value>)',
          700: 'rgb(var(--c-brand-700) / <alpha-value>)',
          800: 'rgb(var(--c-brand-800) / <alpha-value>)',
          900: 'rgb(var(--c-brand-900) / <alpha-value>)',
        },
        'brand-signature': 'rgb(var(--color-brand-signature) / <alpha-value>)',
        'on-brand': 'rgb(var(--color-on-brand) / <alpha-value>)',
        'brand-strong': 'rgb(var(--color-brand-strong) / <alpha-value>)',
        'brand-hover': 'rgb(var(--color-brand-hover) / <alpha-value>)',
        gold: 'rgb(var(--color-gold) / <alpha-value>)',
        ink: 'rgb(var(--color-ink) / <alpha-value>)',
        backdrop: 'rgb(var(--color-backdrop) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        'surface-2': 'rgb(var(--color-surface-2) / <alpha-value>)',
        'surface-3': 'rgb(var(--color-surface-3) / <alpha-value>)',
        stage: 'rgb(var(--color-stage) / <alpha-value>)',
        muted: 'rgb(var(--color-muted) / <alpha-value>)',
        border: 'rgb(var(--color-border) / <alpha-value>)',
        success: 'rgb(var(--color-success) / <alpha-value>)',
        danger: 'rgb(var(--color-danger) / <alpha-value>)',
        warning: 'rgb(var(--color-warning) / <alpha-value>)',
        info: 'rgb(var(--color-info) / <alpha-value>)',
      },
      // `bg-brand` must carry white text (≥ 4.5:1) while `text-brand` must read
      // on near-black (≥ 4.5:1) — no single rose does both, so text utilities
      // resolve `brand` to its own token. Deep-merged: the ramp stays intact.
      textColor: {
        brand: { DEFAULT: 'rgb(var(--color-brand-text) / <alpha-value>)' },
      },
      // Tailwind's ring offset defaults to white, which draws a bright halo
      // around every focused control on a dark page.
      ringOffsetColor: {
        DEFAULT: 'rgb(var(--color-surface-2))',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        arch: 'var(--radius-arch)',
        pill: 'var(--radius-pill)',
      },
      spacing: {
        // Logical spacing scale aliases.
        'token-1': 'var(--space-1)',
        'token-2': 'var(--space-2)',
        'token-3': 'var(--space-3)',
        'token-4': 'var(--space-4)',
        'token-6': 'var(--space-6)',
        'token-8': 'var(--space-8)',
      },
      fontFamily: {
        // Bound to next/font CSS variables set per-locale in the locale layout.
        heading: ['var(--font-heading)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
        // Brand display face (AR: Aref Ruqaa, EN: Fredoka). Short festive
        // phrases only — never paragraphs or UI labels.
        display: ['var(--font-display, var(--font-heading))', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        display: ['var(--text-display)', { lineHeight: 'var(--leading-tight)' }],
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        pop: 'var(--shadow-pop)',
        glow: 'var(--shadow-glow)',
      },
      transitionTimingFunction: {
        emphasized: 'var(--ease-emphasized)',
        standard: 'var(--ease-standard)',
      },
    },
  },
  plugins: [],
};

export default config;
