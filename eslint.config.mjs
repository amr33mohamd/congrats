import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const compat = new FlatCompat({ baseDirectory: __dirname });

// Flat config (ESLint 9) bridging the Next.js shareable config via FlatCompat.
const config = [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'remotion/**',
      '.claude/**',
      'drizzle/**',
      'next-env.d.ts',
      'tsconfig.tsbuildinfo',
    ],
  },
  ...compat.extends('next/core-web-vitals'),
];

export default config;
