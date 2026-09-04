import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Phosphor 아이콘은 로컬 서브셋(src/components/icons/phosphor)에서만 가져온다.
      // 원본 패키지는 아이콘마다 6굵기를 전부 번들에 싣는다 — scripts/gen-phosphor-icons.mjs 참고.
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@phosphor-icons/react',
              message: "'components/icons/phosphor' 에서 import 하고 `npm run gen:icons` 를 실행하세요.",
            },
          ],
        },
      ],
      // `_` 접두사는 "쓰지 않는 걸 알고 남겨 둔 것"이라는 관례 —
      // 시그니처를 맞추려고 남긴 인자(_keyword)까지 에러로 만들 필요는 없다.
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
])
