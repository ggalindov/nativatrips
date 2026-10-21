import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'coverage', '.lighthouseci'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended, reactHooks.configs.flat.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    rules: {
      // Revisa también las dependencias que se pasan a useConsulta, igual que con useMemo.
      'react-hooks/exhaustive-deps': ['error', { additionalHooks: '^useConsulta$' }],
      // Reglas pensadas para React Compiler, que el proyecto no usa. Pendiente en la deuda
      // técnica (R-10): mover a manejadores de eventos los estados que hoy se fijan en efectos.
      'react-hooks/set-state-in-effect': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['scripts/**/*.{js,mjs}', '*.config.{js,ts}'],
    languageOptions: { globals: globals.node },
  },
);
