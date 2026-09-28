import type { Config } from 'tailwindcss';

/**
 * Tailwind is configured to be RTL/LTR safe: we rely on logical properties
 * (margin-inline, inset-inline-*) and CSS custom-property design tokens declared
 * in app/globals.css. Colors/space/radius below are token-backed so designers
 * can extend with semantic classes without hard-coded hexes.
 */
const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Token-backed semantic aliases (see globals.css for raw ramps).
        brand: 'rgb(var(--color-brand) / <alpha-value>)',
        'brand-strong': 'rgb(var(--color-brand-strong) / <alpha-value>)',
        'brand-hover': 'rgb(var(--color-brand-hover) / <alpha-value>)',
        gold: 'rgb(var(--color-gold) / <alpha-value>)',
        ink: 'rgb(var(--color-ink) / <alpha-value>)',
        backdrop: 'rgb(var(--color-backdrop) / <alpha-value>)',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        'surface-2': 'rgb(var(--color-surface-2) / <alpha-value>)',
        muted: 'rgb(var(--color-muted) / <alpha-value>)',
        border: 'rgb(var(--color-border) / <alpha-value>)',
        success: 'rgb(var(--color-success) / <alpha-value>)',
        danger: 'rgb(var(--color-danger) / <alpha-value>)',
        warning: 'rgb(var(--color-warning) / <alpha-value>)',
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
