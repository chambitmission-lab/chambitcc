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
      // eslint-plugin-react-hooks 6.x 의 React Compiler 진단 규칙과 react-refresh 규칙은
      // 당장 버그가 아닌 기존 패턴(localStorage 동기화 effect·ref 초기화·상수 export 등)
      // 48곳을 에러로 잡아 lint 가 게이트 구실을 못 했다. 경고로 두고 새 코드에서 줄여 간다.
      // 실제 결함(exhaustive-deps 등 recommended 의 나머지)은 그대로 에러.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/use-memo': 'warn',
      'react-refresh/only-export-components': 'warn',
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
